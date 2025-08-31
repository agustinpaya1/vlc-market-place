// Minimal sign_qr Edge Function with CORS and service-role client
// NOTE: This implementation generates/stores a dev private key without encryption
// Replace with AES-GCM + KEK in production as per your security plan

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ed from "https://esm.sh/@noble/ed25519@1.7.3";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const te = new TextEncoder();

function b64uBytes(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64u(data: string | Uint8Array): string {
  if (data instanceof Uint8Array) return b64uBytes(data);
  return b64uBytes(te.encode(data));
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('\\x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const normalized = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(normalized);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

function normalizeToBytes(value: unknown): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) return hexToBytes(value);
    // could be base64/base64url
    return base64ToBytes(value);
  }
  if (Array.isArray(value)) return new Uint8Array(value as number[]);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    console.log('sign_qr invoked', { order_id });
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { 'X-Client-Info': 'edge-sign_qr' } }
    });

    // 1) Load order
    const { data: order, error: eOrder } = await supabase
      .from('orders')
      .select('id, store_id, status')
      .eq('id', order_id)
      .single();

    if (eOrder || !order) {
      console.error('Order fetch error', eOrder);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('order loaded', order);

    // 2) Ensure active key exists for store
    const { data: keyRow, error: eKey } = await supabase
      .from('keys')
      .select('id, public_key, private_key_ciphertext, private_key_nonce, status')
      .eq('store_id', order.store_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    let kid = keyRow?.id as string | undefined;
    let pubB64u = keyRow?.public_key as string | undefined;
    let privRaw = normalizeToBytes(keyRow?.private_key_ciphertext) || undefined; // DEV ONLY
    console.log('active key found?', Boolean(kid));

    if (!kid) {
      // DEV path: generate keypair and store raw private (replace with AES-GCM in prod)
      const privateKey = crypto.getRandomValues(new Uint8Array(32));
      const publicKey = await ed.getPublicKey(privateKey);
      kid = crypto.randomUUID();
      pubB64u = b64uBytes(publicKey);
      privRaw = privateKey;

      const ins = await supabase
        .from('keys')
        .insert({
          id: kid,
          store_id: order.store_id,
          alg: 'Ed25519',
          public_key: pubB64u,
          private_key_ciphertext: privRaw,
          private_key_nonce: new Uint8Array(),
          kek_version: 'dev',
          status: 'active',
          not_before: new Date().toISOString()
        })
        .select('id')
        .single();
      if (ins.error) {
        console.error('key insert error', ins.error);
        throw ins.error;
      }
    }

    // 3) Build header & payload
    const header = { alg: 'Ed25519', kid, v: 1 };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      oid: order.id,
      sid: order.store_id,
      nbf: now - 5,
      exp: now + 24 * 3600,
      nonce: b64uBytes(crypto.getRandomValues(new Uint8Array(16))),
      aud: 'vlc-market-place',
      purpose: 'pickup'
    };

    const h = b64u(JSON.stringify(header));
    const p = b64u(JSON.stringify(payload));

    // 4) Sign (DEV: using raw private key). Replace with decrypted private key in prod.
    const sig = await ed.sign(te.encode(`${h}.${p}`), privRaw!);
    const jws = `${h}.${p}.${b64uBytes(sig)}`;

    // 5) Upsert qr_codes (requires non-null code per your schema)
    const code = crypto.randomUUID();
    console.log('upserting qr_codes for order', order.id);
    const up = await supabase
      .from('qr_codes')
      .upsert({
        order_id: order.id,
        store_id: order.store_id,
        key_id: kid,
        code,
        jws,
        payload,
        nbf: new Date((now - 5) * 1000).toISOString(),
        exp: new Date((now + 24 * 3600) * 1000).toISOString()
      }, { onConflict: 'order_id' });
    if (up.error) {
      console.error('qr_codes upsert error', up.error);
      throw up.error;
    }

    return new Response(JSON.stringify({ jws, payload, code }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('sign_qr error', err);
    return new Response(JSON.stringify({ error: String((err as any)?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


