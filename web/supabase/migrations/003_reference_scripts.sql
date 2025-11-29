create table reference_scripts (
  id uuid default gen_random_uuid() primary key,
  script_name text not null unique,
  tx_hash text not null,
  output_index integer not null,
  script_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table reference_scripts enable row level security;

create policy "Enable read access for all users"
on reference_scripts for select
using (true);

create policy "Enable insert for authenticated users only"
on reference_scripts for insert
with check (auth.role() = 'authenticated');
