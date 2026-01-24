import { ExternalLink, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface DatabaseLink {
  id: string;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  url: string;
  category: 'international' | 'quebec';
}

const NURSING_DATABASES: DatabaseLink[] = [
  // International Databases
  {
    id: 'pubmed-nursing',
    nameEn: 'PubMed Nursing',
    nameFr: 'PubMed Nursing',
    descriptionEn: 'Free biomedical literature with nursing subset',
    descriptionFr: 'Littérature biomédicale gratuite avec sous-ensemble infirmier',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=nursing%5Bmh%5D',
    category: 'international',
  },
  {
    id: 'cinahl',
    nameEn: 'CINAHL (via EBSCO)',
    nameFr: 'CINAHL (via EBSCO)',
    descriptionEn: 'Cumulative Index to Nursing & Allied Health',
    descriptionFr: 'Index cumulatif des soins infirmiers et sciences connexes',
    url: 'https://www.ebsco.com/products/research-databases/cinahl-database',
    category: 'international',
  },
  {
    id: 'cochrane',
    nameEn: 'Cochrane Library',
    nameFr: 'Bibliothèque Cochrane',
    descriptionEn: 'High-quality systematic reviews',
    descriptionFr: 'Revues systématiques de haute qualité',
    url: 'https://www.cochranelibrary.com/',
    category: 'international',
  },
  {
    id: 'jbi',
    nameEn: 'JBI Evidence Synthesis',
    nameFr: 'JBI Evidence Synthesis',
    descriptionEn: 'Joanna Briggs Institute evidence-based resources',
    descriptionFr: 'Ressources fondées sur les preuves de l\'Institut Joanna Briggs',
    url: 'https://jbi.global/ebp',
    category: 'international',
  },
  {
    id: 'uptodate',
    nameEn: 'UpToDate',
    nameFr: 'UpToDate',
    descriptionEn: 'Clinical decision support (institutional access)',
    descriptionFr: 'Aide à la décision clinique (accès institutionnel)',
    url: 'https://www.uptodate.com/',
    category: 'international',
  },
  // Quebec/Canadian Databases
  {
    id: 'santekom',
    nameEn: 'Santékom',
    nameFr: 'Santékom',
    descriptionEn: 'Quebec health sciences literature',
    descriptionFr: 'Littérature québécoise en sciences de la santé',
    url: 'https://www.santecom.qc.ca/',
    category: 'quebec',
  },
  {
    id: 'bdsp',
    nameEn: 'BDSP',
    nameFr: 'BDSP',
    descriptionEn: 'French public health database',
    descriptionFr: 'Base de données en santé publique française',
    url: 'https://bdsp-ehesp.inist.fr/',
    category: 'quebec',
  },
  {
    id: 'erudit',
    nameEn: 'Érudit',
    nameFr: 'Érudit',
    descriptionEn: 'Quebec/Canada scholarly journals',
    descriptionFr: 'Revues savantes québécoises et canadiennes',
    url: 'https://www.erudit.org/fr/',
    category: 'quebec',
  },
  {
    id: 'oiiq',
    nameEn: 'OIIQ Resources',
    nameFr: 'Ressources OIIQ',
    descriptionEn: 'Quebec Order of Nurses publications',
    descriptionFr: 'Publications de l\'Ordre des infirmières du Québec',
    url: 'https://www.oiiq.org/pratique-infirmiere',
    category: 'quebec',
  },
  {
    id: 'inesss',
    nameEn: 'INESSS',
    nameFr: 'INESSS',
    descriptionEn: 'Quebec clinical practice guidelines',
    descriptionFr: 'Guides de pratique clinique du Québec',
    url: 'https://www.inesss.qc.ca/',
    category: 'quebec',
  },
];

export const NursingDatabaseLinks = () => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const internationalDbs = NURSING_DATABASES.filter(db => db.category === 'international');
  const quebecDbs = NURSING_DATABASES.filter(db => db.category === 'quebec');

  return (
    <div className="border-t border-border">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 h-auto"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          <span className="text-xs sm:text-sm font-medium">
            {language === 'fr' ? 'Bases de données' : 'Databases'}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
          {/* International Databases */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 sm:mb-2">
              {language === 'fr' ? 'Internationales' : 'International'}
            </h4>
            <div className="grid gap-1.5">
              {internationalDbs.map((db) => (
                <a
                  key={db.id}
                  href={db.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-between p-1.5 sm:p-2 rounded-md",
                    "bg-muted/50 hover:bg-muted transition-colors group"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] sm:text-xs font-medium truncate">
                      {language === 'fr' ? db.nameFr : db.nameEn}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate hidden sm:block">
                      {language === 'fr' ? db.descriptionFr : db.descriptionEn}
                    </div>
                  </div>
                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground group-hover:text-primary ml-2 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {/* Quebec Databases */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 sm:mb-2 flex items-center gap-1">
              <span>🍁</span>
              {language === 'fr' ? 'Québec / Canada' : 'Quebec / Canada'}
            </h4>
            <div className="grid gap-1 sm:gap-1.5">
              {quebecDbs.map((db) => (
                <a
                  key={db.id}
                  href={db.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-between p-1.5 sm:p-2 rounded-md",
                    "bg-muted/50 hover:bg-muted transition-colors group"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] sm:text-xs font-medium truncate">
                      {language === 'fr' ? db.nameFr : db.nameEn}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate hidden sm:block">
                      {language === 'fr' ? db.descriptionFr : db.descriptionEn}
                    </div>
                  </div>
                  <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground group-hover:text-primary ml-2 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic text-center pt-2">
            {language === 'fr' 
              ? '💡 Certaines bases nécessitent un accès institutionnel'
              : '💡 Some databases require institutional access'}
          </p>
        </div>
      )}
    </div>
  );
};
