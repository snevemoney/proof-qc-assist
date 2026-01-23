import { useState } from 'react';
import { FileText, Edit3, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourcesTab } from './SourcesTab';
import { DraftTab } from './DraftTab';
import { ReportTab } from './ReportTab';
import { useLanguage } from '@/contexts/LanguageContext';

interface Source {
  id: string;
  title: string;
  authors: string;
  year: string;
  journal?: string;
  abstract?: string;
}

interface Claim {
  id: string;
  text: string;
  status: 'supported' | 'partial' | 'unsupported' | 'contradicted';
  sourceRef?: string;
  evidence?: string;
  suggestion?: string;
}

// Demo data
const demoSources: Source[] = [
  {
    id: '1',
    title: 'The Impact of Climate Change on Arctic Ecosystems',
    authors: 'Smith, J., Johnson, M.',
    year: '2023',
    journal: 'Nature Climate Change',
    abstract: 'This study examines the rapid changes occurring in Arctic ecosystems due to rising temperatures...',
  },
  {
    id: '2',
    title: 'Biodiversity Loss in Northern Regions: A Meta-Analysis',
    authors: 'Tremblay, P., Roy, S.',
    year: '2022',
    journal: 'Environmental Science & Technology',
    abstract: 'Our meta-analysis of 47 studies reveals significant biodiversity decline in northern latitudes...',
  },
];

const demoClaims: Claim[] = [
  {
    id: '1',
    text: 'Arctic temperatures have risen by 2.5°C over the past decade.',
    status: 'supported',
    sourceRef: '[S1]',
    evidence: 'Arctic temperatures have increased by approximately 2.5 degrees Celsius since 2013...',
  },
  {
    id: '2',
    text: 'Polar bear populations have declined by 40% since 2000.',
    status: 'partial',
    sourceRef: '[S2]',
    evidence: 'Population studies show varying decline rates between 25-45% depending on region...',
    suggestion: 'Consider specifying the geographic region or citing the range of decline percentages.',
  },
  {
    id: '3',
    text: 'Ice sheet melting has accelerated exponentially.',
    status: 'unsupported',
    suggestion: 'This claim was not found in any of your uploaded sources. Add a source that supports this claim or remove it.',
  },
  {
    id: '4',
    text: 'Northern ecosystems are more resilient than tropical ones.',
    status: 'contradicted',
    sourceRef: '[S2]',
    evidence: 'Northern ecosystems show lower resilience due to slower regeneration rates...',
    suggestion: 'Your source contradicts this claim. Consider revising or removing this statement.',
  },
];

export const ProjectWorkspace = () => {
  const { t } = useLanguage();
  const [sources, setSources] = useState<Source[]>(demoSources);
  const [draftText, setDraftText] = useState('');
  const [hasVerified, setHasVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activeTab, setActiveTab] = useState('sources');

  const handleAddSources = (newSources: Source[]) => {
    setSources(prev => [...prev, ...newSources]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setClaims(demoClaims);
    setHasVerified(true);
    setIsVerifying(false);
    setActiveTab('report');
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
            />
          </TabsContent>

          <TabsContent value="report" className="mt-0">
            <ReportTab
              hasVerified={hasVerified}
              claims={claims}
              sourcesCount={sources.length}
              draftLength={draftText.length}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
