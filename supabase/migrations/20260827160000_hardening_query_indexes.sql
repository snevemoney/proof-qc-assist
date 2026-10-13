-- Replace the dropped projects_user_id unique constraint with a non-unique
-- lookup index. UNIQUE is not restored: the product allows multiple projects
-- per user (see 20260124184221_f9dc3e03-ead2-4bbd-876d-6ff8ef6ee46b.sql).
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_drafts_user_id ON public.saved_drafts(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_history_project_id
  ON public.verification_history(project_id);

CREATE INDEX IF NOT EXISTS idx_verification_feedback_user_id
  ON public.verification_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_share_anonymized_data
  ON public.profiles(share_anonymized_data);
