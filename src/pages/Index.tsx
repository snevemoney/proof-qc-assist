// ProofCheck QC Application
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AppHeader } from '@/components/app/AppHeader';
import { ProjectWorkspace } from '@/components/app/ProjectWorkspace';

const Index = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <ProjectWorkspace />
      </div>
    </LanguageProvider>
  );
};

export default Index;
