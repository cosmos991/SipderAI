create table if not exists public.assistant_state (
 id text primary key,
 data jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.assistant_state enable row level security;
-- No public policies: only the server-side service role can access this table.
revoke all on public.assistant_state from anon, authenticated;
