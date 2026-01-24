-- Create user_writing_profiles table to learn each user's unique writing style
CREATE TABLE public.user_writing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Vocabulary patterns
  vocabulary_level TEXT DEFAULT 'moderate', -- 'simple', 'moderate', 'academic', 'technical'
  avg_sentence_length FLOAT DEFAULT 15,
  avg_paragraph_length FLOAT DEFAULT 4,
  
  -- Style markers
  uses_contractions BOOLEAN DEFAULT false,
  formality_level TEXT DEFAULT 'academic', -- 'casual', 'semi-formal', 'formal', 'academic'
  preferred_voice TEXT DEFAULT 'mixed', -- 'active', 'passive', 'mixed'
  
  -- Common phrases and patterns (anonymized - no raw text stored)
  transition_phrases JSONB DEFAULT '[]'::jsonb, -- ["Furthermore", "In addition", "Ainsi", ...]
  opening_patterns JSONB DEFAULT '[]'::jsonb,   -- How they start paragraphs
  closing_patterns JSONB DEFAULT '[]'::jsonb,   -- How they conclude
  
  -- French/English specifics
  primary_language TEXT DEFAULT 'fr',
  quebec_french_markers BOOLEAN DEFAULT false, -- Uses "on" vs "nous", colloquialisms, etc.
  
  -- Confidence and sample size
  samples_analyzed INT DEFAULT 0,
  confidence_score FLOAT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.user_writing_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own writing profile
CREATE POLICY "Users can view own writing profile"
  ON public.user_writing_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own writing profile"
  ON public.user_writing_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writing profile"
  ON public.user_writing_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing profile"
  ON public.user_writing_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update the updated_at timestamp
CREATE TRIGGER update_user_writing_profiles_updated_at
  BEFORE UPDATE ON public.user_writing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();