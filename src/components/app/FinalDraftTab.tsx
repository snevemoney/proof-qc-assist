import { useState, useEffect, useCallback } from 'react';
import { Download, Copy, Loader2, RefreshCw, Sparkles, User, Check, UserCheck, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWritingProfile, WritingProfile } from '@/hooks/useWritingProfile';
import { useFinalDraft } from '@/hooks/useFinalDraft';
import { Claim, Intervention, Source } from '@/lib/verification';
import { toast } from 'sonner';
import { SelectionFeedbackPopover } from './SelectionFeedbackPopover';
import { DiffView } from './DiffView';
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
  language 
}: FinalDraftTabProps) => {
  const { user } = useAuth();
  const { 
    profile, 
    isLoading: profileLoading, 
    isAnalyzing, 
    analyzeStyle,
    autoAnalyzeIfNeeded 
  } = useWritingProfile();
  const { 
    finalDraft, 
    isGenerating, 
    error, 
    generateFinalDraft, 
    setFinalDraft,
    regenerateWithFeedback,
    versions,
    currentVersionIndex,
    goToPreviousVersion,
    goToNextVersion
  } = useFinalDraft();
  const [viewMode, setViewMode] = useState<'final' | 'compare'>('final');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  // Text selection state
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionPopover, setShowSelectionPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  // Auto-analyze writing style when tab is viewed and no profile exists
  useEffect(() => {
    if (user && !profile && !profileLoading && !isAnalyzing && hasVerified) {
      autoAnalyzeIfNeeded(language);
    }
  }, [user, profile, profileLoading, isAnalyzing, hasVerified, language, autoAnalyzeIfNeeded]);

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
      setFeedback(''); // Clear feedback on new generation
    }
  };

  const handleRegenerateWithFeedback = async () => {
    if (!feedback.trim()) return;
    
    const success = await regenerateWithFeedback(feedback, {
      draftText,
      claims,
      interventions,
      sources,
      language,
    });

    if (success) {
      toast.success(language === 'fr' ? 'Version améliorée générée!' : 'Improved version generated!');
      setFeedback('');
    }
  };

  const handleQuickFeedback = (quickFeedback: string) => {
    setFeedback(prev => prev ? `${prev}. ${quickFeedback}` : quickFeedback);
  };

  // Handle text selection in the final draft view
  const handleTextSelection = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 3) {
      setSelectedText(text);
      setPopoverPosition({ x: e.clientX, y: e.clientY });
      setShowSelectionPopover(true);
    }
  }, []);

  // Add targeted feedback from selection
  const handleAddTargetedFeedback = useCallback((targetedFeedback: string) => {
    setFeedback(prev => prev ? `${prev}\n${targetedFeedback}` : targetedFeedback);
    toast.success(language === 'fr' ? 'Commentaire ajouté' : 'Feedback added');
  }, [language]);

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
    // Show analyzing state when auto-analyzing
    if (isAnalyzing && !profileData) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              {language === 'fr' ? 'Profil d\'écriture' : 'Writing Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {language === 'fr' ? 'Apprentissage de votre style d\'écriture...' : 'Learning your writing style...'}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }

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
                ? 'Votre style sera analysé automatiquement.'
                : 'Your style will be analyzed automatically.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? 'Le système apprendra votre style pour générer une version finale qui vous ressemble.'
                : 'The system will learn your style to generate a final version that sounds like you.'}
            </p>
          </CardContent>
        </Card>
      );
    }

    const confidencePercent = Math.round((profileData.confidence_score ?? 0) * 100);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              {language === 'fr' ? 'Profil appris' : 'Profile Learned'}
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
              <span className="ml-1 font-medium capitalize">{profileData.vocabulary_level || 'moderate'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Formalité:' : 'Formality:'}</span>
              <span className="ml-1 font-medium capitalize">{profileData.formality_level || 'academic'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Phrases ~' : 'Sentences ~'}</span>
              <span className="ml-1 font-medium">{Math.round(profileData.avg_sentence_length ?? 15)} {language === 'fr' ? 'mots' : 'words'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{language === 'fr' ? 'Échantillons:' : 'Samples:'}</span>
              <span className="ml-1 font-medium">{profileData.samples_analyzed ?? 0}</span>
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
            
            {profile && (profile.confidence_score ?? 0) >= 0.5 && (
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'final' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('final')}
                  >
                    {language === 'fr' ? 'Version finale' : 'Final Version'}
                  </Button>
                  <Button
                    variant={viewMode === 'compare' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('compare')}
                  >
                    {language === 'fr' ? 'Comparer' : 'Compare'}
                  </Button>
                </div>
                
                {/* Version navigation */}
                {versions.length > 1 && (
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={goToPreviousVersion}
                      disabled={currentVersionIndex <= 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      v{currentVersionIndex + 1}/{versions.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={goToNextVersion}
                      disabled={currentVersionIndex >= versions.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

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
              <div className="relative">
                {/* Selectable text display for reading/feedback */}
                <div
                  className="min-h-[400px] max-h-[600px] overflow-y-auto font-mono text-sm p-3 border rounded-md bg-background whitespace-pre-wrap cursor-text select-text"
                  onMouseUp={handleTextSelection}
                >
                  {finalDraft || (isGenerating && (
                    <span className="text-muted-foreground">
                      {language === 'fr' ? 'Génération en cours...' : 'Generating...'}
                    </span>
                  ))}
                </div>
                
                {/* Hint for text selection */}
                {finalDraft && !isGenerating && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    💡 {language === 'fr' 
                      ? 'Sélectionnez du texte pour donner un commentaire ciblé' 
                      : 'Select text to give targeted feedback'}
                  </p>
                )}
                
                {/* Selection feedback popover */}
                {showSelectionPopover && (
                  <SelectionFeedbackPopover
                    selectedText={selectedText}
                    position={popoverPosition}
                    onAddFeedback={handleAddTargetedFeedback}
                    onClose={() => setShowSelectionPopover(false)}
                    language={language}
                  />
                )}
              </div>
            ) : (
              <DiffView
                original={draftText}
                modified={finalDraft}
                language={language}
              />
            )}

            {isGenerating && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {profile && (profile.confidence_score ?? 0) >= 0.3
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

      {/* Feedback/Refinement Section */}
      {finalDraft && !isGenerating && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === 'fr' ? 'Améliorer ce résultat' : 'Improve This Result'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Décrivez ce que vous n\'aimez pas et régénérez.'
                : 'Describe what you don\'t like and regenerate.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick feedback chips */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFeedback(language === 'fr' ? 'Trop long' : 'Too long')}
              >
                {language === 'fr' ? 'Trop long' : 'Too long'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFeedback(language === 'fr' ? 'Trop formel' : 'Too formal')}
              >
                {language === 'fr' ? 'Trop formel' : 'Too formal'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFeedback(language === 'fr' ? 'Trop simple' : 'Too simple')}
              >
                {language === 'fr' ? 'Trop simple' : 'Too simple'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFeedback(language === 'fr' ? 'Ne sonne pas comme moi' : "Doesn't sound like me")}
              >
                {language === 'fr' ? 'Ne sonne pas comme moi' : "Doesn't sound like me"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleQuickFeedback(language === 'fr' ? 'Besoin de plus de citations' : 'Needs more citations')}
              >
                {language === 'fr' ? 'Plus de citations' : 'More citations'}
              </Button>
            </div>
            
            {/* Free-form feedback */}
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={language === 'fr' 
                ? "Décrivez ce que vous n'aimez pas ou ce qui devrait être amélioré..." 
                : "Describe what you don't like or what should be improved..."}
              className="min-h-[80px]"
            />
            
            {/* Regenerate button */}
            <Button 
              onClick={handleRegenerateWithFeedback}
              disabled={!feedback.trim() || isGenerating}
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {language === 'fr' ? 'Régénérer avec mes commentaires' : 'Regenerate with my feedback'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
