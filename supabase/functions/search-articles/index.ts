import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  language: 'fr' | 'en';
  context?: {
    draftTopic?: string;
    existingSources?: string[];
    unsupportedClaims?: string[];
  };
  filters?: {
    studyType?: string;
    recency?: 'week' | 'month' | 'year' | '5years' | 'all';
    expandedMode?: boolean;
  };
}

interface ArticleResult {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
  keyFindings?: string[];
  studyType?: string;
  studyTypeFr?: string;
  verificationStatus: 'verified' | 'partial';
  verificationLinks: {
    doi?: string;
    pubmed?: string;
    publisher?: string;
    googleScholar?: string;
  };
  citationAPA?: string;
  url?: string;
  relevanceExplanation?: string;
}

// 28 study types with French translations
const STUDY_TYPES: Record<string, string> = {
  'systematic review': 'Revue systématique',
  'meta-analysis': 'Méta-analyse',
  'literature review': 'Revue de littérature',
  'scoping review': 'Revue exploratoire',
  'umbrella review': 'Revue parapluie',
  'randomized controlled trial': 'ECR',
  'rct': 'ECR',
  'experimental study': 'Étude expérimentale',
  'quasi-experimental': 'Étude quasi-expérimentale',
  'pilot study': 'Étude pilote',
  'cohort study': 'Étude de cohorte',
  'case-control': 'Étude cas-témoins',
  'cross-sectional': 'Étude transversale',
  'longitudinal': 'Étude longitudinale',
  'prospective': 'Étude prospective',
  'retrospective': 'Étude rétrospective',
  'epidemiological': 'Étude épidémiologique',
  'prevalence study': 'Étude de prévalence',
  'descriptive study': 'Étude descriptive',
  'observational': 'Étude observationnelle',
  'qualitative': 'Étude qualitative',
  'mixed methods': 'Étude mixte',
  'case series': 'Série de cas',
  'case study': 'Étude de cas',
  'survey': 'Enquête',
  'ecological study': 'Étude écologique',
  'thesis': 'Thèse',
  'report': 'Rapport',
  'guideline': 'Ligne directrice',
  'clinical guideline': 'Ligne directrice clinique',
};

function detectStudyType(text: string): { type: string; typeFr: string } | null {
  const lowerText = text.toLowerCase();
  
  for (const [key, frLabel] of Object.entries(STUDY_TYPES)) {
    if (lowerText.includes(key)) {
      return { type: key, typeFr: frLabel };
    }
  }
  
  return null;
}

function generateAPA7Citation(article: Partial<ArticleResult>): string {
  const authors = article.authors || 'Unknown Author';
  const year = article.year || 'n.d.';
  const title = article.title || 'Untitled';
  const journal = article.journal || '';
  const doi = article.verificationLinks?.doi;
  
  let citation = `${authors} (${year}). ${title}.`;
  if (journal) {
    citation += ` *${journal}*.`;
  }
  if (doi) {
    citation += ` https://doi.org/${doi}`;
  }
  
  return citation;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { query, language, context, filters }: SearchRequest = await req.json();
    
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(JSON.stringify({ 
        error: language === 'fr' 
          ? 'Clé API Perplexity non configurée.'
          : 'Perplexity API key not configured.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Build the search prompt
    const systemPrompt = language === 'fr'
      ? `Vous êtes un assistant de recherche académique spécialisé. Recherchez des articles académiques pertinents et retournez les résultats en format JSON structuré.

Pour chaque article trouvé, extrayez:
- title: titre complet de l'article
- authors: auteurs (max 3, puis "et al." ou "et coll.")
- year: année de publication
- journal: nom de la revue
- abstract: résumé court (2-3 phrases)
- keyFindings: 2-4 résultats clés (array)
- studyType: type d'étude en anglais (systematic review, meta-analysis, RCT, cohort study, etc.)
- doi: identifiant DOI si disponible
- pubmedId: ID PubMed si disponible
- url: lien vers l'article
- relevanceExplanation: pourquoi cet article est pertinent pour la requête

IMPORTANT: 
- Priorisez les sources vérifiables avec DOI ou PubMed ID
- Incluez uniquement des articles académiques réels et vérifiables
- Limitez à 5-8 articles les plus pertinents
- Retournez UNIQUEMENT le JSON, pas de texte supplémentaire`
      : `You are a specialized academic research assistant. Search for relevant academic articles and return results in structured JSON format.

For each article found, extract:
- title: complete article title
- authors: authors (max 3, then "et al.")
- year: publication year
- journal: journal name
- abstract: short summary (2-3 sentences)
- keyFindings: 2-4 key findings (array)
- studyType: study type in English (systematic review, meta-analysis, RCT, cohort study, etc.)
- doi: DOI identifier if available
- pubmedId: PubMed ID if available
- url: link to article
- relevanceExplanation: why this article is relevant to the query

IMPORTANT:
- Prioritize verifiable sources with DOI or PubMed ID
- Include only real, verifiable academic articles
- Limit to 5-8 most relevant articles
- Return ONLY JSON, no additional text`;

    // Build context-aware query
    let enhancedQuery = query;
    if (context) {
      if (context.draftTopic) {
        enhancedQuery += ` (related to: ${context.draftTopic})`;
      }
      if (context.unsupportedClaims && context.unsupportedClaims.length > 0) {
        enhancedQuery += ` (need evidence for: ${context.unsupportedClaims.slice(0, 2).join(', ')})`;
      }
    }
    
    // Apply recency filter
    let recencyFilter: string | undefined;
    if (filters?.recency) {
      const recencyMap: Record<string, string> = {
        'week': 'week',
        'month': 'month',
        'year': 'year',
        '5years': undefined as unknown as string, // Perplexity doesn't have 5 years, we'll handle in prompt
      };
      recencyFilter = recencyMap[filters.recency];
    }
    
    const perplexityBody: Record<string, unknown> = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Search for academic articles about: ${enhancedQuery}

Return a JSON object with this structure:
{
  "articles": [
    {
      "title": "...",
      "authors": "...",
      "year": "...",
      "journal": "...",
      "abstract": "...",
      "keyFindings": ["...", "..."],
      "studyType": "...",
      "doi": "...",
      "pubmedId": "...",
      "url": "...",
      "relevanceExplanation": "..."
    }
  ]
}`
        }
      ],
      search_mode: 'academic',
      search_domain_filter: [
        'pubmed.ncbi.nlm.nih.gov',
        'scholar.google.com',
        'sciencedirect.com',
        'springer.com',
        'nature.com',
        'cochranelibrary.com',
        'jstor.org',
        'researchgate.net',
        'erudit.org',
        'inesss.qc.ca',
        'inspq.qc.ca',
      ],
    };
    
    if (recencyFilter) {
      perplexityBody.search_recency_filter = recencyFilter;
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(perplexityBody),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: language === 'fr' 
            ? 'Limite de requêtes atteinte. Veuillez réessayer.'
            : 'Rate limit exceeded. Please try again.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.error('Perplexity API error:', response.status);
      return new Response(JSON.stringify({ 
        error: language === 'fr'
          ? 'Erreur lors de la recherche.'
          : 'Search error occurred.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    
    // Parse the JSON response
    let articles: ArticleResult[] = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*"articles"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const rawArticles = parsed.articles || [];
        
        articles = rawArticles.map((article: any, index: number) => {
          const studyTypeInfo = detectStudyType(article.studyType || article.abstract || article.title || '');
          
          // Determine verification status
          const hasVerification = !!(article.doi || article.pubmedId);
          
          const result: ArticleResult = {
            id: `article-${Date.now()}-${index}`,
            title: article.title || 'Untitled',
            authors: article.authors || 'Unknown',
            year: article.year || new Date().getFullYear().toString(),
            journal: article.journal,
            abstract: article.abstract,
            keyFindings: article.keyFindings || [],
            studyType: studyTypeInfo?.type || article.studyType,
            studyTypeFr: studyTypeInfo?.typeFr || article.studyType,
            verificationStatus: hasVerification ? 'verified' : 'partial',
            verificationLinks: {
              doi: article.doi,
              pubmed: article.pubmedId ? `https://pubmed.ncbi.nlm.nih.gov/${article.pubmedId}` : undefined,
              publisher: article.url,
              googleScholar: article.title ? `https://scholar.google.com/scholar?q=${encodeURIComponent(article.title)}` : undefined,
            },
            url: article.url || (article.doi ? `https://doi.org/${article.doi}` : undefined),
            relevanceExplanation: article.relevanceExplanation,
          };
          
          result.citationAPA = generateAPA7Citation(result);
          
          return result;
        });
      }
    } catch (parseError) {
      console.error('Failed to parse articles JSON:', parseError);
      // Return empty articles array if parsing fails
    }
    
    // Add Perplexity citations as fallback sources if no articles parsed
    if (articles.length === 0 && citations.length > 0) {
      articles = citations.slice(0, 5).map((citation: string, index: number) => ({
        id: `citation-${Date.now()}-${index}`,
        title: citation,
        authors: 'Source web',
        year: new Date().getFullYear().toString(),
        verificationStatus: 'partial' as const,
        verificationLinks: {
          publisher: citation.startsWith('http') ? citation : undefined,
        },
        url: citation.startsWith('http') ? citation : undefined,
      }));
    }
    
    return new Response(JSON.stringify({ 
      articles,
      query,
      totalResults: articles.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('search-articles error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
