-- Add interventions column to projects table
ALTER TABLE public.projects 
ADD COLUMN interventions jsonb DEFAULT '[]'::jsonb;

-- Add interventions column to verification_history table
ALTER TABLE public.verification_history 
ADD COLUMN interventions jsonb DEFAULT '[]'::jsonb;