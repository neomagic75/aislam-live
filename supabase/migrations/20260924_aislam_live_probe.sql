begin;

create table public.aislam_live_probe (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.aislam_live_probe enable row level security;
revoke all on table public.aislam_live_probe from public, anon, authenticated;
grant select, insert, delete on table public.aislam_live_probe to service_role;
comment on table public.aislam_live_probe is 'AI Slam operator-only connectivity probes. No audience records. Probe rows are removed after verification.';

commit;
