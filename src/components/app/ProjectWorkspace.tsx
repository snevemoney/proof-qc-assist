import { useState } from 'react';
import { FileText, Edit3, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcesTab } from './SourcesTab';
import { DraftTab } from './DraftTab';
import { ReportTab } from './ReportTab';
import { useLanguage } from '@/contexts/LanguageContext';
import { verifyClaims, type Source, type Claim, type VerificationSummary } from '@/lib/verification';
import { useToast } from '@/hooks/use-toast';

// Demo data
const demoSources: Source[] = [
  {
    id: '1',
    title: 'The Impact of Climate Change on Arctic Ecosystems',
    authors: 'Smith, J., Johnson, M.',
    year: '2023',
    journal: 'Nature Climate Change',
    abstract: 'This study examines the rapid changes occurring in Arctic ecosystems due to rising temperatures...',
    content: 'Arctic temperatures have increased by approximately 2.5 degrees Celsius since 2013, leading to significant ecosystem disruption. Permafrost thaw has accelerated, releasing methane and carbon dioxide. Wildlife migration patterns have shifted northward by an average of 100km per decade. Sea ice extent has decreased by 13% per decade since satellite measurements began in 1979.',
  },
  {
    id: '2',
    title: 'Biodiversity Loss in Northern Regions: A Meta-Analysis',
    authors: 'Tremblay, P., Roy, S.',
    year: '2022',
    journal: 'Environmental Science & Technology',
    abstract: 'Our meta-analysis of 47 studies reveals significant biodiversity decline in northern latitudes...',
    content: 'Population studies show varying decline rates between 25-45% depending on region for polar bear populations since 2000. Northern ecosystems show lower resilience due to slower regeneration rates compared to temperate and tropical regions. Species adapted to cold climates are experiencing range contractions of up to 50% in some areas. The meta-analysis found that biodiversity loss in the Arctic is occurring at twice the global average rate.',
  },
];

export const ProjectWorkspace = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [sources, setSources] = useState<Source[]>(demoSources);
  const [draftText, setDraftText] = useState('');
  const [hasVerified, setHasVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [summary, setSummary] = useState<VerificationSummary | null>(null);
  const [activeTab, setActiveTab] = useState('sources');
  const [strictMode, setStrictMode] = useState(false);

  const handleAddSources = (newSources: Source[]) => {
    setSources(prev => [...prev, ...newSources]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    
    try {
      const result = await verifyClaims(sources, draftText, strictMode, language);
      setClaims(result.claims);
      setSummary(result.summary);
      setHasVerified(true);
      setActiveTab('report');
      
      toast({
        title: language === 'fr' ? 'Vérification terminée' : 'Verification complete',
        description: language === 'fr' 
          ? `${result.claims.length} affirmations analysées`
          : `${result.claims.length} claims analyzed`,
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: language === 'fr' ? 'Erreur de vérification' : 'Verification error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="sources" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('tabs.sources')} ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2">
            <Edit3 className="h-4 w-4" />
            {t('tabs.draft')}
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('tabs.report')}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="sources" className="mt-0">
            <SourcesTab
              sources={sources}
              onAddSources={handleAddSources}
              onDeleteSource={handleDeleteSource}
            />
          </TabsContent>

          <TabsContent value="draft" className="mt-0">
            <DraftTab
              draftText={draftText}
              onDraftChange={setDraftText}
              onVerify={handleVerify}
              sourcesCount={sources.length}
              isVerifying={isVerifying}
              strictMode={strictMode}
              onStrictModeChange={setStrictMode}
            />
          </TabsContent>

          <TabsContent value="report" className="mt-0">
            <ReportTab
              hasVerified={hasVerified}
              claims={claims}
              summary={summary}
              sourcesCount={sources.length}
              draftLength={draftText.length}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
