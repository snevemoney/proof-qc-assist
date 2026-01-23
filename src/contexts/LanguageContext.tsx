import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.howItWorks': 'How It Works',
    'nav.about': 'About',
    'nav.getStarted': 'Get Started',
    'nav.signIn': 'Sign In',
    
    // Hero
    'hero.badge': 'For Quebec University Students',
    'hero.title': 'Verify Your Academic Work',
    'hero.titleHighlight': 'With Confidence',
    'hero.subtitle': 'Upload your sources and draft — we verify every claim against your provided articles. No guessing, no fabrication, just evidence-based feedback.',
    'hero.cta': 'Start Verifying',
    'hero.ctaSecondary': 'See How It Works',
    'hero.disclaimer': 'ProofCheck QC helps you verify and improve — it never writes for you.',
    
    // Features
    'features.title': 'Built for Academic Excellence',
    'features.subtitle': 'Every feature designed to help Quebec students succeed while maintaining academic integrity.',
    'features.source.title': 'Source-Based Verification',
    'features.source.description': 'Claims are verified exclusively against your uploaded articles — never from external sources or AI guessing.',
    'features.claims.title': 'Claim-by-Claim Analysis',
    'features.claims.description': 'Each sentence is evaluated with clear status indicators: Supported, Partially Supported, Not Supported, or Contradicted.',
    'features.citation.title': 'Citation Matching',
    'features.citation.description': 'Detects citation mismatches, missing references, and suggests the correct source for each claim.',
    'features.apa.title': 'APA 7 Formatting',
    'features.apa.description': 'Auto-generates properly formatted reference lists from your uploaded sources, ready to use.',
    'features.bilingual.title': 'Fully Bilingual',
    'features.bilingual.description': 'Complete French and English support designed specifically for Quebec\'s academic environment.',
    'features.export.title': 'Export Options',
    'features.export.description': 'Download reports as PDF, copy as Markdown, or use feedback format for Word comments.',
    
    // How It Works
    'howItWorks.title': 'How It Works',
    'howItWorks.subtitle': 'Three simple steps to verify your academic work.',
    'howItWorks.step1.title': 'Upload Your Sources',
    'howItWorks.step1.description': 'Add the articles, PDFs, and documents you used for your assignment. Each becomes a searchable source card.',
    'howItWorks.step2.title': 'Submit Your Draft',
    'howItWorks.step2.description': 'Paste or upload your assignment text. The AI will analyze every claim you make.',
    'howItWorks.step3.title': 'Review Your Report',
    'howItWorks.step3.description': 'Get a detailed verification report with inline highlighting, evidence quotes, and improvement suggestions.',
    
    // Stats
    'stats.claims': 'Claims Verified',
    'stats.students': 'Quebec Students',
    'stats.accuracy': 'Accuracy Rate',
    'stats.universities': 'Universities',
    
    // CTA
    'cta.title': 'Ready to Strengthen Your Academic Work?',
    'cta.subtitle': 'Join Quebec students who verify their sources with confidence.',
    'cta.button': 'Create Free Account',
    
    // Footer
    'footer.description': 'Helping Quebec university students verify their academic work with integrity.',
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.contact': 'Contact',
    'footer.about': 'About Us',
    'footer.rights': 'All rights reserved.',
    
    // Integrity Banner
    'integrity.title': 'Quebec Academic Integrity',
    'integrity.description': 'This tool supports academic integrity — it verifies and critiques your work, but never writes for you.',
  },
  fr: {
    // Navigation
    'nav.features': 'Fonctionnalités',
    'nav.howItWorks': 'Comment ça marche',
    'nav.about': 'À propos',
    'nav.getStarted': 'Commencer',
    'nav.signIn': 'Connexion',
    
    // Hero
    'hero.badge': 'Pour les étudiants universitaires du Québec',
    'hero.title': 'Vérifiez votre travail académique',
    'hero.titleHighlight': 'en toute confiance',
    'hero.subtitle': 'Téléchargez vos sources et votre brouillon — nous vérifions chaque affirmation par rapport à vos articles fournis. Pas de suppositions, pas de fabrication, juste des commentaires basés sur des preuves.',
    'hero.cta': 'Commencer la vérification',
    'hero.ctaSecondary': 'Voir comment ça marche',
    'hero.disclaimer': 'ProofCheck QC vous aide à vérifier et améliorer — il n\'écrit jamais à votre place.',
    
    // Features
    'features.title': 'Conçu pour l\'excellence académique',
    'features.subtitle': 'Chaque fonctionnalité est conçue pour aider les étudiants québécois à réussir tout en maintenant l\'intégrité académique.',
    'features.source.title': 'Vérification basée sur les sources',
    'features.source.description': 'Les affirmations sont vérifiées exclusivement par rapport à vos articles téléchargés — jamais à partir de sources externes ou de suppositions de l\'IA.',
    'features.claims.title': 'Analyse affirmation par affirmation',
    'features.claims.description': 'Chaque phrase est évaluée avec des indicateurs clairs : Soutenu, Partiellement soutenu, Non soutenu ou Contredit.',
    'features.citation.title': 'Correspondance des citations',
    'features.citation.description': 'Détecte les incohérences de citation, les références manquantes et suggère la bonne source pour chaque affirmation.',
    'features.apa.title': 'Format APA 7',
    'features.apa.description': 'Génère automatiquement des listes de références correctement formatées à partir de vos sources téléchargées.',
    'features.bilingual.title': 'Entièrement bilingue',
    'features.bilingual.description': 'Support complet en français et en anglais, conçu spécifiquement pour l\'environnement académique québécois.',
    'features.export.title': 'Options d\'exportation',
    'features.export.description': 'Téléchargez les rapports en PDF, copiez en Markdown ou utilisez le format de commentaires pour Word.',
    
    // How It Works
    'howItWorks.title': 'Comment ça marche',
    'howItWorks.subtitle': 'Trois étapes simples pour vérifier votre travail académique.',
    'howItWorks.step1.title': 'Téléchargez vos sources',
    'howItWorks.step1.description': 'Ajoutez les articles, PDF et documents utilisés pour votre travail. Chacun devient une fiche source consultable.',
    'howItWorks.step2.title': 'Soumettez votre brouillon',
    'howItWorks.step2.description': 'Collez ou téléchargez votre texte. L\'IA analysera chaque affirmation que vous faites.',
    'howItWorks.step3.title': 'Consultez votre rapport',
    'howItWorks.step3.description': 'Obtenez un rapport de vérification détaillé avec surlignage, citations de preuves et suggestions d\'amélioration.',
    
    // Stats
    'stats.claims': 'Affirmations vérifiées',
    'stats.students': 'Étudiants québécois',
    'stats.accuracy': 'Taux de précision',
    'stats.universities': 'Universités',
    
    // CTA
    'cta.title': 'Prêt à renforcer votre travail académique?',
    'cta.subtitle': 'Rejoignez les étudiants québécois qui vérifient leurs sources en toute confiance.',
    'cta.button': 'Créer un compte gratuit',
    
    // Footer
    'footer.description': 'Aider les étudiants universitaires du Québec à vérifier leur travail académique avec intégrité.',
    'footer.product': 'Produit',
    'footer.company': 'Entreprise',
    'footer.legal': 'Légal',
    'footer.privacy': 'Politique de confidentialité',
    'footer.terms': 'Conditions d\'utilisation',
    'footer.contact': 'Contact',
    'footer.about': 'À propos de nous',
    'footer.rights': 'Tous droits réservés.',
    
    // Integrity Banner
    'integrity.title': 'Intégrité académique du Québec',
    'integrity.description': 'Cet outil soutient l\'intégrité académique — il vérifie et critique votre travail, mais n\'écrit jamais à votre place.',
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
