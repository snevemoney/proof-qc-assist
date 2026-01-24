-- Create enum for knowledge categories
CREATE TYPE public.knowledge_category AS ENUM (
  'common_error',
  'source_quality', 
  'intervention_pattern',
  'requirement_template',
  'topic_insight'
);

-- System knowledge table for aggregated learning
CREATE TABLE public.system_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category knowledge_category NOT NULL,
  topic TEXT,
  topic_hash TEXT, -- for anonymized matching
  data JSONB NOT NULL DEFAULT '{}',
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count INT DEFAULT 0,
  success_rate FLOAT DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast topic lookups
CREATE INDEX idx_system_knowledge_topic ON public.system_knowledge(topic_hash, category);
CREATE INDEX idx_system_knowledge_confidence ON public.system_knowledge(confidence_score DESC);

-- Source quality ratings for collective intelligence
CREATE TABLE public.source_quality_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_hash TEXT NOT NULL, -- hash of title+authors for privacy
  source_title TEXT,
  source_authors TEXT,
  source_year TEXT,
  source_journal TEXT,
  topic_areas TEXT[] DEFAULT '{}',
  times_used INT DEFAULT 1,
  times_supported INT DEFAULT 0,
  times_partial INT DEFAULT 0,
  times_unsupported INT DEFAULT 0,
  support_rate FLOAT GENERATED ALWAYS AS (
    CASE WHEN times_used > 0 
    THEN (times_supported::float + times_partial::float * 0.5) / times_used::float 
    ELSE 0 END
  ) STORED,
  avg_relevance FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_hash)
);

CREATE INDEX idx_source_quality_support ON public.source_quality_ratings(support_rate DESC);
CREATE INDEX idx_source_quality_topics ON public.source_quality_ratings USING GIN(topic_areas);

-- User feedback on verifications for flywheel
CREATE TABLE public.verification_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES public.verification_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  was_helpful BOOLEAN,
  accuracy_rating INT CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  claim_feedback JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_verification_feedback_verification ON public.verification_feedback(verification_id);

-- Add opt-out column to profiles
ALTER TABLE public.profiles ADD COLUMN share_anonymized_data BOOLEAN DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.system_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_quality_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_feedback ENABLE ROW LEVEL SECURITY;

-- System knowledge is readable by all authenticated users (public intelligence)
CREATE POLICY "Anyone can read system knowledge"
ON public.system_knowledge
FOR SELECT
TO authenticated
USING (true);

-- Source quality ratings are readable by all authenticated users
CREATE POLICY "Anyone can read source quality"
ON public.source_quality_ratings
FOR SELECT
TO authenticated
USING (true);

-- Users can submit their own feedback
CREATE POLICY "Users can insert own feedback"
ON public.verification_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
ON public.verification_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at on system_knowledge
CREATE TRIGGER update_system_knowledge_updated_at
BEFORE UPDATE ON public.system_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on source_quality_ratings
CREATE TRIGGER update_source_quality_updated_at
BEFORE UPDATE ON public.source_quality_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();