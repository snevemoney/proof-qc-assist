-- Add instructions and evaluation grid columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS instructions text DEFAULT '';

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS evaluation_grid jsonb DEFAULT '[]'::jsonb;

-- Add to verification_history for historical snapshots
ALTER TABLE public.verification_history 
ADD COLUMN IF NOT EXISTS instructions_snapshot text DEFAULT '';

ALTER TABLE public.verification_history 
ADD COLUMN IF NOT EXISTS evaluation_grid_snapshot jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.verification_history 
ADD COLUMN IF NOT EXISTS requirement_checks jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.verification_history 
ADD COLUMN IF NOT EXISTS rubric_scores jsonb DEFAULT '[]'::jsonb;