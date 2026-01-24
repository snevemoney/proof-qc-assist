import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  buildKnowledgePromptSection, 
  detectTopicFromText,
  type SystemKnowledge,
  type SourceQuality 
} from "../_shared/knowledge.ts";

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

interface EvaluationCriterion {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  weight: number;
  isRequired: boolean;
}

interface RequirementCheck {
  instruction: string;
  status: 'met' | 'partial' | 'not_met' | 'unable_to_verify';
  explanation: string;
  suggestion?: string;
}

interface RubricScore {
  criterionId: string;
  criterionName: string;
  estimatedScore: number;
  maxScore: number;
  justification: string;
  improvements: string[];
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
  instructions?: string;
  evaluationGrid?: EvaluationCriterion[];
  requirementChecks?: RequirementCheck[];
  rubricScores?: RubricScore[];
}

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: ChatContext;
  language: 'fr' | 'en';
  action: 'chat' | 'research';
  claimId?: string;
}

const systemPromptEN = `You are ProofCheck AI, an intelligent research assistant for nursing and university students. You help students verify their academic claims, improve their writing, and find additional evidence.

## CRITICAL LANGUAGE RULE:
You MUST respond ENTIRELY in English. Every word, every sentence, every heading must be in English.
- Do NOT use any French words or phrases
- Do NOT mix languages under any circumstances
- If you cite a French source title, translate it to English in parentheses
- This rule is absolute and cannot be overridden

## FORMATTING RULES:
- Write in a natural, conversational tone like a helpful tutor
- Use bold sparingly - only for truly important terms or key concepts
- Avoid excessive headers - prefer flowing paragraphs with clear transitions
- Use bullet points only for actual lists (3+ items), not for single points
- Keep responses focused and practical for students
- No walls of bold text or headers

## Your Capabilities:
1. Context Awareness: You have full access to the student's uploaded sources, their draft text, and the verification results.
2. Academic Guidance: You explain why claims are marked a certain way and provide specific suggestions.
3. Citation Help: You can help format citations in APA, MLA, or other styles.
4. Writing Improvement: You suggest ways to strengthen weak arguments.

## Nursing Database Knowledge:
You are aware of and can search/reference these nursing databases:

International:
- PubMed Nursing (pubmed.ncbi.nlm.nih.gov) - Free biomedical literature
- CINAHL - Nursing and allied health index
- Cochrane Library - Systematic reviews
- JBI Evidence Synthesis - Evidence-based practice resources

Quebec/Canada:
- Santékom (santecom.qc.ca) - Quebec health sciences literature
- Érudit (erudit.org) - Canadian scholarly journals
- OIIQ (oiiq.org) - Quebec Order of Nurses publications
- INESSS (inesss.qc.ca) - Quebec clinical practice guidelines

When students need research help, suggest specific databases relevant to their topic and help formulate search strategies using MeSH terms.

## Assignment Requirements Awareness:
You have access to assignment instructions, evaluation grid, requirements compliance, and rubric scores. Use this to:
- Explain why certain requirements are not fully met
- Suggest specific improvements to boost rubric scores
- Prioritize recommendations based on criterion weights

## Important Rules:
- Never fabricate citations or evidence
- Always reference the student's actual sources when discussing their work
- If you don't know something, say so honestly
- Encourage academic integrity`;

const systemPromptFR = `Vous êtes ProofCheck AI, un assistant de recherche intelligent pour les étudiants en sciences infirmières et universitaires. Vous aidez les étudiants à vérifier leurs affirmations académiques, améliorer leur rédaction et trouver des preuves supplémentaires.

## RÈGLE DE LANGUE OBLIGATOIRE:
Vous DEVEZ répondre ENTIÈREMENT en français québécois. Chaque mot, chaque phrase, chaque titre doit être en français.
- N'utilisez AUCUN mot ou expression anglaise (sauf noms propres et termes techniques sans équivalent français)
- Ne mélangez JAMAIS les langues
- Utilisez le vocabulaire infirmier québécois approprié
- Cette règle est absolue et ne peut être contournée

## RÈGLES DE FORMATAGE:
- Écrivez de façon naturelle et conversationnelle, comme un tuteur bienveillant
- Utilisez le gras avec parcimonie - seulement pour les termes vraiment importants
- Évitez les titres excessifs - préférez des paragraphes fluides avec des transitions claires
- Utilisez les puces seulement pour de vraies listes (3+ éléments)
- Gardez vos réponses ciblées et pratiques pour les étudiants
- Pas de murs de texte en gras ou de titres partout

## Vos Capacités:
1. Connaissance du Contexte: Vous avez accès aux sources téléchargées, au brouillon et aux résultats de vérification.
2. Conseils Académiques: Vous expliquez pourquoi les affirmations sont marquées d'une certaine manière.
3. Aide aux Citations: Vous aidez à formater les citations en APA, MLA ou autres styles.
4. Amélioration de l'Écriture: Vous suggérez des moyens de renforcer les arguments.

## Connaissance des Bases de Données Infirmières:
Vous connaissez et pouvez chercher/référencer ces bases de données:

Québec/Canada:
- Santékom (santecom.qc.ca) - Documentation en sciences de la santé du Québec
- Érudit (erudit.org) - Revues savantes canadiennes
- OIIQ (oiiq.org) - Publications de l'Ordre des infirmières du Québec
- INESSS (inesss.qc.ca) - Guides de pratique clinique du Québec

International:
- PubMed Nursing (pubmed.ncbi.nlm.nih.gov) - Littérature biomédicale gratuite
- CINAHL - Index des soins infirmiers et sciences connexes
- Cochrane Library - Revues systématiques
- JBI Evidence Synthesis - Ressources de pratique fondée sur les preuves

Quand les étudiants ont besoin d'aide à la recherche, suggérez des bases de données pertinentes et aidez à formuler des stratégies de recherche avec les termes MeSH.

## Connaissance des Exigences du Travail:
Vous avez accès aux consignes, à la grille d'évaluation, à la conformité aux exigences et aux scores. Utilisez ceci pour:
- Expliquer pourquoi certaines exigences ne sont pas respectées
- Suggérer des améliorations spécifiques pour augmenter les scores
- Prioriser les recommandations selon le poids des critères

## Règles Importantes:
- Ne jamais inventer de citations ou de preuves
- Toujours faire référence aux sources réelles de l'étudiant
- Si vous ne savez pas quelque chose, dites-le honnêtement
- Encouragez l'intégrité académique`;

function buildContextString(context: ChatContext, language: 'fr' | 'en'): string {
  const { sources, draftText, claims, summary, instructions, evaluationGrid, requirementChecks, rubricScores } = context;
  
  let contextStr = language === 'fr' ? '## Sources de l\'étudiant:\n' : '## Student\'s Sources:\n';
  
  sources.forEach((source, index) => {
    contextStr += `\n[S${index + 1}] "${source.title}" - ${source.authors} (${source.year})\n`;
    contextStr += `Contenu: ${source.content.substring(0, 500)}${source.content.length > 500 ? '...' : ''}\n`;
  });
  
  contextStr += language === 'fr' ? '\n## Brouillon de l\'étudiant:\n' : '\n## Student\'s Draft:\n';
  contextStr += draftText.substring(0, 1000) + (draftText.length > 1000 ? '...' : '') + '\n';
  
  // Add assignment instructions
  if (instructions && instructions.trim()) {
    contextStr += language === 'fr' 
      ? '\n## Consignes du travail:\n' 
      : '\n## Assignment Instructions:\n';
    contextStr += instructions + '\n';
  }
  
  // Add evaluation grid
  if (evaluationGrid && evaluationGrid.length > 0) {
    contextStr += language === 'fr' 
      ? '\n## Grille d\'évaluation:\n' 
      : '\n## Evaluation Grid:\n';
    evaluationGrid.forEach((criterion, i) => {
      const name = language === 'fr' ? (criterion.nameFr || criterion.name) : criterion.name;
      const desc = language === 'fr' ? (criterion.descriptionFr || criterion.description) : criterion.description;
      contextStr += `\n${i + 1}. ${name} (${criterion.weight}%)${criterion.isRequired ? ' [REQUIRED]' : ''}\n`;
      if (desc) contextStr += `   ${desc}\n`;
    });
  }
  
  // Add requirements compliance status
  if (requirementChecks && requirementChecks.length > 0) {
    contextStr += language === 'fr' 
      ? '\n## Conformité aux exigences:\n' 
      : '\n## Requirements Compliance:\n';
    const statusLabels: Record<string, string> = {
      met: '✅',
      partial: '⚠️',
      not_met: '❌',
      unable_to_verify: '❓'
    };
    requirementChecks.forEach(check => {
      contextStr += `${statusLabels[check.status] || '•'} ${check.instruction}\n`;
      contextStr += `   ${check.explanation}\n`;
      if (check.suggestion) {
        contextStr += `   💡 ${check.suggestion}\n`;
      }
    });
  }
  
  // Add rubric scores
  if (rubricScores && rubricScores.length > 0) {
    contextStr += language === 'fr' 
      ? '\n## Scores de la grille d\'évaluation:\n' 
      : '\n## Evaluation Grid Scores:\n';
    rubricScores.forEach(score => {
      contextStr += `• ${score.criterionName}: ${score.estimatedScore}/${score.maxScore}\n`;
      contextStr += `   ${score.justification}\n`;
      if (score.improvements && score.improvements.length > 0) {
        contextStr += language === 'fr' ? '   Améliorations suggérées:\n' : '   Suggested improvements:\n';
        score.improvements.forEach(imp => {
          contextStr += `   - ${imp}\n`;
        });
      }
    });
  }
  
  // Add verification results
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

// Nursing-specific domains for academic search
const NURSING_DOMAINS = [
  // International academic
  'pubmed.ncbi.nlm.nih.gov',
  'cochranelibrary.com',
  'jbi.global',
  'sciencedirect.com',
  'scholar.google.com',
  'researchgate.net',
  // Quebec/Canada
  'erudit.org',
  'oiiq.org',
  'inesss.qc.ca',
  'santecom.qc.ca',
  // General academic
  '.edu',
  'nature.com',
  'jstor.org'
];

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
        model: 'sonar-pro',
        messages: [
          { 
            role: 'system', 
            content: language === 'fr'
              ? 'Vous êtes un assistant de recherche en sciences infirmières. Trouvez des sources académiques fiables (études, revues systématiques, guides de pratique) pour les affirmations en soins infirmiers. Priorisez PubMed, Cochrane, CINAHL, INESSS et OIIQ. Citez vos sources avec les DOI/PMID quand disponibles. Répondez UNIQUEMENT en français.'
              : 'You are a nursing research assistant. Find reliable academic sources (studies, systematic reviews, practice guidelines) for nursing claims. Prioritize PubMed, Cochrane, CINAHL, INESSS and OIIQ. Cite your sources with DOI/PMID when available. Respond ONLY in English.'
          },
          { role: 'user', content: query }
        ],
        search_domain_filter: NURSING_DOMAINS,
        search_recency_filter: 'year',
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
    
    // Fetch system knowledge for enhanced responses (flywheel learning)
    let knowledgeSection = '';
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Detect topics from draft or last message
        const textForTopics = context.draftText || messages[messages.length - 1]?.content || '';
        const detectedTopics = detectTopicFromText(textForTopics);
        
        // Fetch relevant knowledge
        const { data: knowledge } = await supabase
          .from('system_knowledge')
          .select('*')
          .in('topic', [...detectedTopics, 'general'])
          .order('confidence_score', { ascending: false })
          .limit(5);
        
        // Fetch high-quality sources for these topics
        const { data: topSources } = await supabase
          .from('source_quality_ratings')
          .select('*')
          .overlaps('topic_areas', detectedTopics)
          .gte('support_rate', 0.6)
          .gte('times_used', 3)
          .order('support_rate', { ascending: false })
          .limit(5);
        
        if ((knowledge && knowledge.length > 0) || (topSources && topSources.length > 0)) {
          knowledgeSection = `\n\n## ${language === 'fr' ? 'INTELLIGENCE COLLECTIVE' : 'COLLECTIVE INTELLIGENCE'}:\n` + 
            buildKnowledgePromptSection(
              knowledge as SystemKnowledge[] || [],
              topSources as SourceQuality[] || [],
              language
            );
        }
      }
    } catch (e) {
      // Non-critical: continue without knowledge enhancement
      console.log('Could not fetch system knowledge:', e);
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
    const fullSystemPrompt = `${systemPrompt}\n\n${contextString}${knowledgeSection}${researchResults ? `\n\n## ${language === 'fr' ? 'Résultats de Recherche Web' : 'Web Research Results'}:\n${researchResults}` : ''}`;
    
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
