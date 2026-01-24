import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
}

interface Claim {
  id: string;
  text: string;
  status: 'supported' | 'partial' | 'unsupported' | 'contradicted';
  suggestion?: string;
  sourceRef?: string;
}

interface Intervention {
  id: string;
  text: string;
  severity: 'critical' | 'standard' | 'optional';
  hasEvidence: boolean;
  hasRationale: boolean;
  suggestion?: string;
}

interface WritingProfile {
  vocabulary_level: string;
  avg_sentence_length: number;
  avg_paragraph_length: number;
  uses_contractions: boolean;
  formality_level: string;
  preferred_voice: string;
  transition_phrases: string[];
  opening_patterns: string[];
  closing_patterns: string[];
  primary_language: string;
  quebec_french_markers: boolean;
  confidence_score: number;
}

interface GenerateRequest {
  draftText: string;
  claims: Claim[];
  interventions: Intervention[];
  sources: Source[];
  language: 'fr' | 'en';
  feedback?: string;
  previousVersion?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { draftText, claims, interventions, sources, language, feedback, previousVersion }: GenerateRequest = await req.json();

    if (!draftText || draftText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: language === 'fr' ? 'Aucun brouillon fourni' : 'No draft provided' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's writing profile
    const { data: profileData } = await supabase
      .from('user_writing_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const profile = profileData as WritingProfile | null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the issues to fix
    const claimsToFix = claims.filter(c => c.status !== 'supported' && c.suggestion);
    const interventionsToFix = interventions.filter(i => (!i.hasEvidence || !i.hasRationale) && i.suggestion);

    // Build sources reference
    const sourcesRef = sources.map((s, i) => 
      `[S${i + 1}] ${s.authors} (${s.year}). ${s.title}`
    ).join('\n');

    // Build the style matching section
    let styleSection = '';
    if (profile && profile.confidence_score > 0.2) {
      styleSection = language === 'fr' 
        ? `
## PROFIL D'ÉCRITURE DE L'ÉTUDIANT (CORRESPONDRE EXACTEMENT):
- Niveau de vocabulaire: ${profile.vocabulary_level}
- Longueur moyenne des phrases: ${profile.avg_sentence_length} mots
- Niveau de formalité: ${profile.formality_level}
- Voix préférée: ${profile.preferred_voice === 'active' ? 'active' : profile.preferred_voice === 'passive' ? 'passive' : 'mixte'}
- Utilise les contractions: ${profile.uses_contractions ? 'oui' : 'non'}
- Marqueurs du français québécois: ${profile.quebec_french_markers ? 'oui (utiliser "on", expressions québécoises)' : 'non'}
- Phrases de transition qu'ils utilisent: ${(profile.transition_phrases || []).slice(0, 5).join(', ') || 'aucune détectée'}
- Comment ils commencent les paragraphes: ${(profile.opening_patterns || []).slice(0, 3).join(', ') || 'varié'}

## RÈGLES CRITIQUES DE CORRESPONDANCE DE STYLE:
1. UTILISER EXACTEMENT le même niveau de vocabulaire - NE PAS améliorer ou simplifier
2. GARDER la même longueur de phrases (environ ${profile.avg_sentence_length} mots)
3. UTILISER leurs phrases de transition, PAS des alternatives sophistiquées
4. MAINTENIR leur niveau de formalité EXACTEMENT
5. PRÉSERVER leurs "imperfections" qui rendent l'écriture humaine
6. Le résultat doit être INDÉTECTABLE comme écrit par IA
7. NE JAMAIS introduire de vocabulaire qu'ils n'utilisent pas
`
        : `
## STUDENT'S WRITING PROFILE (MATCH EXACTLY):
- Vocabulary level: ${profile.vocabulary_level}
- Average sentence length: ${profile.avg_sentence_length} words
- Formality level: ${profile.formality_level}
- Preferred voice: ${profile.preferred_voice}
- Uses contractions: ${profile.uses_contractions ? 'yes' : 'no'}
- Transition phrases they use: ${(profile.transition_phrases || []).slice(0, 5).join(', ') || 'none detected'}
- How they start paragraphs: ${(profile.opening_patterns || []).slice(0, 3).join(', ') || 'varied'}

## CRITICAL STYLE MATCHING RULES:
1. USE EXACTLY the same vocabulary level - DO NOT upgrade or simplify
2. KEEP the same sentence length patterns (around ${profile.avg_sentence_length} words)
3. USE their transition phrases, NOT sophisticated alternatives
4. MAINTAIN their formality level EXACTLY
5. PRESERVE their "imperfections" that make writing human
6. The result must be UNDETECTABLE as AI-written
7. NEVER introduce vocabulary they don't use
`;
    } else {
      styleSection = language === 'fr'
        ? `
## NOTE SUR LE STYLE:
Le profil d'écriture de l'étudiant n'est pas encore établi. Faites les corrections nécessaires tout en préservant le ton et le style général du brouillon original autant que possible.
`
        : `
## STYLE NOTE:
The student's writing profile is not yet established. Make necessary corrections while preserving the original draft's tone and style as much as possible.
`;
    }

    // Build issues section
    let issuesSection = language === 'fr' ? '## PROBLÈMES À CORRIGER:\n' : '## ISSUES TO FIX:\n';
    
    if (claimsToFix.length > 0) {
      issuesSection += language === 'fr' ? '\n### Affirmations:\n' : '\n### Claims:\n';
      claimsToFix.forEach(c => {
        issuesSection += `- "${c.text.substring(0, 100)}..." → ${c.suggestion}\n`;
      });
    }

    if (interventionsToFix.length > 0) {
      issuesSection += language === 'fr' ? '\n### Interventions infirmières:\n' : '\n### Nursing Interventions:\n';
      interventionsToFix.forEach(i => {
        issuesSection += `- "${i.text.substring(0, 100)}..." → ${i.suggestion}\n`;
      });
    }

    if (claimsToFix.length === 0 && interventionsToFix.length === 0 && !feedback) {
      issuesSection += language === 'fr' 
        ? 'Aucun problème majeur détecté. Améliorer la fluidité et la clarté générale.\n'
        : 'No major issues detected. Improve overall flow and clarity.\n';
    }

    // Build feedback/refinement section if user provided critique
    let feedbackSection = '';
    if (feedback && previousVersion) {
      feedbackSection = language === 'fr'
        ? `
## CRITIQUE DE L'ÉTUDIANT SUR LA VERSION PRÉCÉDENTE:
"${feedback}"

## VERSION PRÉCÉDENTE À AMÉLIORER:
${previousVersion}

## INSTRUCTIONS DE RAFFINEMENT:
1. Adresser TOUTES les critiques de l'étudiant en priorité
2. Améliorer les sections mentionnées spécifiquement
3. Garder les parties non critiquées aussi similaires que possible
4. Toujours maintenir le style d'écriture de l'étudiant
5. Ne pas introduire de nouveaux problèmes en corrigeant les anciens
`
        : `
## STUDENT'S CRITIQUE OF PREVIOUS VERSION:
"${feedback}"

## PREVIOUS VERSION TO IMPROVE:
${previousVersion}

## REFINEMENT INSTRUCTIONS:
1. Address ALL student feedback as top priority
2. Improve the specifically mentioned sections
3. Keep non-critiqued parts as similar as possible
4. Always maintain the student's writing style
5. Don't introduce new issues while fixing old ones
`;
    }
    const systemPrompt = language === 'fr'
      ? `Vous êtes un assistant d'écriture académique spécialisé en sciences infirmières. Votre tâche est de corriger le brouillon de l'étudiant en appliquant les suggestions de vérification TOUT EN PRÉSERVANT EXACTEMENT leur style d'écriture personnel.

${styleSection}

${issuesSection}
${feedbackSection}

## SOURCES DISPONIBLES POUR CITATIONS:
${sourcesRef}

## INSTRUCTIONS:
1. ${feedback ? "Adresser les critiques de l'étudiant EN PRIORITÉ" : "Appliquer TOUTES les corrections suggérées"}
2. Ajouter des citations appropriées aux sources fournies
3. MAINTENIR le style de l'étudiant - c'est CRITIQUE
4. Retourner UNIQUEMENT le texte corrigé, sans explications
5. Le texte doit sembler écrit par l'étudiant, pas par une IA

Retournez le brouillon corrigé en préservant le style de l'étudiant.`
      : `You are an academic writing assistant specialized in nursing sciences. Your task is to correct the student's draft by applying verification suggestions WHILE PRESERVING EXACTLY their personal writing style.

${styleSection}

${issuesSection}
${feedbackSection}

## AVAILABLE SOURCES FOR CITATIONS:
${sourcesRef}

## INSTRUCTIONS:
1. ${feedback ? "Address student's critique as TOP PRIORITY" : "Apply ALL suggested corrections"}
2. Add appropriate citations to provided sources
3. MAINTAIN the student's style - this is CRITICAL
4. Return ONLY the corrected text, no explanations
5. The text must seem written by the student, not by AI

Return the corrected draft preserving the student's style.`;

    // Use streaming for better UX
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: draftText },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: language === 'fr' 
              ? 'Service temporairement surchargé. Réessayez dans quelques secondes.'
              : 'Service temporarily overloaded. Please retry in a few seconds.'
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error('Failed to generate final draft');
    }

    // Stream the response back
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error('Error in generate-final-draft:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
