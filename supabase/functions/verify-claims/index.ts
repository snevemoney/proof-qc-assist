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

const systemPromptEN = `You are an academic verification assistant for Quebec university nursing students. Your task is to verify claims AND nursing interventions in a student's draft against their uploaded sources.

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

NURSING INTERVENTION IDENTIFICATION:
In addition to general claims, identify nursing interventions in care plans. An intervention is a clinical action the nurse will perform.

Look for interventions indicated by:
- Action verbs: "administer", "monitor", "assess", "educate", "position", "reposition", "implement", "apply", "provide", "perform"
- Care plan language: "nursing intervention", "will provide", "patient will receive"
- Clinical actions: medication administration, vital signs monitoring, patient education, wound care, mobility assistance, pain management

For each intervention, evaluate:
1. severity: Assign a priority level based on clinical importance:
   - "critical": Life-threatening or safety-critical interventions (e.g., medication administration, airway management, fall prevention, infection control). These REQUIRE the strongest research evidence.
   - "standard": Core nursing care interventions that are part of evidence-based practice (e.g., vital signs monitoring, wound care, mobility assistance). These need solid evidence.
   - "optional": Supportive comfort measures or patient preferences (e.g., aromatherapy, music therapy, positioning for comfort). Nice to have evidence but not mandatory.
2. hasEvidence: Is this intervention supported by research evidence in the sources? (true/false)
3. hasRationale: Does the student explain WHY this intervention is clinically appropriate? (true/false)
4. rationaleText: Extract the rationale if present
5. suggestion: Helpful suggestion if evidence or rationale is missing (especially important for critical interventions)

STRICT MODE: When strict mode is enabled, require explicit citations and direct quotes. Without strict mode, allow reasonable paraphrasing.

Respond using the suggest_claims tool with your analysis.`;

const systemPromptFR = `Vous êtes un assistant de vérification académique pour les étudiants en sciences infirmières des universités du Québec. Votre tâche est de vérifier les affirmations ET les interventions infirmières dans le brouillon d'un étudiant par rapport à ses sources téléchargées.

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

IDENTIFICATION DES INTERVENTIONS INFIRMIÈRES:
En plus des affirmations générales, identifiez les interventions infirmières dans les plans de soins. Une intervention est une action clinique que l'infirmière effectuera.

Recherchez les interventions indiquées par:
- Verbes d'action: "administrer", "surveiller", "évaluer", "éduquer", "positionner", "repositionner", "implémenter", "appliquer", "fournir", "effectuer"
- Langage de plan de soins: "intervention infirmière", "fournira", "le patient recevra"
- Actions cliniques: administration de médicaments, surveillance des signes vitaux, éducation du patient, soins des plaies, aide à la mobilité, gestion de la douleur

Pour chaque intervention, évaluez:
1. severity: Attribuez un niveau de priorité basé sur l'importance clinique:
   - "critical": Interventions critiques pour la vie ou la sécurité (ex: administration de médicaments, gestion des voies respiratoires, prévention des chutes, contrôle des infections). EXIGENT les preuves de recherche les plus solides.
   - "standard": Interventions de soins infirmiers de base qui font partie de la pratique fondée sur des preuves (ex: surveillance des signes vitaux, soins des plaies, aide à la mobilité). Nécessitent des preuves solides.
   - "optional": Mesures de confort de soutien ou préférences du patient (ex: aromathérapie, musicothérapie, positionnement pour le confort). Preuves souhaitables mais non obligatoires.
2. hasEvidence: Cette intervention est-elle soutenue par des preuves de recherche dans les sources? (vrai/faux)
3. hasRationale: L'étudiant explique-t-il POURQUOI cette intervention est cliniquement appropriée? (vrai/faux)
4. rationaleText: Extrayez la justification si présente
5. suggestion: Suggestion utile si la preuve ou la justification manque (particulièrement important pour les interventions critiques)

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

${language === 'fr' ? 'Analysez le brouillon et identifiez chaque affirmation vérifiable ET chaque intervention infirmière. Pour chaque affirmation, déterminez si elle est soutenue, partiellement soutenue, non soutenue ou contredite par les sources. Pour chaque intervention, évaluez si elle a des preuves et une justification.' : 'Analyze the draft and identify each verifiable claim AND each nursing intervention. For each claim, determine if it is supported, partially supported, unsupported, or contradicted by the sources. For each intervention, evaluate if it has evidence and rationale.'}`;

    // Create AbortController for timeout (90 seconds for complex drafts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                description: "Return the verification results for all claims and interventions found in the draft",
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
                    interventions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: {
                            type: "string",
                            description: "The nursing intervention text from the student's draft"
                          },
                          severity: {
                            type: "string",
                            enum: ["critical", "standard", "optional"],
                            description: "Priority level: critical (life/safety), standard (core care), optional (comfort/preference)"
                          },
                          hasEvidence: {
                            type: "boolean",
                            description: "Whether this intervention is supported by research evidence in the sources"
                          },
                          hasRationale: {
                            type: "boolean",
                            description: "Whether the student explains WHY this intervention is clinically appropriate"
                          },
                          sourceRef: {
                            type: "string",
                            description: "Source reference like [S1] if evidence is found"
                          },
                          rationaleText: {
                            type: "string",
                            description: "The extracted rationale text if present"
                          },
                          suggestion: {
                            type: "string",
                            description: "Helpful suggestion for the student if evidence or rationale is missing"
                          }
                        },
                        required: ["text", "severity", "hasEvidence", "hasRationale"],
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
                        overallFeedback: { type: "string" },
                        totalInterventions: { type: "number" },
                        interventionsWithEvidence: { type: "number" },
                        interventionsWithRationale: { type: "number" }
                      },
                      required: ["totalClaims", "supported", "partial", "unsupported", "contradicted", "totalInterventions", "interventionsWithEvidence", "interventionsWithRationale"],
                      additionalProperties: false
                    }
                  },
                  required: ["claims", "interventions", "summary"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "suggest_claims" } },
        }),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if ((fetchError as Error).name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: language === 'fr' ? "La vérification a pris trop de temps. Veuillez réessayer." : "Verification timed out. Please try again." }),
          { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

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

    // Add unique IDs to interventions and ensure severity fallback
    const interventionsWithIds = (result.interventions || []).map((intervention: any, index: number) => ({
      ...intervention,
      id: `intervention-${Date.now()}-${index}`,
      severity: intervention.severity || 'standard', // Fallback to standard if not provided
    }));

    // Ensure summary has intervention fields (fallback for edge cases)
    const summary = {
      ...result.summary,
      totalInterventions: result.summary.totalInterventions ?? interventionsWithIds.length,
      interventionsWithEvidence: result.summary.interventionsWithEvidence ?? interventionsWithIds.filter((i: any) => i.hasEvidence).length,
      interventionsWithRationale: result.summary.interventionsWithRationale ?? interventionsWithIds.filter((i: any) => i.hasRationale).length,
    };

    return new Response(
      JSON.stringify({ 
        claims: claimsWithIds,
        interventions: interventionsWithIds,
        summary 
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
