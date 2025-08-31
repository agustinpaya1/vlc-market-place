-- Secure RLS for public.keys: deny all from REST clients
ALTER TABLE public.keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE tablename = 'keys'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.keys', pol.policyname);
  END LOOP;
END $$;

-- Deny all: no select/update/insert/delete via RLS
CREATE POLICY keys_no_read  ON public.keys FOR SELECT USING (false);
CREATE POLICY keys_no_write ON public.keys FOR ALL    USING (false) WITH CHECK (false);

-- Optional: ensure columns not used are ignored (to be dropped later)
-- ALTER TABLE public.keys DROP COLUMN IF EXISTS private_key;
-- ALTER TABLE public.keys DROP COLUMN IF EXISTS private_key_hash;


