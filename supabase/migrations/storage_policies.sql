-- Disable RLS on storage.objects temporarily for setup
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create the profile-photos bucket if not exists
-- This should be done via Supabase dashboard or with a service role

-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage the bucket
CREATE POLICY "Service role can manage profile photos bucket"
ON storage.objects
FOR ALL
USING (
  -- Replace with your service role's JWT claims
  request_var('role') = 'service_role'
);

-- Policy to allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own profile photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  bucket_id = 'profile-photos' AND
  -- Ensure filename starts with user's ID
  split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%')
);

-- Policy to allow users to view their own photos
CREATE POLICY "Users can view their own profile photos"
ON storage.objects
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  bucket_id = 'profile-photos' AND
  split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%')
);

-- Policy to allow users to update their own photos
CREATE POLICY "Users can update their own profile photos"
ON storage.objects
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  bucket_id = 'profile-photos' AND
  split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%')
);

-- Policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own profile photos"
ON storage.objects
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  bucket_id = 'profile-photos' AND
  split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%')
);

-- Ensure the profiles table can be updated with avatar URL
CREATE POLICY "Users can update their own avatar URL"
ON profiles
FOR UPDATE
USING (auth.uid() = id); 