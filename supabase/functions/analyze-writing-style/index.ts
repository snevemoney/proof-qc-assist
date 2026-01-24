import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
}

interface AnalyzeRequest {
  language: 'fr' | 'en';
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

    const { language = 'fr' }: AnalyzeRequest = await req.json();

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

    // Collect writing samples from multiple sources
    const writingSamples: string[] = [];

    // 1. Saved drafts
    const { data: savedDrafts } = await supabase
      .from('saved_drafts')
      .select('content')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (savedDrafts) {
      writingSamples.push(...savedDrafts.map(d => d.content));
    }

    // 2. Verification history draft texts
    const { data: verificationHistory } = await supabase
      .from('verification_history')
      .select('draft_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (verificationHistory) {
      writingSamples.push(...verificationHistory.filter(v => v.draft_text).map(v => v.draft_text));
    }

    // 3. Chat messages (user role only)
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('user_id', user.id)
      .eq('role', 'user')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (chatMessages) {
      writingSamples.push(...chatMessages.map(m => m.content));
    }

    if (writingSamples.length < 2) {
      return new Response(
        JSON.stringify({ 
          error: language === 'fr' 
            ? 'Pas assez d\'échantillons d\'écriture. Continuez à écrire pour améliorer votre profil.' 
            : 'Not enough writing samples. Keep writing to improve your profile.',
          samplesNeeded: 2 - writingSamples.length
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Combine samples for analysis (limit total size)
    const combinedSamples = writingSamples
      .slice(0, 15)
      .map((s, i) => `--- Sample ${i + 1} ---\n${s.substring(0, 1500)}`)
      .join('\n\n');

    const systemPrompt = language === 'fr' 
      ? `Vous êtes un expert en analyse linguistique. Analysez les échantillons d'écriture fournis pour extraire le profil stylistique UNIQUE de cet auteur. 

IMPORTANT: 
- Identifiez les PATTERNS SPÉCIFIQUES à cet auteur, pas des généralités
- Les phrases de transition doivent être des exemples RÉELS tirés des textes
- Détectez les marqueurs du français québécois (utilisation de "on" vs "nous", anglicismes, expressions québécoises)
- Le profil doit permettre de reproduire EXACTEMENT le style de l'auteur

Retournez UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "vocabulary_level": "simple" | "moderate" | "academic" | "technical",
  "avg_sentence_length": <nombre de mots moyen par phrase>,
  "avg_paragraph_length": <nombre de phrases moyen par paragraphe>,
  "uses_contractions": true | false,
  "formality_level": "casual" | "semi-formal" | "formal" | "academic",
  "preferred_voice": "active" | "passive" | "mixed",
  "transition_phrases": ["phrase1", "phrase2", ...], // EXACTEMENT comme l'auteur les utilise
  "opening_patterns": ["pattern1", ...], // Comment ils commencent les paragraphes
  "closing_patterns": ["pattern1", ...], // Comment ils concluent
  "primary_language": "fr" | "en",
  "quebec_french_markers": true | false
}`
      : `You are a linguistic analysis expert. Analyze the writing samples to extract this author's UNIQUE stylistic profile.

IMPORTANT:
- Identify patterns SPECIFIC to this author, not generalities
- Transition phrases must be REAL examples from their texts
- The profile must enable reproducing EXACTLY the author's style

Return ONLY valid JSON with this exact structure:
{
  "vocabulary_level": "simple" | "moderate" | "academic" | "technical",
  "avg_sentence_length": <average words per sentence>,
  "avg_paragraph_length": <average sentences per paragraph>,
  "uses_contractions": true | false,
  "formality_level": "casual" | "semi-formal" | "formal" | "academic",
  "preferred_voice": "active" | "passive" | "mixed",
  "transition_phrases": ["phrase1", "phrase2", ...], // EXACTLY as the author uses them
  "opening_patterns": ["pattern1", ...], // How they start paragraphs
  "closing_patterns": ["pattern1", ...], // How they conclude
  "primary_language": "fr" | "en",
  "quebec_french_markers": true | false
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: combinedSamples },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to analyze writing style');
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse writing profile from AI response');
    }

    const profile: WritingProfile = JSON.parse(jsonMatch[0]);

    // Upsert the writing profile
    const { error: upsertError } = await supabase
      .from('user_writing_profiles')
      .upsert({
        user_id: user.id,
        vocabulary_level: profile.vocabulary_level,
        avg_sentence_length: profile.avg_sentence_length,
        avg_paragraph_length: profile.avg_paragraph_length,
        uses_contractions: profile.uses_contractions,
        formality_level: profile.formality_level,
        preferred_voice: profile.preferred_voice,
        transition_phrases: profile.transition_phrases,
        opening_patterns: profile.opening_patterns,
        closing_patterns: profile.closing_patterns,
        primary_language: profile.primary_language,
        quebec_french_markers: profile.quebec_french_markers,
        samples_analyzed: writingSamples.length,
        confidence_score: Math.min(1, writingSamples.length / 20), // More samples = higher confidence
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error saving profile:', upsertError);
      throw new Error('Failed to save writing profile');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile,
        samplesAnalyzed: writingSamples.length,
        confidence: Math.min(1, writingSamples.length / 20)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-writing-style:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
