/**
 * Nursing Thesaurus - MeSH/CINAHL Term Mappings
 * Maps common nursing terms (FR/EN) to standardized MeSH headings
 * for more precise academic database searches.
 */

export interface NursingTerm {
  mesh: string;           // MeSH heading for PubMed
  cinahl?: string;        // CINAHL subject heading (if different)
  category: NursingCategory;
  synonymsFr: string[];   // French synonyms
  synonymsEn: string[];   // English synonyms
}

export type NursingCategory = 
  | 'wound'           // Soins des plaies
  | 'chronic'         // Maladies chroniques
  | 'safety'          // Sécurité du patient
  | 'infection'       // Prévention des infections
  | 'mental'          // Santé mentale
  | 'pediatric'       // Pédiatrie
  | 'geriatric'       // Gériatrie
  | 'critical'        // Soins critiques
  | 'palliative'      // Soins palliatifs
  | 'assessment'      // Évaluation
  | 'education'       // Éducation patient
  | 'medication'      // Médication
  | 'nutrition'       // Nutrition
  | 'mobility'        // Mobilité
  | 'cardiovascular'  // Cardiovasculaire
  | 'respiratory'     // Respiratoire
  | 'oncology'        // Oncologie
  | 'maternal'        // Périnatalité
  | 'pain'            // Douleur
  | 'general';        // Général

export const NURSING_THESAURUS: Record<string, NursingTerm> = {
  // === SOINS DES PLAIES / WOUND CARE ===
  'plaie de pression': {
    mesh: '"Pressure Ulcer"[MeSH]',
    cinahl: 'Pressure Ulcer',
    category: 'wound',
    synonymsFr: ['escarre', 'ulcère de pression', 'lésion de pression'],
    synonymsEn: ['pressure ulcer', 'pressure injury', 'bedsore', 'decubitus ulcer'],
  },
  'pansement': {
    mesh: '"Bandages"[MeSH]',
    cinahl: 'Wound Dressings',
    category: 'wound',
    synonymsFr: ['changement pansement', 'soins de plaie'],
    synonymsEn: ['dressing', 'wound dressing', 'bandage'],
  },
  'cicatrisation': {
    mesh: '"Wound Healing"[MeSH]',
    category: 'wound',
    synonymsFr: ['guérison plaie', 'réparation tissulaire'],
    synonymsEn: ['wound healing', 'tissue repair'],
  },
  'débridement': {
    mesh: '"Debridement"[MeSH]',
    category: 'wound',
    synonymsFr: ['nettoyage plaie'],
    synonymsEn: ['debridement', 'wound debridement'],
  },
  'ulcère veineux': {
    mesh: '"Varicose Ulcer"[MeSH]',
    category: 'wound',
    synonymsFr: ['ulcère jambe', 'ulcère variqueux'],
    synonymsEn: ['venous ulcer', 'leg ulcer', 'varicose ulcer'],
  },

  // === MALADIES CHRONIQUES / CHRONIC CONDITIONS ===
  'diabète': {
    mesh: '"Diabetes Mellitus"[MeSH]',
    category: 'chronic',
    synonymsFr: ['diabétique', 'glycémie'],
    synonymsEn: ['diabetes', 'diabetic', 'blood sugar'],
  },
  'soins des pieds': {
    mesh: '"Foot/nursing"[MeSH]',
    cinahl: 'Foot Care',
    category: 'chronic',
    synonymsFr: ['pédicure', 'examen pieds', 'soins podologiques'],
    synonymsEn: ['foot care', 'foot examination', 'podiatric care'],
  },
  'insuffisance cardiaque': {
    mesh: '"Heart Failure"[MeSH]',
    category: 'cardiovascular',
    synonymsFr: ['défaillance cardiaque', 'IC'],
    synonymsEn: ['heart failure', 'cardiac failure', 'CHF'],
  },
  'hypertension': {
    mesh: '"Hypertension"[MeSH]',
    category: 'cardiovascular',
    synonymsFr: ['haute pression', 'tension artérielle élevée', 'HTA'],
    synonymsEn: ['high blood pressure', 'HTN'],
  },
  'MPOC': {
    mesh: '"Pulmonary Disease, Chronic Obstructive"[MeSH]',
    category: 'respiratory',
    synonymsFr: ['maladie pulmonaire obstructive chronique', 'emphysème', 'bronchite chronique'],
    synonymsEn: ['COPD', 'chronic obstructive pulmonary disease'],
  },

  // === SÉCURITÉ DU PATIENT / PATIENT SAFETY ===
  'chute': {
    mesh: '"Accidental Falls"[MeSH]',
    cinahl: 'Accidental Falls',
    category: 'safety',
    synonymsFr: ['prévention des chutes', 'risque de chute'],
    synonymsEn: ['fall', 'fall prevention', 'fall risk'],
  },
  'contention': {
    mesh: '"Restraint, Physical"[MeSH]',
    category: 'safety',
    synonymsFr: ['mesures de contrôle', 'immobilisation'],
    synonymsEn: ['physical restraint', 'restraints'],
  },
  'erreur médicamenteuse': {
    mesh: '"Medication Errors"[MeSH]',
    category: 'medication',
    synonymsFr: ['erreur de médication', 'événement indésirable médicamenteux'],
    synonymsEn: ['medication error', 'drug error', 'adverse drug event'],
  },
  'identification patient': {
    mesh: '"Patient Identification Systems"[MeSH]',
    category: 'safety',
    synonymsFr: ['bracelet identification', 'vérification identité'],
    synonymsEn: ['patient identification', 'ID band'],
  },

  // === PRÉVENTION DES INFECTIONS / INFECTION CONTROL ===
  'hygiène des mains': {
    mesh: '"Hand Hygiene"[MeSH]',
    cinahl: 'Handwashing',
    category: 'infection',
    synonymsFr: ['lavage mains', 'désinfection mains', 'friction hydro-alcoolique'],
    synonymsEn: ['hand washing', 'hand hygiene', 'hand sanitization'],
  },
  'infection nosocomiale': {
    mesh: '"Cross Infection"[MeSH]',
    cinahl: 'Healthcare Associated Infections',
    category: 'infection',
    synonymsFr: ['infection associée aux soins', 'IAS', 'infection hospitalière'],
    synonymsEn: ['nosocomial infection', 'hospital-acquired infection', 'HAI'],
  },
  'SARM': {
    mesh: '"Methicillin-Resistant Staphylococcus aureus"[MeSH]',
    category: 'infection',
    synonymsFr: ['staphylocoque doré résistant'],
    synonymsEn: ['MRSA', 'methicillin-resistant staph'],
  },
  'isolement': {
    mesh: '"Patient Isolation"[MeSH]',
    category: 'infection',
    synonymsFr: ['précautions additionnelles', 'isolement contact', 'isolement gouttelettes'],
    synonymsEn: ['isolation', 'infection control precautions', 'contact precautions'],
  },
  'cathéter': {
    mesh: '"Catheterization"[MeSH]',
    category: 'infection',
    synonymsFr: ['sonde urinaire', 'voie centrale', 'cathéter veineux'],
    synonymsEn: ['catheter', 'urinary catheter', 'central line'],
  },
  'infection urinaire': {
    mesh: '"Urinary Tract Infections"[MeSH]',
    category: 'infection',
    synonymsFr: ['IU', 'cystite', 'infection cathéter urinaire'],
    synonymsEn: ['UTI', 'urinary tract infection', 'CAUTI'],
  },

  // === ÉVALUATION / ASSESSMENT ===
  'évaluation initiale': {
    mesh: '"Nursing Assessment"[MeSH]',
    cinahl: 'Nursing Assessment',
    category: 'assessment',
    synonymsFr: ['collecte données', 'anamnèse', 'évaluation admission'],
    synonymsEn: ['nursing assessment', 'initial assessment', 'admission assessment'],
  },
  'signes vitaux': {
    mesh: '"Vital Signs"[MeSH]',
    category: 'assessment',
    synonymsFr: ['paramètres vitaux', 'SV'],
    synonymsEn: ['vital signs', 'vitals'],
  },
  'échelle douleur': {
    mesh: '"Pain Measurement"[MeSH]',
    category: 'pain',
    synonymsFr: ['évaluation douleur', 'EVA', 'échelle numérique'],
    synonymsEn: ['pain scale', 'pain assessment', 'VAS', 'numeric rating scale'],
  },
  'état mental': {
    mesh: '"Mental Status and Dementia Tests"[MeSH]',
    category: 'assessment',
    synonymsFr: ['évaluation cognitive', 'MMSE', 'confusion'],
    synonymsEn: ['mental status', 'cognitive assessment', 'MMSE'],
  },
  'état nutritionnel': {
    mesh: '"Nutritional Status"[MeSH]',
    category: 'nutrition',
    synonymsFr: ['évaluation nutritionnelle', 'dénutrition', 'IMC'],
    synonymsEn: ['nutritional status', 'malnutrition', 'BMI'],
  },
  'échelle Braden': {
    mesh: '"Risk Assessment"[MeSH] AND "Pressure Ulcer"[MeSH]',
    cinahl: 'Braden Scale',
    category: 'assessment',
    synonymsFr: ['risque escarre', 'évaluation peau'],
    synonymsEn: ['Braden scale', 'pressure ulcer risk'],
  },

  // === MOBILITÉ / MOBILITY ===
  'mobilisation précoce': {
    mesh: '"Early Ambulation"[MeSH]',
    category: 'mobility',
    synonymsFr: ['lever précoce', 'marche précoce', 'mobilité'],
    synonymsEn: ['early mobilization', 'early ambulation'],
  },
  'transfert': {
    mesh: '"Moving and Lifting Patients"[MeSH]',
    category: 'mobility',
    synonymsFr: ['positionnement', 'mobilisation patient', 'techniques manutention'],
    synonymsEn: ['patient transfer', 'patient handling', 'repositioning'],
  },
  'réadaptation': {
    mesh: '"Rehabilitation Nursing"[MeSH]',
    category: 'mobility',
    synonymsFr: ['physiothérapie', 'récupération fonctionnelle'],
    synonymsEn: ['rehabilitation', 'physical therapy', 'functional recovery'],
  },

  // === DOULEUR / PAIN ===
  'douleur': {
    mesh: '"Pain Management"[MeSH]',
    category: 'pain',
    synonymsFr: ['gestion douleur', 'analgésie', 'soulagement douleur'],
    synonymsEn: ['pain', 'pain management', 'analgesia'],
  },
  'douleur chronique': {
    mesh: '"Chronic Pain"[MeSH]',
    category: 'pain',
    synonymsFr: ['douleur persistante'],
    synonymsEn: ['chronic pain', 'persistent pain'],
  },
  'douleur postopératoire': {
    mesh: '"Pain, Postoperative"[MeSH]',
    category: 'pain',
    synonymsFr: ['douleur post-op', 'analgésie postopératoire'],
    synonymsEn: ['postoperative pain', 'post-surgical pain'],
  },

  // === SANTÉ MENTALE / MENTAL HEALTH ===
  'anxiété': {
    mesh: '"Anxiety"[MeSH]',
    category: 'mental',
    synonymsFr: ['stress', 'angoisse'],
    synonymsEn: ['anxiety', 'stress', 'anxious'],
  },
  'dépression': {
    mesh: '"Depression"[MeSH]',
    category: 'mental',
    synonymsFr: ['trouble dépressif', 'humeur dépressive'],
    synonymsEn: ['depression', 'depressive disorder'],
  },
  'délirium': {
    mesh: '"Delirium"[MeSH]',
    category: 'mental',
    synonymsFr: ['confusion aiguë', 'état confusionnel'],
    synonymsEn: ['delirium', 'acute confusion'],
  },
  'suicide': {
    mesh: '"Suicide Prevention"[MeSH]',
    category: 'mental',
    synonymsFr: ['idées suicidaires', 'risque suicidaire', 'prévention suicide'],
    synonymsEn: ['suicide', 'suicidal ideation', 'suicide prevention'],
  },

  // === GÉRIATRIE / GERIATRICS ===
  'personnes âgées': {
    mesh: '"Aged"[MeSH]',
    category: 'geriatric',
    synonymsFr: ['aînés', 'gériatrie', 'vieillissement'],
    synonymsEn: ['elderly', 'older adults', 'geriatric'],
  },
  'démence': {
    mesh: '"Dementia"[MeSH]',
    category: 'geriatric',
    synonymsFr: ['Alzheimer', 'trouble neurocognitif', 'TNC'],
    synonymsEn: ['dementia', 'Alzheimer', 'cognitive impairment'],
  },
  'polymédication': {
    mesh: '"Polypharmacy"[MeSH]',
    category: 'geriatric',
    synonymsFr: ['multimédication', 'plusieurs médicaments'],
    synonymsEn: ['polypharmacy', 'multiple medications'],
  },
  'syndrome gériatrique': {
    mesh: '"Geriatric Assessment"[MeSH]',
    category: 'geriatric',
    synonymsFr: ['fragilité', 'évaluation gériatrique'],
    synonymsEn: ['geriatric syndrome', 'frailty', 'geriatric assessment'],
  },

  // === SOINS CRITIQUES / CRITICAL CARE ===
  'soins intensifs': {
    mesh: '"Intensive Care Units"[MeSH]',
    cinahl: 'Intensive Care Units',
    category: 'critical',
    synonymsFr: ['USI', 'réanimation', 'unité soins intensifs'],
    synonymsEn: ['ICU', 'intensive care', 'critical care'],
  },
  'ventilation mécanique': {
    mesh: '"Respiration, Artificial"[MeSH]',
    category: 'critical',
    synonymsFr: ['intubation', 'respirateur', 'sevrage ventilatoire'],
    synonymsEn: ['mechanical ventilation', 'ventilator', 'weaning'],
  },
  'surveillance hémodynamique': {
    mesh: '"Hemodynamic Monitoring"[MeSH]',
    category: 'critical',
    synonymsFr: ['monitorage', 'ligne artérielle'],
    synonymsEn: ['hemodynamic monitoring', 'arterial line'],
  },

  // === SOINS PALLIATIFS / PALLIATIVE CARE ===
  'soins palliatifs': {
    mesh: '"Palliative Care"[MeSH]',
    category: 'palliative',
    synonymsFr: ['fin de vie', 'soins de confort', 'accompagnement fin de vie'],
    synonymsEn: ['palliative care', 'end of life', 'comfort care'],
  },
  'soins terminaux': {
    mesh: '"Terminal Care"[MeSH]',
    category: 'palliative',
    synonymsFr: ['phase terminale', 'mourant'],
    synonymsEn: ['terminal care', 'dying patient'],
  },
  'directives anticipées': {
    mesh: '"Advance Directives"[MeSH]',
    category: 'palliative',
    synonymsFr: ['testament vie', 'niveau de soins'],
    synonymsEn: ['advance directives', 'living will', 'DNR'],
  },

  // === ÉDUCATION PATIENT / PATIENT EDUCATION ===
  'éducation patient': {
    mesh: '"Patient Education as Topic"[MeSH]',
    cinahl: 'Patient Education',
    category: 'education',
    synonymsFr: ['enseignement patient', 'information patient'],
    synonymsEn: ['patient education', 'patient teaching', 'health education'],
  },
  'autogestion': {
    mesh: '"Self-Management"[MeSH]',
    category: 'education',
    synonymsFr: ['autosoins', 'gestion maladie'],
    synonymsEn: ['self-management', 'self-care'],
  },
  'littératie santé': {
    mesh: '"Health Literacy"[MeSH]',
    category: 'education',
    synonymsFr: ['compréhension santé'],
    synonymsEn: ['health literacy'],
  },

  // === ONCOLOGIE / ONCOLOGY ===
  'chimiothérapie': {
    mesh: '"Drug Therapy"[MeSH]',
    cinahl: 'Chemotherapy, Cancer',
    category: 'oncology',
    synonymsFr: ['chimio', 'traitement cancer'],
    synonymsEn: ['chemotherapy', 'cancer treatment'],
  },
  'soins oncologiques': {
    mesh: '"Oncology Nursing"[MeSH]',
    category: 'oncology',
    synonymsFr: ['cancer', 'tumeur'],
    synonymsEn: ['oncology nursing', 'cancer care'],
  },
  'mucite': {
    mesh: '"Mucositis"[MeSH]',
    category: 'oncology',
    synonymsFr: ['stomatite', 'lésions buccales'],
    synonymsEn: ['mucositis', 'oral mucositis'],
  },

  // === PÉRINATALITÉ / MATERNAL ===
  'allaitement': {
    mesh: '"Breast Feeding"[MeSH]',
    category: 'maternal',
    synonymsFr: ['allaitement maternel', 'lactation'],
    synonymsEn: ['breastfeeding', 'lactation'],
  },
  'postpartum': {
    mesh: '"Postpartum Period"[MeSH]',
    category: 'maternal',
    synonymsFr: ['post-accouchement', 'période postnatale'],
    synonymsEn: ['postpartum', 'postnatal'],
  },
  'nouveau-né': {
    mesh: '"Infant, Newborn"[MeSH]',
    category: 'maternal',
    synonymsFr: ['néonatal', 'bébé'],
    synonymsEn: ['newborn', 'neonate'],
  },

  // === GÉNÉRAL / GENERAL ===
  'pratique infirmière': {
    mesh: '"Nursing"[MeSH]',
    category: 'general',
    synonymsFr: ['soins infirmiers', 'profession infirmière'],
    synonymsEn: ['nursing practice', 'nursing care'],
  },
  'qualité des soins': {
    mesh: '"Quality of Health Care"[MeSH]',
    category: 'general',
    synonymsFr: ['amélioration qualité', 'indicateurs qualité'],
    synonymsEn: ['quality of care', 'quality improvement'],
  },
  'communication': {
    mesh: '"Communication"[MeSH]',
    category: 'general',
    synonymsFr: ['relation thérapeutique', 'communication patient'],
    synonymsEn: ['communication', 'therapeutic relationship'],
  },
  'documentation': {
    mesh: '"Documentation"[MeSH]',
    category: 'general',
    synonymsFr: ['notes infirmières', 'dossier patient'],
    synonymsEn: ['documentation', 'nursing notes', 'charting'],
  },
  'relève': {
    mesh: '"Patient Handoff"[MeSH]',
    category: 'general',
    synonymsFr: ['rapport', 'transfert information', 'handover'],
    synonymsEn: ['handoff', 'shift report', 'handover'],
  },
};

/**
 * Category labels for UI display
 */
export const CATEGORY_LABELS: Record<NursingCategory, { fr: string; en: string }> = {
  wound: { fr: 'Soins des plaies', en: 'Wound Care' },
  chronic: { fr: 'Maladies chroniques', en: 'Chronic Conditions' },
  safety: { fr: 'Sécurité du patient', en: 'Patient Safety' },
  infection: { fr: 'Prévention des infections', en: 'Infection Control' },
  mental: { fr: 'Santé mentale', en: 'Mental Health' },
  pediatric: { fr: 'Pédiatrie', en: 'Pediatrics' },
  geriatric: { fr: 'Gériatrie', en: 'Geriatrics' },
  critical: { fr: 'Soins critiques', en: 'Critical Care' },
  palliative: { fr: 'Soins palliatifs', en: 'Palliative Care' },
  assessment: { fr: 'Évaluation', en: 'Assessment' },
  education: { fr: 'Éducation patient', en: 'Patient Education' },
  medication: { fr: 'Médication', en: 'Medication' },
  nutrition: { fr: 'Nutrition', en: 'Nutrition' },
  mobility: { fr: 'Mobilité', en: 'Mobility' },
  cardiovascular: { fr: 'Cardiovasculaire', en: 'Cardiovascular' },
  respiratory: { fr: 'Respiratoire', en: 'Respiratory' },
  oncology: { fr: 'Oncologie', en: 'Oncology' },
  maternal: { fr: 'Périnatalité', en: 'Maternal/Newborn' },
  pain: { fr: 'Douleur', en: 'Pain' },
  general: { fr: 'Général', en: 'General' },
};

/**
 * Find MeSH terms matching user input
 * Returns all matching terms with their MeSH equivalents
 */
export function findMatchingMeshTerms(input: string): Array<{ term: string; mesh: string; category: NursingCategory }> {
  const lowerInput = input.toLowerCase().trim();
  const matches: Array<{ term: string; mesh: string; category: NursingCategory; score: number }> = [];
  
  for (const [key, value] of Object.entries(NURSING_THESAURUS)) {
    // Check main key
    if (key.toLowerCase().includes(lowerInput) || lowerInput.includes(key.toLowerCase())) {
      matches.push({ term: key, mesh: value.mesh, category: value.category, score: 100 });
      continue;
    }
    
    // Check French synonyms
    for (const syn of value.synonymsFr) {
      if (syn.toLowerCase().includes(lowerInput) || lowerInput.includes(syn.toLowerCase())) {
        matches.push({ term: key, mesh: value.mesh, category: value.category, score: 80 });
        break;
      }
    }
    
    // Check English synonyms
    for (const syn of value.synonymsEn) {
      if (syn.toLowerCase().includes(lowerInput) || lowerInput.includes(syn.toLowerCase())) {
        matches.push({ term: key, mesh: value.mesh, category: value.category, score: 80 });
        break;
      }
    }
  }
  
  // Remove duplicates and sort by score
  const uniqueMatches = matches.reduce((acc, curr) => {
    if (!acc.find(m => m.term === curr.term)) {
      acc.push(curr);
    }
    return acc;
  }, [] as typeof matches);
  
  return uniqueMatches
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ term, mesh, category }) => ({ term, mesh, category }));
}

/**
 * Build a structured boolean query from keywords and MeSH terms
 */
export function buildMeshQuery(
  keywords: string[],
  operator: 'AND' | 'OR' = 'AND'
): { query: string; meshTerms: string[]; unmatchedKeywords: string[] } {
  const meshTerms: string[] = [];
  const unmatchedKeywords: string[] = [];
  
  for (const keyword of keywords) {
    const matches = findMatchingMeshTerms(keyword);
    if (matches.length > 0) {
      meshTerms.push(matches[0].mesh);
    } else {
      unmatchedKeywords.push(keyword);
    }
  }
  
  // Build query: MeSH terms joined with operator, plus unmatched as free text
  const parts: string[] = [...meshTerms];
  
  if (unmatchedKeywords.length > 0) {
    parts.push(...unmatchedKeywords.map(k => `"${k}"`));
  }
  
  const query = parts.join(` ${operator} `);
  
  return { query, meshTerms, unmatchedKeywords };
}

/**
 * Get all terms in a specific category
 */
export function getTermsByCategory(category: NursingCategory): Array<{ term: string; mesh: string }> {
  return Object.entries(NURSING_THESAURUS)
    .filter(([, value]) => value.category === category)
    .map(([key, value]) => ({ term: key, mesh: value.mesh }));
}

/**
 * Get suggested keywords for autocomplete
 */
export function getSuggestions(input: string, limit = 10): string[] {
  if (!input || input.length < 2) return [];
  
  const lowerInput = input.toLowerCase();
  const suggestions = new Set<string>();
  
  for (const [key, value] of Object.entries(NURSING_THESAURUS)) {
    // Main term
    if (key.toLowerCase().startsWith(lowerInput)) {
      suggestions.add(key);
    }
    
    // French synonyms
    for (const syn of value.synonymsFr) {
      if (syn.toLowerCase().startsWith(lowerInput)) {
        suggestions.add(syn);
      }
    }
    
    // English synonyms
    for (const syn of value.synonymsEn) {
      if (syn.toLowerCase().startsWith(lowerInput)) {
        suggestions.add(syn);
      }
    }
    
    if (suggestions.size >= limit) break;
  }
  
  return Array.from(suggestions).slice(0, limit);
}
