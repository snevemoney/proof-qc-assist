// 28 study types with French translations
export const STUDY_TYPES: Record<string, string> = {
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

export function getStudyTypeFr(studyType: string | undefined): string | undefined {
  if (!studyType) return undefined;
  
  const lowerType = studyType.toLowerCase();
  
  // Direct match
  if (STUDY_TYPES[lowerType]) {
    return STUDY_TYPES[lowerType];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(STUDY_TYPES)) {
    if (lowerType.includes(key) || key.includes(lowerType)) {
      return value;
    }
  }
  
  return studyType; // Return original if no match
}

// Badge colors for study types
export function getStudyTypeBadgeColor(studyType: string | undefined): string {
  if (!studyType) return 'bg-muted text-muted-foreground';
  
  const lowerType = studyType.toLowerCase();
  
  // High evidence level (green)
  if (lowerType.includes('systematic') || lowerType.includes('meta-analysis') || lowerType.includes('méta')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  }
  
  // Medium-high evidence (blue)
  if (lowerType.includes('rct') || lowerType.includes('randomized') || lowerType.includes('ecr')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  }
  
  // Medium evidence (purple)
  if (lowerType.includes('cohort') || lowerType.includes('cohorte') || lowerType.includes('case-control') || lowerType.includes('cas-témoins')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  }
  
  // Lower evidence / qualitative (amber)
  if (lowerType.includes('qualitative') || lowerType.includes('case study') || lowerType.includes('survey')) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  }
  
  // Default (gray)
  return 'bg-muted text-muted-foreground';
}

// Evidence Pyramid Levels (I-VII) based on nursing/medical research hierarchy
export interface EvidenceLevel {
  level: number;
  label: string;
  labelFr: string;
  color: string;
}

export function getEvidenceLevel(studyType: string | undefined): EvidenceLevel {
  if (!studyType) {
    return { level: 7, label: 'Level VII', labelFr: 'Niveau VII', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
  }
  
  const lowerType = studyType.toLowerCase();
  
  // Level I: Systematic Reviews & Meta-analyses
  if (lowerType.includes('systematic review') || lowerType.includes('meta-analysis') || 
      lowerType.includes('méta') || lowerType.includes('revue systématique') ||
      lowerType.includes('umbrella review') || lowerType.includes('revue parapluie')) {
    return { 
      level: 1, 
      label: 'Level I', 
      labelFr: 'Niveau I', 
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
    };
  }
  
  // Level II: Randomized Controlled Trials
  if (lowerType.includes('randomized') || lowerType.includes('rct') || lowerType.includes('ecr') ||
      lowerType.includes('experimental study') || lowerType.includes('étude expérimentale')) {
    return { 
      level: 2, 
      label: 'Level II', 
      labelFr: 'Niveau II', 
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
    };
  }
  
  // Level III: Quasi-experimental, Cohort studies
  if (lowerType.includes('quasi-experimental') || lowerType.includes('cohort') || 
      lowerType.includes('cohorte') || lowerType.includes('prospective') ||
      lowerType.includes('longitudinal')) {
    return { 
      level: 3, 
      label: 'Level III', 
      labelFr: 'Niveau III', 
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' 
    };
  }
  
  // Level IV: Case-control, Cross-sectional
  if (lowerType.includes('case-control') || lowerType.includes('cas-témoins') ||
      lowerType.includes('cross-sectional') || lowerType.includes('transversale') ||
      lowerType.includes('retrospective') || lowerType.includes('rétrospective')) {
    return { 
      level: 4, 
      label: 'Level IV', 
      labelFr: 'Niveau IV', 
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' 
    };
  }
  
  // Level V: Systematic reviews of qualitative/descriptive
  if (lowerType.includes('scoping review') || lowerType.includes('literature review') ||
      lowerType.includes('revue exploratoire') || lowerType.includes('revue de littérature')) {
    return { 
      level: 5, 
      label: 'Level V', 
      labelFr: 'Niveau V', 
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
    };
  }
  
  // Level VI: Qualitative, Case studies, Descriptive
  if (lowerType.includes('qualitative') || lowerType.includes('case study') || 
      lowerType.includes('étude de cas') || lowerType.includes('case series') ||
      lowerType.includes('descriptive') || lowerType.includes('survey') || lowerType.includes('enquête')) {
    return { 
      level: 6, 
      label: 'Level VI', 
      labelFr: 'Niveau VI', 
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' 
    };
  }
  
  // Level VII: Expert opinion, Guidelines, Reports
  return { 
    level: 7, 
    label: 'Level VII', 
    labelFr: 'Niveau VII', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' 
  };
}
