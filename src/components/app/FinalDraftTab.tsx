import { useState } from 'react';
import { Sparkles, Copy, Download, RefreshCw, Loader2, AlertCircle, User, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWritingProfile, WritingProfile } from '@/hooks/useWritingProfile';
import { useFinalDraft } from '@/hooks/useFinalDraft';
import { Source, Claim, Intervention } from '@/lib/verification';
import { toast } from 'sonner';

interface FinalDraftTabProps {
  draftText: string;
  claims: Claim[];
  interventions: Intervention[];
  sources: Source[];
  hasVerified: boolean;
  language: 'fr' | 'en';
}

export const FinalDraftTab = ({
  draftText,
  claims,
  interventions,
  sources,
  hasVerified,
  language,
}: FinalDraftTabProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading, isAnalyzing, analyzeStyle } = useWritingProfile();
  const { finalDraft, setFinalDraft, isGenerating, error, generateFinalDraft, clearFinalDraft } = useFinalDraft();
  const [viewMode, setViewMode] = useState<'final' | 'compare'>('final');
  const [copied, setCopied] = useState(false);

  const issuesCount = claims.filter(c => c.status !== 'supported').length +
    interventions.filter(i => !i.hasEvidence || !i.hasRationale).length;

  const handleGenerate = async () => {
    const success = await generateFinalDraft({
      draftText,
      claims,
      interventions,
      sources,
      language,
    });

    if (success) {
      toast.success(language === 'fr' ? 'Version finale générée!' : 'Final version generated!');
    }
  };

  const handleAnalyzeStyle = async () => {
    const success = await analyzeStyle(language);
    if (success) {
      toast.success(
        language === 'fr' 
          ? 'Profil d\'écriture mis à jour!' 
          : 'Writing profile updated!'
      );
    } else {
      toast.error(
        language === 'fr' 
          ? 'Erreur lors de l\'analyse. Assurez-vous d\'avoir des brouillons sauvegardés.' 
          : 'Analysis error. Make sure you have saved drafts.'
      );
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finalDraft);
    setCopied(true);
    toast.success(language === 'fr' ? 'Copié!' : 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([finalDraft], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = language === 'fr' ? 'version_finale.txt' : 'final_version.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderProfileCard = (profileData: WritingProfile | null) => {
    if (profileLoading) {
      return (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!profileData) {
      return (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {language === 'fr' ? 'Profil d\'écriture' : 'Writing Profile'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Analysez vos textes pour que l\'IA reproduise votre style unique.'
                : 'Analyze your texts so AI can reproduce your unique style.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAnalyzeStyle} 
              disabled={isAnalyzing}
              variant="outline"
              className="w-full gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {language === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {language === 'fr' ? 'Analyser mon style' : 'Analyze My Style'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    const confidencePercent = Math.round(profileData.confidence_score * 100);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {language === 'fr' ? 'Votre profil d\'écriture' : 'Your Writing Profile'}
            </CardTitle>
            <Badge variant={confidencePercent >= 70 ? 'default' : confidencePercent >= 40 ? 'secondary' : 'outline'}>
              {confidencePercent}% {language === 'fr' ? 'confiance' : 'confidence'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={confidencePercent} className="h-2" />
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Vocabulaire:' : 'Vocabulary:'}</span>
              <span className="ml-1 font-medium capitalize">{profileData.vocabulary_level}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Formalité:' : 'Formality:'}</span>
              <span className="ml-1 font-medium capitalize">{profileData.formality_level}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Phrases ~' : 'Sentences ~'}</span>
              <span className="ml-1 font-medium">{Math.round(profileData.avg_sentence_length)} {language === 'fr' ? 'mots' : 'words'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Échantillons:' : 'Samples:'}</span>
              <span className="ml-1 font-medium">{profileData.samples_analyzed}</span>
            </div>
          </div>

          {profileData.quebec_french_markers && (
            <Badge variant="outline" className="text-xs">
              🍁 {language === 'fr' ? 'Français québécois détecté' : 'Quebec French detected'}
            </Badge>
          )}

          <Button 
            onClick={handleAnalyzeStyle} 
            disabled={isAnalyzing}
            variant="ghost"
            size="sm"
            className="w-full gap-2 mt-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {language === 'fr' ? 'Mise à jour...' : 'Updating...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                {language === 'fr' ? 'Mettre à jour le profil' : 'Update Profile'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {language === 'fr' ? 'Connexion requise' : 'Sign In Required'}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {language === 'fr' 
            ? 'Connectez-vous pour générer une version finale qui préserve votre style d\'écriture unique.'
            : 'Sign in to generate a final version that preserves your unique writing style.'}
        </p>
      </div>
    );
  }

  if (!hasVerified) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {language === 'fr' ? 'Vérification requise' : 'Verification Required'}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {language === 'fr' 
            ? 'Vérifiez d\'abord votre brouillon dans l\'onglet "Brouillon" pour identifier les problèmes à corriger.'
            : 'First verify your draft in the "Draft" tab to identify issues to fix.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      {/* Header with profile and generate button */}
      <div className="grid gap-4 md:grid-cols-2">
        {renderProfileCard(profile)}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'fr' ? 'Générer la version finale' : 'Generate Final Version'}
            </CardTitle>
            <CardDescription>
              {issuesCount > 0 ? (
                language === 'fr' 
                  ? `${issuesCount} problème(s) seront corrigés automatiquement.`
                  : `${issuesCount} issue(s) will be automatically fixed.`
              ) : (
                language === 'fr'
                  ? 'Améliorer la fluidité et la clarté.'
                  : 'Improve flow and clarity.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !draftText.trim()}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {language === 'fr' ? 'Génération en cours...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {language === 'fr' ? 'Générer ma version finale' : 'Generate My Final Version'}
                </>
              )}
            </Button>
            
            {profile && profile.confidence_score >= 0.5 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                ✨ {language === 'fr' ? 'Le résultat correspondra à votre style' : 'Result will match your style'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{language === 'fr' ? 'Erreur' : 'Error'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Final draft display */}
      {(finalDraft || isGenerating) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'final' | 'compare')}>
                <TabsList>
                  <TabsTrigger value="final">
                    {language === 'fr' ? 'Version finale' : 'Final Version'}
                  </TabsTrigger>
                  <TabsTrigger value="compare">
                    {language === 'fr' ? 'Comparer' : 'Compare'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {finalDraft && !isGenerating && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? (language === 'fr' ? 'Copié!' : 'Copied!') : (language === 'fr' ? 'Copier' : 'Copy')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                    <Download className="h-3 w-3" />
                    {language === 'fr' ? 'Télécharger' : 'Download'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'final' ? (
              <Textarea
                value={finalDraft}
                onChange={(e) => setFinalDraft(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder={isGenerating 
                  ? (language === 'fr' ? 'Génération en cours...' : 'Generating...') 
                  : ''
                }
                disabled={isGenerating}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    {language === 'fr' ? 'Original' : 'Original'}
                  </h4>
                  <Textarea
                    value={draftText}
                    readOnly
                    className="min-h-[400px] font-mono text-sm bg-muted/50"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    {language === 'fr' ? 'Version finale' : 'Final Version'}
                  </h4>
                  <Textarea
                    value={finalDraft}
                    onChange={(e) => setFinalDraft(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    disabled={isGenerating}
                  />
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {profile && profile.confidence_score >= 0.3
                  ? (language === 'fr' ? 'Adaptation à votre style en cours...' : 'Adapting to your style...')
                  : (language === 'fr' ? 'Génération en cours...' : 'Generating...')
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!finalDraft && !isGenerating && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'fr' ? 'Prêt à générer' : 'Ready to Generate'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {language === 'fr' 
                ? 'Cliquez sur "Générer ma version finale" pour créer une version corrigée qui préserve votre style d\'écriture.'
                : 'Click "Generate My Final Version" to create a corrected version that preserves your writing style.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
