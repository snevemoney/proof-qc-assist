import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Claim {
  id: string;
  text: string;
  status: 'supported' | 'partial' | 'unsupported' | 'contradicted';
  sourceRef?: string;
}

interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
}

interface VerificationRecord {
  id: string;
  claims: Claim[];
  sources_snapshot: Source[];
  interventions: any[];
  summary: any;
  draft_text: string;
  created_at: string;
}

// Simple hash function for anonymization
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Extract nursing topics from text using keyword detection
function extractTopics(text: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    'aging_care': ['vieillissement', 'aging', 'elderly', 'aîné', 'gérontologie', 'gériatrie'],
    'wound_care': ['plaie', 'wound', 'pansement', 'cicatrisation', 'ulcère'],
    'medication': ['médicament', 'medication', 'pharmacologie', 'posologie', 'drug'],
    'pain_management': ['douleur', 'pain', 'analgésie', 'opioïde', 'analgesia'],
    'infection_control': ['infection', 'asepsie', 'stérilisation', 'contamination'],
    'mental_health': ['santé mentale', 'mental health', 'anxiété', 'dépression', 'psychiatrie'],
    'diabetes': ['diabète', 'diabetes', 'glycémie', 'insuline', 'hyperglycémie'],
    'cardiac': ['cardiaque', 'cardiac', 'hypertension', 'arythmie', 'insuffisance cardiaque'],
    'respiratory': ['respiratoire', 'respiratory', 'dyspnée', 'oxygène', 'BPCO', 'COPD'],
    'nutrition': ['nutrition', 'alimentation', 'dénutrition', 'malnutrition', 'régime'],
    'palliative': ['palliatif', 'palliative', 'fin de vie', 'end of life', 'confort'],
    'pediatric': ['pédiatrique', 'pediatric', 'enfant', 'nourrisson', 'nouveau-né'],
    'maternal': ['maternité', 'maternal', 'grossesse', 'accouchement', 'postnatal'],
  };

  const lowerText = text.toLowerCase();
  const detectedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detectedTopics.push(topic);
    }
  }

  return detectedTopics.length > 0 ? detectedTopics : ['general'];
}

// Extract common error patterns from unsupported claims
function extractErrorPatterns(claims: Claim[]): Record<string, any> {
  const unsupportedClaims = claims.filter(c => 
    c.status === 'unsupported' || c.status === 'contradicted'
  );
  
  const patterns: Record<string, number> = {};
  
  for (const claim of unsupportedClaims) {
    const text = claim.text.toLowerCase();
    
    // Detect common problematic patterns
    if (text.includes('toujours') || text.includes('always') || text.includes('jamais') || text.includes('never')) {
      patterns['absolute_statements'] = (patterns['absolute_statements'] || 0) + 1;
    }
    if (text.includes('%') || /\d+\s*(pour cent|percent)/.test(text)) {
      patterns['unverified_statistics'] = (patterns['unverified_statistics'] || 0) + 1;
    }
    if (!claim.sourceRef) {
      patterns['missing_citation'] = (patterns['missing_citation'] || 0) + 1;
    }
    if (text.includes('prouvé') || text.includes('proven') || text.includes('démontré')) {
      patterns['overclaimed_evidence'] = (patterns['overclaimed_evidence'] || 0) + 1;
    }
  }
  
  return patterns;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get recent verifications from users who opted in
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: verifications, error: fetchError } = await supabase
      .from('verification_history')
      .select(`
        id, claims, sources_snapshot, interventions, summary, draft_text, created_at,
        user_id
      `)
      .gte('created_at', oneDayAgo);

    if (fetchError) {
      throw new Error(`Failed to fetch verifications: ${fetchError.message}`);
    }

    if (!verifications || verifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No new verifications to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to only users who opted in
    const { data: optedInProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('share_anonymized_data', true);
    
    const optedInUserIds = new Set(optedInProfiles?.map(p => p.id) || []);
    const eligibleVerifications = verifications.filter(v => optedInUserIds.has(v.user_id));

    // Aggregate source quality data
    const sourceStats: Record<string, {
      title: string;
      authors: string;
      year: string;
      journal: string;
      topics: Set<string>;
      supported: number;
      partial: number;
      unsupported: number;
      total: number;
    }> = {};

    // Aggregate error patterns by topic
    const topicErrors: Record<string, Record<string, number>> = {};

    for (const verification of eligibleVerifications) {
      const claims = (verification.claims as Claim[]) || [];
      const sources = (verification.sources_snapshot as Source[]) || [];
      const draftText = verification.draft_text || '';
      
      const topics = extractTopics(draftText);
      
      // Track error patterns per topic
      const errorPatterns = extractErrorPatterns(claims);
      for (const topic of topics) {
        if (!topicErrors[topic]) topicErrors[topic] = {};
        for (const [pattern, count] of Object.entries(errorPatterns)) {
          topicErrors[topic][pattern] = (topicErrors[topic][pattern] || 0) + count;
        }
      }

      // Track source quality
      for (const source of sources) {
        const hash = simpleHash(`${source.title}${source.authors}`);
        
        if (!sourceStats[hash]) {
          sourceStats[hash] = {
            title: source.title,
            authors: source.authors,
            year: source.year,
            journal: (source as any).journal || '',
            topics: new Set(),
            supported: 0,
            partial: 0,
            unsupported: 0,
            total: 0,
          };
        }
        
        // Add topics
        topics.forEach(t => sourceStats[hash].topics.add(t));
        
        // Count claims that reference this source
        for (const claim of claims) {
          if (claim.sourceRef?.includes(source.id) || claim.sourceRef?.includes(`[S${sources.indexOf(source) + 1}]`)) {
            sourceStats[hash].total++;
            if (claim.status === 'supported') sourceStats[hash].supported++;
            else if (claim.status === 'partial') sourceStats[hash].partial++;
            else sourceStats[hash].unsupported++;
          }
        }
      }
    }

    // Upsert source quality ratings
    for (const [hash, stats] of Object.entries(sourceStats)) {
      if (stats.total > 0) {
        await supabase
          .from('source_quality_ratings')
          .upsert({
            source_hash: hash,
            source_title: stats.title,
            source_authors: stats.authors,
            source_year: stats.year,
            source_journal: stats.journal,
            topic_areas: Array.from(stats.topics),
            times_used: stats.total,
            times_supported: stats.supported,
            times_partial: stats.partial,
            times_unsupported: stats.unsupported,
          }, {
            onConflict: 'source_hash',
          });
      }
    }

    // Upsert error pattern knowledge
    for (const [topic, patterns] of Object.entries(topicErrors)) {
      const topicHash = simpleHash(topic);
      
      // Get existing knowledge
      const { data: existing } = await supabase
        .from('system_knowledge')
        .select('*')
        .eq('topic_hash', topicHash)
        .eq('category', 'common_error')
        .single();

      const existingPatterns = (existing?.data as Record<string, number>) || {};
      const mergedPatterns: Record<string, number> = { ...existingPatterns };
      
      for (const [pattern, count] of Object.entries(patterns)) {
        mergedPatterns[pattern] = (mergedPatterns[pattern] || 0) + count;
      }

      const totalErrors = Object.values(mergedPatterns).reduce((a, b) => a + b, 0);
      const confidence = Math.min(0.9, 0.3 + (totalErrors / 100) * 0.6);

      await supabase
        .from('system_knowledge')
        .upsert({
          id: existing?.id,
          category: 'common_error',
          topic,
          topic_hash: topicHash,
          data: mergedPatterns,
          confidence_score: confidence,
          usage_count: (existing?.usage_count || 0) + eligibleVerifications.length,
        }, {
          onConflict: 'id',
        });
    }

    return new Response(
      JSON.stringify({
        message: 'Knowledge extraction completed',
        processed: eligibleVerifications.length,
        sourcesUpdated: Object.keys(sourceStats).length,
        topicsUpdated: Object.keys(topicErrors).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Knowledge extraction error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
