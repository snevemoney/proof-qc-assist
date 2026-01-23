import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
  content: string;
}

interface VerifyRequest {
  sources: Source[];
  draftText: string;
  strictMode: boolean;
  language: 'fr' | 'en';
}

const systemPromptEN = `You are an academic verification assistant for Quebec university students. Your task is to verify claims in a student's draft against their uploaded sources.

CRITICAL RULES:
1. ONLY verify claims against the provided source documents - NEVER use external knowledge
2. Each claim must be evaluated against the specific sources provided
3. Use [S1], [S2], etc. to reference sources by their order in the list
4. Be thorough but fair - students are learning

CLAIM IDENTIFICATION RULES (follow these exactly for consistency):
1. Each sentence containing a factual assertion is ONE claim
2. Compound sentences with multiple distinct assertions should be split into separate claims
3. Direct quotes from sources are NOT claims to verify - skip them
4. Meta-statements about the paper (e.g., "This essay will discuss...", "In conclusion...") are NOT claims
5. Opinions clearly marked as such (e.g., "I believe...") are NOT factual claims
6. Process the text in order from beginning to end

For each claim you identify, classify it as:
- "supported": Claim is directly supported by evidence in the sources
- "partial": Claim is partially supported but missing nuance or full context
- "unsupported": Claim cannot be verified from the provided sources (no evidence found)
- "contradicted": The sources directly contradict this claim

STRICT MODE: When strict mode is enabled, require explicit citations and direct quotes. Without strict mode, allow reasonable paraphrasing.

Respond using the suggest_claims tool with your analysis.`;

const systemPromptFR = `Vous êtes un assistant de vérification académique pour les étudiants universitaires du Québec. Votre tâche est de vérifier les affirmations dans le brouillon d'un étudiant par rapport à ses sources téléchargées.

RÈGLES CRITIQUES:
1. Vérifiez UNIQUEMENT les affirmations par rapport aux documents sources fournis - N'utilisez JAMAIS de connaissances externes
2. Chaque affirmation doit être évaluée par rapport aux sources spécifiques fournies
3. Utilisez [S1], [S2], etc. pour référencer les sources par leur ordre dans la liste
4. Soyez rigoureux mais juste - les étudiants apprennent

RÈGLES D'IDENTIFICATION DES AFFIRMATIONS (suivez-les exactement pour la cohérence):
1. Chaque phrase contenant une assertion factuelle est UNE affirmation
2. Les phrases composées avec plusieurs assertions distinctes doivent être divisées en affirmations séparées
3. Les citations directes des sources NE SONT PAS des affirmations à vérifier - ignorez-les
4. Les méta-déclarations sur le document (ex: "Cet essai va discuter...", "En conclusion...") NE SONT PAS des affirmations
5. Les opinions clairement marquées comme telles (ex: "Je crois que...") NE SONT PAS des affirmations factuelles
6. Traitez le texte dans l'ordre du début à la fin

Pour chaque affirmation identifiée, classifiez-la comme:
- "supported": L'affirmation est directement soutenue par des preuves dans les sources
- "partial": L'affirmation est partiellement soutenue mais manque de nuance ou de contexte complet
- "unsupported": L'affirmation ne peut pas être vérifiée à partir des sources fournies
- "contradicted": Les sources contredisent directement cette affirmation

MODE STRICT: Lorsque le mode strict est activé, exigez des citations explicites et des citations directes. Sans mode strict, autorisez une paraphrase raisonnable.

Répondez en utilisant l'outil suggest_claims avec votre analyse.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sources, draftText, strictMode, language }: VerifyRequest = await req.json();

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ error: language === 'fr' ? "Aucune source fournie" : "No sources provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!draftText || draftText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: language === 'fr' ? "Aucun texte de brouillon fourni" : "No draft text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format sources for the prompt
    const sourcesContext = sources.map((source, index) => {
      return `[S${index + 1}] ${source.title}
Authors: ${source.authors}
Year: ${source.year}
Content: ${source.content || 'No content extracted yet'}
---`;
    }).join("\n\n");

    const userPrompt = `${language === 'fr' ? 'MODE STRICT' : 'STRICT MODE'}: ${strictMode ? (language === 'fr' ? 'ACTIVÉ' : 'ENABLED') : (language === 'fr' ? 'DÉSACTIVÉ' : 'DISABLED')}

${language === 'fr' ? 'SOURCES DISPONIBLES' : 'AVAILABLE SOURCES'}:
${sourcesContext}

${language === 'fr' ? 'BROUILLON DE L\'ÉTUDIANT À VÉRIFIER' : 'STUDENT DRAFT TO VERIFY'}:
${draftText}

${language === 'fr' ? 'Analysez le brouillon et identifiez chaque affirmation vérifiable. Pour chaque affirmation, déterminez si elle est soutenue, partiellement soutenue, non soutenue ou contredite par les sources.' : 'Analyze the draft and identify each verifiable claim. For each claim, determine if it is supported, partially supported, unsupported, or contradicted by the sources.'}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        messages: [
          { role: "system", content: language === 'fr' ? systemPromptFR : systemPromptEN },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_claims",
              description: "Return the verification results for all claims found in the draft",
              parameters: {
                type: "object",
                properties: {
                  claims: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { 
                          type: "string",
                          description: "The exact claim text from the student's draft"
                        },
                        status: { 
                          type: "string", 
                          enum: ["supported", "partial", "unsupported", "contradicted"],
                          description: "The verification status of this claim"
                        },
                        sourceRef: { 
                          type: "string",
                          description: "Source reference like [S1] or [S1, S2] if applicable"
                        },
                        evidence: { 
                          type: "string",
                          description: "Direct quote or paraphrase from the source supporting or contradicting the claim"
                        },
                        suggestion: { 
                          type: "string",
                          description: "Helpful suggestion for the student on how to improve this claim"
                        }
                      },
                      required: ["text", "status"],
                      additionalProperties: false
                    }
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalClaims: { type: "number" },
                      supported: { type: "number" },
                      partial: { type: "number" },
                      unsupported: { type: "number" },
                      contradicted: { type: "number" },
                      overallFeedback: { type: "string" }
                    },
                    required: ["totalClaims", "supported", "partial", "unsupported", "contradicted"],
                    additionalProperties: false
                  }
                },
                required: ["claims", "summary"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_claims" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: language === 'fr' ? "Limite de requêtes atteinte, veuillez réessayer plus tard." : "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: language === 'fr' ? "Crédits insuffisants, veuillez ajouter des fonds." : "Payment required, please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_claims") {
      console.error("Unexpected response format:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Add unique IDs to claims
    const claimsWithIds = result.claims.map((claim: any, index: number) => ({
      ...claim,
      id: `claim-${Date.now()}-${index}`,
    }));

    return new Response(
      JSON.stringify({ 
        claims: claimsWithIds, 
        summary: result.summary 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
