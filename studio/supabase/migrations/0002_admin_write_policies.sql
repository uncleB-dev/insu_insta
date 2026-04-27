-- ─────────────────────────────────────────────────────────────
-- 0002_admin_write_policies.sql
-- 인증된 사용자에게 admin 테이블 쓰기 권한 부여
-- (앱이 본인 전용이라 모든 인증 사용자 = admin 으로 간주)
-- ─────────────────────────────────────────────────────────────

-- guardrail_rules: INSERT / UPDATE / DELETE
create policy "guardrail_rules_authed_insert"
  on public.guardrail_rules for insert
  to authenticated
  with check (true);

create policy "guardrail_rules_authed_update"
  on public.guardrail_rules for update
  to authenticated
  using (true)
  with check (true);

create policy "guardrail_rules_authed_delete"
  on public.guardrail_rules for delete
  to authenticated
  using (true);

-- prompts: INSERT / UPDATE / DELETE (다음 단계에서 사용)
create policy "prompts_authed_insert"
  on public.prompts for insert
  to authenticated
  with check (true);

create policy "prompts_authed_update"
  on public.prompts for update
  to authenticated
  using (true)
  with check (true);

create policy "prompts_authed_delete"
  on public.prompts for delete
  to authenticated
  using (true);

-- prompt_versions: INSERT / UPDATE / DELETE
create policy "prompt_versions_authed_insert"
  on public.prompt_versions for insert
  to authenticated
  with check (true);

create policy "prompt_versions_authed_update"
  on public.prompt_versions for update
  to authenticated
  using (true)
  with check (true);

create policy "prompt_versions_authed_delete"
  on public.prompt_versions for delete
  to authenticated
  using (true);
