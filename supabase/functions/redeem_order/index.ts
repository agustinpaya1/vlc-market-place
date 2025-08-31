import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ed from "https://esm.sh/@noble/ed25519@1.7.3";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const te = new TextEncoder();

function parseJws(jws: string) {
  const [h, p, s] = jws.split('.');
  if (!h || !p || !s) throw new Error('Invalid JWS');
  const header = JSON.parse(atob(h.replace(/-/g, '+').replace(/_/g, '/')));
  const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  return { header, payload, h, p, s };
}

function b64uToBytes(b64u: string): Uint8Array {
  const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
  const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { jws } = await req.json();
    if (!jws) {
      return new Response(JSON.stringify({ success: false, reason: 'jws required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { header, payload, h, p, s } = parseJws(jws);

    // Load public key by kid
    const { data: key, error: eKey } = await supabase
      .from('keys')
      .select('public_key, status')
      .eq('id', header.kid)
      .single();
    if (eKey || !key) throw new Error('Key not found');
    if (key.status === 'revoked') throw new Error('Key revoked');

    // Verify signature
    const ok = await ed.verify(b64uToBytes(s), te.encode(`${h}.${p}`), b64uToBytes(key.public_key));
    if (!ok) throw new Error('Invalid signature');

    // Check time window
    const now = Math.floor(Date.now() / 1000);
    if (payload.nbf && now < payload.nbf) throw new Error('Not before');
    if (payload.exp && now > payload.exp) throw new Error('Expired');

    // Mark order completed and insert validation
    await supabase.from('orders').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', payload.oid);
    await supabase.from('validations').insert({
      order_id: payload.oid,
      store_id: payload.sid,
      validator_user_id: null,
      method: 'online',
      result: 'success'
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, reason: String((err as any)?.message ?? err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


