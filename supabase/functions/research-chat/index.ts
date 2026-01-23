import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
  content: string;
}

interface Claim {
  id: string;
  text: string;
  status: 'supported' | 'partial' | 'unsupported' | 'contradicted';
  sourceRef?: string;
  evidence?: string;
  suggestion?: string;
}

interface ChatContext {
  sources: Source[];
  draftText: string;
  claims: Claim[];
  summary: {
    supported: number;
    partial: number;
    unsupported: number;
    contradicted: number;
    overallFeedback?: string;
  } | null;
}

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: ChatContext;
  language: 'fr' | 'en';
  action: 'chat' | 'research';
  claimId?: string; // If asking about a specific claim
}

const systemPromptEN = `You are ProofCheck AI, an intelligent research assistant for university students. You help students verify their academic claims, improve their writing, and find additional evidence.

## Your Capabilities:
1. **Context Awareness**: You have full access to the student's uploaded sources, their draft text, and the verification results (claims marked as supported, partial, unsupported, or contradicted).
2. **Academic Guidance**: You explain why claims are marked a certain way and provide specific suggestions for improvement.
3. **Citation Help**: You can help format citations in APA, MLA, or other styles.
4. **Writing Improvement**: You suggest ways to strengthen weak arguments and improve academic tone.

## Your Personality:
- Supportive and encouraging, like a helpful teaching assistant
- Clear and concise explanations
- Focus on helping students learn, not just fixing problems
- Always cite specific sources when referencing the student's materials

## Context Format:
Sources are labeled [S1], [S2], etc. Claims are marked with their verification status.

## Important Rules:
- Never fabricate citations or evidence
- Always reference the student's actual sources when discussing their work
- If you don't know something, say so honestly
- Encourage academic integrity`;

const systemPromptFR = `Vous êtes ProofCheck AI, un assistant de recherche intelligent pour les étudiants universitaires. Vous aidez les étudiants à vérifier leurs affirmations académiques, améliorer leur rédaction et trouver des preuves supplémentaires.

## Vos Capacités:
1. **Connaissance du Contexte**: Vous avez accès complet aux sources téléchargées par l'étudiant, à son brouillon et aux résultats de vérification (affirmations marquées comme soutenues, partielles, non trouvées ou contredites).
2. **Conseils Académiques**: Vous expliquez pourquoi les affirmations sont marquées d'une certaine manière et fournissez des suggestions spécifiques d'amélioration.
3. **Aide aux Citations**: Vous pouvez aider à formater les citations en APA, MLA ou autres styles.
4. **Amélioration de l'Écriture**: Vous suggérez des moyens de renforcer les arguments faibles et d'améliorer le ton académique.

## Votre Personnalité:
- Encourageant et solidaire, comme un assistant d'enseignement serviable
- Explications claires et concises
- Concentrez-vous sur l'apprentissage de l'étudiant, pas seulement sur la résolution des problèmes
- Citez toujours des sources spécifiques lorsque vous faites référence aux documents de l'étudiant

## Format du Contexte:
Les sources sont étiquetées [S1], [S2], etc. Les affirmations sont marquées avec leur statut de vérification.

## Règles Importantes:
- Ne jamais inventer de citations ou de preuves
- Toujours faire référence aux sources réelles de l'étudiant lors de la discussion de son travail
- Si vous ne savez pas quelque chose, dites-le honnêtement
- Encouragez l'intégrité académique`;

function buildContextString(context: ChatContext, language: 'fr' | 'en'): string {
  const { sources, draftText, claims, summary } = context;
  
  let contextStr = language === 'fr' ? '## Sources de l\'étudiant:\n' : '## Student\'s Sources:\n';
  
  sources.forEach((source, index) => {
    contextStr += `\n[S${index + 1}] "${source.title}" - ${source.authors} (${source.year})\n`;
    contextStr += `Contenu: ${source.content.substring(0, 500)}${source.content.length > 500 ? '...' : ''}\n`;
  });
  
  contextStr += language === 'fr' ? '\n## Brouillon de l\'étudiant:\n' : '\n## Student\'s Draft:\n';
  contextStr += draftText.substring(0, 1000) + (draftText.length > 1000 ? '...' : '') + '\n';
  
  if (claims.length > 0) {
    contextStr += language === 'fr' ? '\n## Résultats de Vérification:\n' : '\n## Verification Results:\n';
    
    const statusLabels = {
      supported: language === 'fr' ? 'Soutenu' : 'Supported',
      partial: language === 'fr' ? 'Partiel' : 'Partial',
      unsupported: language === 'fr' ? 'Non trouvé' : 'Not Found',
      contradicted: language === 'fr' ? 'Contredit' : 'Contradicted',
    };
    
    claims.forEach((claim, index) => {
      contextStr += `\n${index + 1}. [${statusLabels[claim.status]}] "${claim.text}"\n`;
      if (claim.sourceRef) contextStr += `   Source: ${claim.sourceRef}\n`;
      if (claim.evidence) contextStr += `   ${language === 'fr' ? 'Preuve' : 'Evidence'}: ${claim.evidence}\n`;
    });
    
    if (summary) {
      contextStr += language === 'fr' ? '\n## Résumé:\n' : '\n## Summary:\n';
      contextStr += `${language === 'fr' ? 'Soutenu' : 'Supported'}: ${summary.supported}, `;
      contextStr += `${language === 'fr' ? 'Partiel' : 'Partial'}: ${summary.partial}, `;
      contextStr += `${language === 'fr' ? 'Non trouvé' : 'Unsupported'}: ${summary.unsupported}, `;
      contextStr += `${language === 'fr' ? 'Contredit' : 'Contradicted'}: ${summary.contradicted}\n`;
    }
  }
  
  return contextStr;
}

async function searchWithPerplexity(query: string, language: 'fr' | 'en'): Promise<string> {
  const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!PERPLEXITY_API_KEY) {
    return language === 'fr' 
      ? 'Recherche non disponible: clé API Perplexity manquante.'
      : 'Research not available: Perplexity API key missing.';
  }
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: language === 'fr'
              ? 'Vous êtes un assistant de recherche académique. Trouvez des sources fiables et des preuves pour les affirmations académiques. Citez vos sources.'
              : 'You are an academic research assistant. Find reliable sources and evidence for academic claims. Cite your sources.'
          },
          { role: 'user', content: query }
        ],
        search_domain_filter: ['scholar.google.com', '.edu', 'nature.com', 'sciencedirect.com', 'jstor.org', 'researchgate.net'],
      }),
    });
    
    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return language === 'fr' 
        ? 'Erreur lors de la recherche. Veuillez réessayer.'
        : 'Error during research. Please try again.';
    }
    
    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || '';
    
    if (data.citations && data.citations.length > 0) {
      result += '\n\n' + (language === 'fr' ? 'Sources:' : 'Sources:');
      data.citations.forEach((citation: string, index: number) => {
        result += `\n[${index + 1}] ${citation}`;
      });
    }
    
    return result;
  } catch (error) {
    console.error('Perplexity search error:', error);
    return language === 'fr' 
      ? 'Erreur lors de la recherche.'
      : 'Research error occurred.';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { messages, context, language, action, claimId }: ChatRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    const systemPrompt = language === 'fr' ? systemPromptFR : systemPromptEN;
    const contextString = buildContextString(context, language);
    
    // If action is 'research', first search with Perplexity
    let researchResults = '';
    if (action === 'research') {
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      researchResults = await searchWithPerplexity(lastUserMessage, language);
    }
    
    // Build the full message with context
    const fullSystemPrompt = `${systemPrompt}\n\n${contextString}${researchResults ? `\n\n## ${language === 'fr' ? 'Résultats de Recherche Web' : 'Web Research Results'}:\n${researchResults}` : ''}`;
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: language === 'fr' 
            ? 'Limite de requêtes atteinte. Veuillez réessayer dans un moment.'
            : 'Rate limit exceeded. Please try again in a moment.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: language === 'fr'
            ? 'Crédits insuffisants. Veuillez ajouter des crédits.'
            : 'Insufficient credits. Please add credits.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }
    
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
    
  } catch (error) {
    console.error('research-chat error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
