ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS final_draft text DEFAULT '',
ADD COLUMN IF NOT EXISTS final_draft_versions jsonb DEFAULT '[]'::jsonb;