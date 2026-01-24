// ProofCheck QC Application
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProjectContextProvider } from '@/contexts/ProjectContext';
import { AppHeader } from '@/components/app/AppHeader';
import { ProjectSidebar } from '@/components/app/ProjectSidebar';
import { ProjectWorkspace } from '@/components/app/ProjectWorkspace';

const Index = () => {
  return (
    <LanguageProvider>
      <ProjectContextProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <ProjectSidebar />
            <ProjectWorkspace />
          </div>
        </div>
      </ProjectContextProvider>
    </LanguageProvider>
  );
};

export default Index;
