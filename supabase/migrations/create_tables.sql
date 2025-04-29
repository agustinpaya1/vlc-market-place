-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  type text check (type in ('user', 'business')),
  vlcoin_balance integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for business profiles
create table business_profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text not null,
  tax_id text not null,
  address text not null,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table business_profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can view their own business profile"
  on business_profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own business profile"
  on business_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own business profile"
  on business_profiles for insert
  with check ( auth.uid() = id );

-- Create functions to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_profiles_updated_at
  before update on profiles
  for each row
  execute procedure handle_updated_at();

create trigger handle_business_profiles_updated_at
  before update on business_profiles
  for each row
  execute procedure handle_updated_at(); 