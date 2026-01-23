import { useState } from 'react';
import { FileCheck, LogOut, User } from 'lucide-react';
import { LanguageToggle } from '@/components/landing/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AppHeader = () => {
  const { language } = useLanguage();
  const { user, signOut, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const t = {
    signIn: language === 'fr' ? 'Connexion' : 'Sign In',
    signOut: language === 'fr' ? 'Déconnexion' : 'Sign Out',
  };

  return (
    <>
      <header className="border-b bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">ProofCheck QC</span>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageToggle />
            
            {!isLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="max-w-[120px] truncate text-xs">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => signOut()} className="gap-2">
                      <LogOut className="h-4 w-4" />
                      {t.signOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                >
                  {t.signIn}
                </Button>
              )
            )}
          </div>
        </div>
      </header>
      
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};
