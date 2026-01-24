-- Add requirement_checks and rubric_scores columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS requirement_checks jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS rubric_scores jsonb DEFAULT '[]'::jsonb;

-- Add same columns to verification_history table
ALTER TABLE public.verification_history 
ADD COLUMN IF NOT EXISTS requirement_checks jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.verification_history 
ADD COLUMN IF NOT EXISTS rubric_scores jsonb DEFAULT '[]'::jsonb;