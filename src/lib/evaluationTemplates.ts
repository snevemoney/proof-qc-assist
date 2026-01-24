export interface EvaluationCriterion {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  weight: number;
  isRequired: boolean;
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  criteria: EvaluationCriterion[];
}

export const evaluationTemplates: EvaluationTemplate[] = [
  {
    id: 'nursing-care-plan',
    name: 'Nursing Care Plan',
    nameFr: 'Plan de soins infirmiers',
    description: 'Standard evaluation grid for nursing care plans',
    descriptionFr: 'Grille d\'évaluation standard pour les plans de soins infirmiers',
    criteria: [
      {
        id: 'patient-assessment',
        name: 'Patient Assessment',
        nameFr: 'Évaluation du patient',
        description: 'Comprehensive data collection, accurate identification of patient needs',
        descriptionFr: 'Collecte de données complète, identification précise des besoins du patient',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'nursing-diagnoses',
        name: 'Nursing Diagnoses',
        nameFr: 'Diagnostics infirmiers',
        description: 'NANDA-I format, priority ranking, relationship to assessment data',
        descriptionFr: 'Format NANDA-I, classement prioritaire, lien avec les données d\'évaluation',
        weight: 20,
        isRequired: true,
      },
      {
        id: 'interventions',
        name: 'Interventions',
        nameFr: 'Interventions',
        description: 'Evidence-based, patient-specific, includes rationales',
        descriptionFr: 'Fondées sur des données probantes, spécifiques au patient, avec justifications',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'rationales',
        name: 'Scientific Rationales',
        nameFr: 'Justifications scientifiques',
        description: 'Each intervention supported by cited evidence from reliable sources',
        descriptionFr: 'Chaque intervention appuyée par des données probantes citées de sources fiables',
        weight: 20,
        isRequired: true,
      },
      {
        id: 'expected-outcomes',
        name: 'Expected Outcomes',
        nameFr: 'Résultats attendus',
        description: 'SMART goals, measurable criteria, realistic timeframes',
        descriptionFr: 'Objectifs SMART, critères mesurables, délais réalistes',
        weight: 10,
        isRequired: false,
      },
    ],
  },
  {
    id: 'literature-review',
    name: 'Literature Review',
    nameFr: 'Revue de littérature',
    description: 'Evaluation grid for academic literature reviews',
    descriptionFr: 'Grille d\'évaluation pour les revues de littérature académiques',
    criteria: [
      {
        id: 'source-quality',
        name: 'Source Quality',
        nameFr: 'Qualité des sources',
        description: 'Peer-reviewed journals, recent publications, appropriate evidence levels',
        descriptionFr: 'Revues avec comité de lecture, publications récentes, niveaux de preuve appropriés',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'synthesis',
        name: 'Synthesis & Integration',
        nameFr: 'Synthèse et intégration',
        description: 'Themes identified, sources compared and contrasted, coherent narrative',
        descriptionFr: 'Thèmes identifiés, sources comparées et contrastées, récit cohérent',
        weight: 30,
        isRequired: true,
      },
      {
        id: 'critical-analysis',
        name: 'Critical Analysis',
        nameFr: 'Analyse critique',
        description: 'Strengths and limitations discussed, gaps identified, clinical implications',
        descriptionFr: 'Forces et limites discutées, lacunes identifiées, implications cliniques',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'citations',
        name: 'Citations & Formatting',
        nameFr: 'Citations et mise en forme',
        description: 'Proper citation style, consistent formatting, no plagiarism',
        descriptionFr: 'Style de citation approprié, mise en forme cohérente, pas de plagiat',
        weight: 20,
        isRequired: true,
      },
    ],
  },
  {
    id: 'research-paper',
    name: 'Research Paper',
    nameFr: 'Travail de recherche',
    description: 'Standard evaluation grid for academic research papers',
    descriptionFr: 'Grille d\'évaluation standard pour les travaux de recherche académiques',
    criteria: [
      {
        id: 'thesis',
        name: 'Thesis & Argument',
        nameFr: 'Thèse et argumentation',
        description: 'Clear thesis statement, logical argument structure, focused content',
        descriptionFr: 'Énoncé de thèse clair, structure argumentative logique, contenu ciblé',
        weight: 20,
        isRequired: true,
      },
      {
        id: 'evidence',
        name: 'Evidence & Support',
        nameFr: 'Preuves et appui',
        description: 'Strong evidence from reliable sources, appropriate use of data',
        descriptionFr: 'Preuves solides de sources fiables, utilisation appropriée des données',
        weight: 30,
        isRequired: true,
      },
      {
        id: 'analysis',
        name: 'Analysis & Discussion',
        nameFr: 'Analyse et discussion',
        description: 'Deep analysis, consideration of alternatives, clinical relevance',
        descriptionFr: 'Analyse approfondie, considération des alternatives, pertinence clinique',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'structure',
        name: 'Structure & Flow',
        nameFr: 'Structure et fluidité',
        description: 'Logical organization, clear transitions, professional presentation',
        descriptionFr: 'Organisation logique, transitions claires, présentation professionnelle',
        weight: 15,
        isRequired: false,
      },
      {
        id: 'references',
        name: 'References',
        nameFr: 'Références',
        description: 'Proper citation format, adequate number of sources, recent publications',
        descriptionFr: 'Format de citation approprié, nombre suffisant de sources, publications récentes',
        weight: 10,
        isRequired: true,
      },
    ],
  },
  {
    id: 'case-study',
    name: 'Clinical Case Study',
    nameFr: 'Étude de cas clinique',
    description: 'Evaluation grid for nursing clinical case studies',
    descriptionFr: 'Grille d\'évaluation pour les études de cas cliniques en soins infirmiers',
    criteria: [
      {
        id: 'case-presentation',
        name: 'Case Presentation',
        nameFr: 'Présentation du cas',
        description: 'Complete patient history, relevant data, clear clinical picture',
        descriptionFr: 'Historique complet du patient, données pertinentes, tableau clinique clair',
        weight: 20,
        isRequired: true,
      },
      {
        id: 'pathophysiology',
        name: 'Pathophysiology',
        nameFr: 'Physiopathologie',
        description: 'Accurate explanation of disease process, relationship to symptoms',
        descriptionFr: 'Explication précise du processus pathologique, lien avec les symptômes',
        weight: 20,
        isRequired: true,
      },
      {
        id: 'nursing-process',
        name: 'Nursing Process',
        nameFr: 'Démarche de soins',
        description: 'Assessment, diagnosis, planning, implementation, evaluation',
        descriptionFr: 'Évaluation, diagnostic, planification, mise en œuvre, évaluation',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'evidence-application',
        name: 'Evidence Application',
        nameFr: 'Application des preuves',
        description: 'Current best practices cited, evidence-based recommendations',
        descriptionFr: 'Meilleures pratiques actuelles citées, recommandations fondées sur des preuves',
        weight: 25,
        isRequired: true,
      },
      {
        id: 'reflection',
        name: 'Professional Reflection',
        nameFr: 'Réflexion professionnelle',
        description: 'Learning outcomes, areas for improvement, future practice implications',
        descriptionFr: 'Résultats d\'apprentissage, domaines à améliorer, implications pour la pratique future',
        weight: 10,
        isRequired: false,
      },
    ],
  },
];

export function getTemplateById(id: string): EvaluationTemplate | undefined {
  return evaluationTemplates.find(t => t.id === id);
}

export function createEmptyGrid(): EvaluationCriterion[] {
  return [];
}

export function generateCriterionId(): string {
  return `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateWeights(criteria: EvaluationCriterion[]): {
  isValid: boolean;
  total: number;
  message?: string;
} {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0 && criteria.length === 0) {
    return { isValid: true, total: 0 };
  }
  if (total !== 100) {
    return {
      isValid: false,
      total,
      message: total < 100 ? 'Weights sum to less than 100%' : 'Weights sum to more than 100%',
    };
  }
  return { isValid: true, total: 100 };
}
