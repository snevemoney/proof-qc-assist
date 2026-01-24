// Shared knowledge fetching utilities for AI prompt enhancement

export interface SystemKnowledge {
  id: string;
  category: string;
  topic: string;
  data: Record<string, any>;
  confidence_score: number;
  usage_count: number;
}

export interface SourceQuality {
  source_title: string;
  source_authors: string;
  source_year: string;
  support_rate: number;
  times_used: number;
}

// Error pattern descriptions for prompts
export const ERROR_PATTERN_DESCRIPTIONS: Record<string, { en: string; fr: string }> = {
  absolute_statements: {
    en: 'Using absolute terms like "always" or "never" without evidence',
    fr: 'Utilisation de termes absolus comme "toujours" ou "jamais" sans preuve'
  },
  unverified_statistics: {
    en: 'Including statistics or percentages without proper citations',
    fr: 'Inclusion de statistiques ou pourcentages sans citations appropriées'
  },
  missing_citation: {
    en: 'Making claims without any source reference',
    fr: 'Affirmations sans référence à une source'
  },
  overclaimed_evidence: {
    en: 'Overstating evidence with words like "proven" or "demonstrated"',
    fr: 'Exagération des preuves avec des mots comme "prouvé" ou "démontré"'
  },
};

// Build enhanced prompt section from system knowledge
export function buildKnowledgePromptSection(
  knowledge: SystemKnowledge[],
  topSources: SourceQuality[],
  language: 'fr' | 'en'
): string {
  const sections: string[] = [];

  // Add common error patterns if available
  const errorKnowledge = knowledge.filter(k => k.category === 'common_error' && k.confidence_score > 0.4);
  
  if (errorKnowledge.length > 0) {
    const header = language === 'fr' 
      ? '## ERREURS COURANTES À SURVEILLER (apprentissage collectif):'
      : '## COMMON ERRORS TO WATCH FOR (learned from collective data):';
    
    const errorLines: string[] = [header];
    
    for (const k of errorKnowledge.slice(0, 3)) {
      const patterns = k.data as Record<string, number>;
      const sortedPatterns = Object.entries(patterns)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      
      for (const [pattern, count] of sortedPatterns) {
        const desc = ERROR_PATTERN_DESCRIPTIONS[pattern];
        if (desc && count > 2) {
          errorLines.push(`- ${desc[language]} (${language === 'fr' ? 'fréquence' : 'frequency'}: ${count})`);
        }
      }
    }
    
    if (errorLines.length > 1) {
      sections.push(errorLines.join('\n'));
    }
  }

  // Add high-quality source recommendations if available
  if (topSources.length > 0) {
    const sourcesHeader = language === 'fr'
      ? '## SOURCES DE HAUTE QUALITÉ (basé sur les vérifications précédentes):'
      : '## HIGH-QUALITY SOURCES (based on previous verifications):';
    
    const sourceLines: string[] = [sourcesHeader];
    
    for (const source of topSources.slice(0, 5)) {
      const rate = Math.round(source.support_rate * 100);
      sourceLines.push(
        `- ${source.source_authors} (${source.source_year}): "${source.source_title}" - ${rate}% ${language === 'fr' ? 'taux de support' : 'support rate'}`
      );
    }
    
    sections.push(sourceLines.join('\n'));
  }

  return sections.join('\n\n');
}

// Extract topic from draft text for knowledge matching
export function detectTopicFromText(text: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    'aging_care': ['vieillissement', 'aging', 'elderly', 'aîné', 'gérontologie', 'gériatrie', 'personne âgée'],
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
  const detected: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      detected.push(topic);
    }
  }

  return detected;
}
