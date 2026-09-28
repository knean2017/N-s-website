-- ============================================================
-- Remove seed/demo data for production launch.
-- Run once in the Supabase SQL editor. Irreversible.
--
-- Only rows with the fixed IDs from supabase/seed.sql are deleted.
-- Real users and their content are left untouched.
-- ============================================================

begin;

-- 1. Platform organization.
-- Admin-posted campaigns/updates attach to the OLDEST organization
-- (see src/app/api/dashboard/campaigns/route.ts), so one must exist
-- and stay oldest after the demo orgs are gone.
insert into public.organizations (legal_name, display_name, description, contact_email, status, created_at)
select 'Destekly', 'Destekly', 'Destekly platform donation calls and updates.', 'admin@destekly.org', 'approved', '2000-01-01T00:00:00Z'
where not exists (select 1 from public.organizations where legal_name = 'Destekly');

-- 2. Move any non-demo content that was posted under a demo org to the platform org,
-- so deleting the demo orgs does not cascade into real data.
do $$
declare
  v_platform uuid := (select id from public.organizations where legal_name = 'Destekly' limit 1);
  v_demo_orgs uuid[] := array['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555']::uuid[];
begin
  update public.campaigns set organization_id = v_platform
    where organization_id = any(v_demo_orgs)
      and id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  update public.projects set organization_id = v_platform
    where organization_id = any(v_demo_orgs)
      and id <> 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  update public.updates set organization_id = v_platform
    where organization_id = any(v_demo_orgs)
      and id <> 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  update public.child_profiles set organization_id = v_platform
    where organization_id = any(v_demo_orgs)
      and id not in ('66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777');
end $$;

-- 3. Demo marketplace rows (order_items blocks product deletion).
delete from public.order_items where order_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
delete from public.orders where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
delete from public.products where id in ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999');

-- 4. Demo content.
delete from public.donations where campaign_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
delete from public.updates where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
delete from public.campaigns where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
delete from public.projects where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
delete from public.child_profiles where id in ('66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777');

-- 5. Demo organizations and their moderation history.
delete from public.moderation_logs
  where target_id in ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555')
     or notes like 'Seed:%';
delete from public.organizations
  where id in ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555');

-- 6. Demo accounts (known password Passw0rd!). Cascades to profiles and identities.
delete from auth.users
  where id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  );

commit;

-- Check: all counts should be 0, and platform org = 1.
select
  (select count(*) from auth.users where email like '%@kindora.org') as demo_users,
  (select count(*) from public.organizations where id in ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555')) as demo_orgs,
  (select count(*) from public.campaigns where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as demo_campaigns,
  (select count(*) from public.products) as products_left,
  (select count(*) from public.organizations where legal_name = 'Destekly') as platform_org;
