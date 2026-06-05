-- HeadCount contacts table
create table if not exists contacts (
  id          uuid primary key,
  user_id     uuid not null references auth.users on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Row-level security: users can only see their own contacts
alter table contacts enable row level security;

create policy "Users see own contacts"
  on contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast user lookups
create index if not exists contacts_user_id_idx on contacts (user_id);
