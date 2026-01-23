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
