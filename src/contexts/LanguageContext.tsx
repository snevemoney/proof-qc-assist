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
