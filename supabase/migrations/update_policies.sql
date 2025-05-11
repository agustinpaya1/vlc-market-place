-- Drop existing policies
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can insert their own business profile" on business_profiles;

-- Create policies for profiles table
create policy "Enable insert for authentication service"
  on profiles for insert
  using ( true );

create policy "Enable select for users based on user_id"
  on profiles for select
  using ( auth.uid() = id );

create policy "Enable update for users based on user_id"
  on profiles for update
  using ( auth.uid() = id );

-- Create policies for business_profiles table
create policy "Enable insert for authentication service on business"
  on business_profiles for insert
  using ( true );

create policy "Enable select for business users based on user_id"
  on business_profiles for select
  using ( auth.uid() = id );

create policy "Enable update for business users based on user_id"
  on business_profiles for update
  using ( auth.uid() = id );

-- Enable anon access for profile creation during registration
create policy "Enable profile creation during registration"
  on profiles for insert
  with check (true);

create policy "Enable business profile creation during registration"
  on business_profiles for insert
  with check (true);

-- Add comprehensive RLS policy for profile-photos storage bucket
CREATE OR REPLACE POLICY "Users can manage their own profile photos"
  ON storage.objects FOR ALL
  USING (
    auth.uid() IS NOT NULL AND 
    bucket_id = 'profile-photos' AND 
    -- Ensure the file name starts with the user's ID
    split_part(name, '/', 2) LIKE concat(auth.uid()::text, '-%')
  ); 