import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Tabs
    'tabs.sources': 'Sources',
    'tabs.draft': 'Draft',
    'tabs.report': 'Report',
    
    // Upload
    'upload.dragDrop': 'Drag and drop files here',
    'upload.orBrowse': 'or click to browse',
    
    // Sources
    'sources.empty.title': 'No sources yet',
    'sources.empty.description': 'Upload the articles, PDFs, and documents you used for your assignment. Each will become a searchable source.',
    'source.extracting': 'Extracting metadata...',
    'source.processingText': 'Processing document text...',
    
    // Draft
    'draft.placeholder': 'Paste your assignment text here...\n\nExample:\nClimate change has significantly impacted Arctic ecosystems (Smith & Johnson, 2023). Research shows that polar bear populations have declined by 40% since 2000.',
    'draft.uploadFile': 'Upload file',
    'draft.words': 'words',
    'draft.characters': 'chars',
    'draft.strictMode': 'Strict Mode',
    'draft.strictModeTooltip': 'In Strict Mode, claims without explicit citations will be flagged as unsupported, even if evidence exists in your sources.',
    'draft.verifyNow': 'Verify Now',
    'draft.verifying': 'Verifying...',
    'draft.needSources': 'Add sources first',
    'draft.needText': 'Add your draft text',
    'draft.savedDrafts': 'Saved Drafts',
    'draft.saveCurrent': 'Save Draft',
    'draft.loadDraft': 'Load',
    'draft.deleteDraft': 'Delete',
    'draft.noSavedDrafts': 'No saved drafts yet',
    'draft.draftNamePlaceholder': 'Enter a name for your draft...',
    'draft.confirmLoad': 'Replace current draft?',
    'draft.confirmLoadDescription': 'This will replace your current draft with the saved one.',
    'draft.confirmDelete': 'Delete this draft?',
    'draft.confirmDeleteDescription': 'This action cannot be undone.',
    'draft.draftSaved': 'Draft saved',
    'draft.draftLoaded': 'Draft loaded',
    'draft.draftDeleted': 'Draft deleted',
    'draft.retry': 'Retry',
    'draft.retrying': 'Retrying...',
    
    // Report
    'report.empty.title': 'No verification yet',
    'report.empty.description': 'Add your sources and draft, then click "Verify Now" to analyze your claims.',
    'report.checklist.sources': 'Sources uploaded',
    'report.checklist.draft': 'Draft added',
    'report.supported': 'Supported',
    'report.partial': 'Partial',
    'report.unsupported': 'Not Found',
    'report.contradicted': 'Contradicted',
    'report.exportPdf': 'Export PDF',
    'report.copyMarkdown': 'Copy Markdown',
    'report.claimAnalysis': 'Claim-by-Claim Analysis',
    'report.noClaims': 'No claims identified.',
    'report.evidence': 'Evidence',
    'report.suggestion': 'Suggestion',
    'report.askAboutClaim': 'Ask AI',
    'report.findArticles': 'Find articles',
    
    // Chat
    'chat.title': 'ProofCheck Assistant',
    'chat.placeholder': 'Ask a question...',
    'chat.clear': 'Clear conversation',
    'chat.researchMode': 'Research mode',
    'chat.webSearchEnabled': 'Web search enabled',
    'chat.howCanIHelp': 'How can I help you?',
    'chat.contextInfo': 'I know your sources, draft, and verification results. Ask me anything!',
    'chat.quickActions': 'Quick actions',
    'chat.explainResults': 'Explain my results',
    'chat.findEvidence': 'Find more evidence',
    'chat.citationHelp': 'Citation help',
    'chat.improveWriting': 'Improve my writing',
    'chat.edited': 'Edited',
    'chat.justNow': 'just now',
    'chat.viewingVersion': 'Version {n} of {total}',
    
    // Readiness
    'readiness.title': 'Submission Readiness',
    'readiness.ready': 'Ready to submit!',
    'readiness.almostReady': 'Almost there - minor fixes needed',
    'readiness.goodProgress': 'Good progress - some items need attention',
    'readiness.needsWork': 'Needs work - several items need attention',
    
    // Interventions
    'intervention.title': 'Nursing Interventions',
    'intervention.evidenceBased': 'Evidence-based',
    'intervention.rationaleProvided': 'Rationale provided',
    'intervention.missingEvidence': 'Missing evidence',
    'intervention.missingRationale': 'Missing rationale',
    'intervention.addRationale': 'Add rationale',
    'intervention.findEvidence': 'Find evidence',
    'intervention.noInterventions': 'No nursing interventions identified',
    'intervention.critical': 'Critical',
    'intervention.standard': 'Standard',
    'intervention.optional': 'Optional',
    'intervention.criticalDesc': 'Requires strongest evidence',
    'intervention.standardDesc': 'Standard care practice',
    'intervention.optionalDesc': 'Supportive measure',
    
    // Requirements
    'tabs.requirements': 'Requirements',
    'requirements.instructions': 'Teacher Instructions',
    'requirements.instructionsDesc': 'Paste or type your assignment-specific instructions. The AI will verify your draft against these requirements.',
    'requirements.instructionsPlaceholder': 'Ex: The care plan must include at least 3 priority nursing diagnoses, each with evidence-based interventions...',
    'requirements.evaluationGrid': 'Evaluation Grid',
    'requirements.evaluationGridDesc': 'Define your teacher\'s evaluation criteria. The AI will estimate your score for each criterion.',
    'requirements.selectTemplate': 'Start with a template',
    'requirements.selectTemplatePlaceholder': 'Select a template...',
    'requirements.customGrid': '✏️ Custom grid',
    'requirements.weightDistribution': 'Weight Distribution',
    'requirements.weightsMustTotal': 'Weights must total 100%',
    'requirements.newCriterion': 'New criterion',
    'requirements.required': 'Required',
    'requirements.requiredToPass': 'Required to pass',
    'requirements.addCriterion': 'Add criterion',
    'requirements.noCriteria': 'No criteria defined',
    'requirements.noCriteriaDesc': 'Select a template or add criteria manually',
    'requirements.requiredCriteria': 'required criteria',
    'requirements.totalCriteria': 'total criteria',
    'requirements.tip': 'Tip: Be specific about minimum requirements (number of sources, format, etc.)',
    'requirements.nameEN': 'Name (EN)',
    'requirements.nameFR': 'Name (FR)',
    'requirements.descEN': 'Description (EN)',
    'requirements.descFR': 'Description (FR)',
    'requirements.weight': 'Weight (%)',
    'requirements.delete': 'Delete',
    
    // Requirement checks in report
    'report.requirementsCompliance': 'Requirements Compliance',
    'report.rubricPreview': 'Rubric Preview',
    'report.requirementMet': 'Met',
    'report.requirementPartial': 'Partial',
    'report.requirementNotMet': 'Not Met',
    'report.requirementUnable': 'Unable to verify',
    'report.noRequirements': 'No requirements configured',
    'report.estimatedScore': 'Estimated Score',
    'report.improvements': 'Suggested Improvements',
  },
  fr: {
    // Tabs
    'tabs.sources': 'Sources',
    'tabs.draft': 'Brouillon',
    'tabs.report': 'Rapport',
    
    // Upload
    'upload.dragDrop': 'Glissez-déposez vos fichiers ici',
    'upload.orBrowse': 'ou cliquez pour parcourir',
    
    // Sources
    'sources.empty.title': 'Aucune source',
    'sources.empty.description': 'Téléchargez les articles, PDF et documents utilisés pour votre travail. Chacun deviendra une source consultable.',
    'source.extracting': 'Extraction des métadonnées...',
    'source.processingText': 'Traitement du texte...',
    
    // Draft
    'draft.placeholder': 'Collez le texte de votre travail ici...\n\nExemple:\nLe changement climatique a significativement impacté les écosystèmes arctiques (Smith & Johnson, 2023). Les recherches montrent que les populations d\'ours polaires ont diminué de 40% depuis 2000.',
    'draft.uploadFile': 'Télécharger un fichier',
    'draft.words': 'mots',
    'draft.characters': 'caractères',
    'draft.strictMode': 'Mode strict',
    'draft.strictModeTooltip': 'En mode strict, les affirmations sans citations explicites seront signalées comme non soutenues, même si des preuves existent dans vos sources.',
    'draft.verifyNow': 'Vérifier maintenant',
    'draft.verifying': 'Vérification...',
    'draft.needSources': 'Ajoutez d\'abord des sources',
    'draft.needText': 'Ajoutez votre texte',
    'draft.savedDrafts': 'Brouillons sauvegardés',
    'draft.saveCurrent': 'Sauvegarder',
    'draft.loadDraft': 'Charger',
    'draft.deleteDraft': 'Supprimer',
    'draft.noSavedDrafts': 'Aucun brouillon sauvegardé',
    'draft.draftNamePlaceholder': 'Entrez un nom pour votre brouillon...',
    'draft.confirmLoad': 'Remplacer le brouillon actuel?',
    'draft.confirmLoadDescription': 'Cela remplacera votre brouillon actuel par celui sauvegardé.',
    'draft.confirmDelete': 'Supprimer ce brouillon?',
    'draft.confirmDeleteDescription': 'Cette action est irréversible.',
    'draft.draftSaved': 'Brouillon sauvegardé',
    'draft.draftLoaded': 'Brouillon chargé',
    'draft.draftDeleted': 'Brouillon supprimé',
    'draft.retry': 'Réessayer',
    'draft.retrying': 'Nouvelle tentative...',
    
    // Report
    'report.empty.title': 'Aucune vérification',
    'report.empty.description': 'Ajoutez vos sources et votre brouillon, puis cliquez sur "Vérifier maintenant" pour analyser vos affirmations.',
    'report.checklist.sources': 'Sources téléchargées',
    'report.checklist.draft': 'Brouillon ajouté',
    'report.supported': 'Soutenu',
    'report.partial': 'Partiel',
    'report.unsupported': 'Non trouvé',
    'report.contradicted': 'Contredit',
    'report.exportPdf': 'Exporter PDF',
    'report.copyMarkdown': 'Copier Markdown',
    'report.claimAnalysis': 'Analyse affirmation par affirmation',
    'report.noClaims': 'Aucune affirmation identifiée.',
    'report.evidence': 'Preuve',
    'report.suggestion': 'Suggestion',
    'report.askAboutClaim': 'Demander à l\'IA',
    'report.findArticles': 'Trouver des articles',
    
    // Chat
    'chat.title': 'Assistant ProofCheck',
    'chat.placeholder': 'Posez une question...',
    'chat.clear': 'Effacer la conversation',
    'chat.researchMode': 'Mode recherche',
    'chat.webSearchEnabled': 'Recherche web activée',
    'chat.howCanIHelp': 'Comment puis-je vous aider?',
    'chat.contextInfo': 'Je connais vos sources, votre brouillon et vos résultats de vérification. Posez-moi des questions!',
    'chat.quickActions': 'Actions rapides',
    'chat.explainResults': 'Expliquer mes résultats',
    'chat.findEvidence': 'Trouver plus de preuves',
    'chat.citationHelp': 'Aide aux citations',
    'chat.improveWriting': 'Améliorer mon écriture',
    'chat.edited': 'Modifié',
    'chat.justNow': 'à l\'instant',
    'chat.viewingVersion': 'Version {n} sur {total}',
    
    // Readiness
    'readiness.title': 'Prêt à soumettre',
    'readiness.ready': 'Prêt à soumettre!',
    'readiness.almostReady': 'Presque prêt - corrections mineures',
    'readiness.goodProgress': 'Bon progrès - certains éléments à revoir',
    'readiness.needsWork': 'À améliorer - plusieurs éléments à revoir',
    
    // Interventions
    'intervention.title': 'Interventions infirmières',
    'intervention.evidenceBased': 'Fondé sur des preuves',
    'intervention.rationaleProvided': 'Justification fournie',
    'intervention.missingEvidence': 'Preuves manquantes',
    'intervention.missingRationale': 'Justification manquante',
    'intervention.addRationale': 'Ajouter une justification',
    'intervention.findEvidence': 'Trouver des preuves',
    'intervention.noInterventions': 'Aucune intervention infirmière identifiée',
    'intervention.critical': 'Critique',
    'intervention.standard': 'Standard',
    'intervention.optional': 'Optionnel',
    'intervention.criticalDesc': 'Nécessite les preuves les plus solides',
    'intervention.standardDesc': 'Pratique de soins standard',
    'intervention.optionalDesc': 'Mesure de soutien',
    
    // Requirements
    'tabs.requirements': 'Exigences',
    'requirements.instructions': 'Consignes du professeur',
    'requirements.instructionsDesc': 'Collez ou tapez les consignes spécifiques de votre travail. L\'IA vérifiera votre brouillon par rapport à ces exigences.',
    'requirements.instructionsPlaceholder': 'Ex: Le plan de soins doit inclure au moins 3 diagnostics infirmiers prioritaires, chacun avec des interventions fondées sur des données probantes...',
    'requirements.evaluationGrid': 'Grille d\'évaluation',
    'requirements.evaluationGridDesc': 'Définissez les critères d\'évaluation de votre professeur. L\'IA estimera votre score pour chaque critère.',
    'requirements.selectTemplate': 'Commencer avec un modèle',
    'requirements.selectTemplatePlaceholder': 'Sélectionner un modèle...',
    'requirements.customGrid': '✏️ Grille personnalisée',
    'requirements.weightDistribution': 'Répartition des pondérations',
    'requirements.weightsMustTotal': 'Les pondérations doivent totaliser 100%',
    'requirements.newCriterion': 'Nouveau critère',
    'requirements.required': 'Requis',
    'requirements.requiredToPass': 'Obligatoire pour réussir',
    'requirements.addCriterion': 'Ajouter un critère',
    'requirements.noCriteria': 'Aucun critère défini',
    'requirements.noCriteriaDesc': 'Sélectionnez un modèle ou ajoutez des critères manuellement',
    'requirements.requiredCriteria': 'critères obligatoires',
    'requirements.totalCriteria': 'critères au total',
    'requirements.tip': 'Conseil: Soyez précis sur les exigences minimales (nombre de sources, format, etc.)',
    'requirements.nameEN': 'Nom (EN)',
    'requirements.nameFR': 'Nom (FR)',
    'requirements.descEN': 'Description (EN)',
    'requirements.descFR': 'Description (FR)',
    'requirements.weight': 'Poids (%)',
    'requirements.delete': 'Supprimer',
    
    // Requirement checks in report
    'report.requirementsCompliance': 'Conformité aux exigences',
    'report.rubricPreview': 'Aperçu de la grille',
    'report.requirementMet': 'Respecté',
    'report.requirementPartial': 'Partiel',
    'report.requirementNotMet': 'Non respecté',
    'report.requirementUnable': 'Impossible à vérifier',
    'report.noRequirements': 'Aucune exigence configurée',
    'report.estimatedScore': 'Score estimé',
    'report.improvements': 'Améliorations suggérées',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('proofcheck-language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('proofcheck-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
