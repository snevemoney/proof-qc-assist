import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, FileText, Grid3X3, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EvaluationCriterion,
  evaluationTemplates,
  getTemplateById,
  generateCriterionId,
  validateWeights,
} from '@/lib/evaluationTemplates';

export const RequirementsTab: React.FC = () => {
  const { language, t } = useLanguage();
  const { instructions, evaluationGrid, setInstructions, setEvaluationGrid } = useProjectContext();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const weightValidation = validateWeights(evaluationGrid);
  const totalWeight = weightValidation.total;

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'custom') {
      setSelectedTemplate('custom');
      return;
    }

    const template = getTemplateById(templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setEvaluationGrid(template.criteria.map(c => ({
        ...c,
        id: generateCriterionId(),
      })));
    }
  };

  const handleAddCriterion = () => {
    const newCriterion: EvaluationCriterion = {
      id: generateCriterionId(),
      name: '',
      nameFr: '',
      description: '',
      descriptionFr: '',
      weight: 0,
      isRequired: false,
    };
    setEvaluationGrid([...evaluationGrid, newCriterion]);
  };

  const handleUpdateCriterion = (id: string, updates: Partial<EvaluationCriterion>) => {
    setEvaluationGrid(
      evaluationGrid.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteCriterion = (id: string) => {
    setEvaluationGrid(evaluationGrid.filter(c => c.id !== id));
  };

  const getLocalizedName = (criterion: EvaluationCriterion) => {
    return language === 'fr' ? criterion.nameFr || criterion.name : criterion.name;
  };

  const getLocalizedDescription = (criterion: EvaluationCriterion) => {
    return language === 'fr' ? criterion.descriptionFr || criterion.description : criterion.description;
  };

  return (
    <div className="space-y-6 p-1">
      {/* Instructions Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {language === 'fr' ? 'Consignes du travail' : 'Assignment Instructions'}
          </CardTitle>
          <CardDescription>
            {language === 'fr'
              ? 'Collez ou tapez les consignes spécifiques de votre travail. L\'IA vérifiera votre brouillon par rapport à ces exigences.'
              : 'Paste or type your assignment-specific instructions. The AI will verify your draft against these requirements.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={
              language === 'fr'
                ? 'Ex: Le plan de soins doit inclure au moins 3 diagnostics infirmiers prioritaires, chacun avec des interventions fondées sur des données probantes...'
                : 'Ex: The care plan must include at least 3 priority nursing diagnoses, each with evidence-based interventions...'
            }
            className="min-h-[150px] resize-y"
          />
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {language === 'fr'
              ? 'Conseil: Soyez précis sur les exigences minimales (nombre de sources, format, etc.)'
              : 'Tip: Be specific about minimum requirements (number of sources, format, etc.)'}
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Grid Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Grid3X3 className="h-5 w-5 text-primary" />
            {language === 'fr' ? 'Grille d\'évaluation' : 'Evaluation Grid'}
          </CardTitle>
          <CardDescription>
            {language === 'fr'
              ? 'Définissez les critères d\'évaluation de votre travail. L\'IA estimera votre score pour chaque critère.'
              : 'Define the evaluation criteria for your assignment. The AI will estimate your score for each criterion.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selector */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="mb-2 block text-sm">
                {language === 'fr' ? 'Commencer avec un modèle' : 'Start with a template'}
              </Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      language === 'fr' ? 'Sélectionner un modèle...' : 'Select a template...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {evaluationTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {language === 'fr' ? template.nameFr : template.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    {language === 'fr' ? '✏️ Grille personnalisée' : '✏️ Custom grid'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weight Progress */}
            <div className="flex-1">
              <Label className="mb-2 block text-sm">
                {language === 'fr' ? 'Répartition des pondérations' : 'Weight Distribution'}
              </Label>
              <div className="flex items-center gap-3">
                <Progress
                  value={Math.min(totalWeight, 100)}
                  className={cn(
                    'flex-1 h-3',
                    !weightValidation.isValid && totalWeight > 0 && 'bg-destructive/20'
                  )}
                />
                <Badge
                  variant={weightValidation.isValid || totalWeight === 0 ? 'secondary' : 'destructive'}
                  className="min-w-[60px] justify-center"
                >
                  {totalWeight}%
                </Badge>
              </div>
              {!weightValidation.isValid && totalWeight > 0 && (
                <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {language === 'fr' ? 'Les pondérations doivent totaliser 100%' : 'Weights must total 100%'}
                </p>
              )}
            </div>
          </div>

          {/* Criteria List */}
          {evaluationGrid.length > 0 ? (
            <Accordion type="multiple" className="space-y-2">
              {evaluationGrid.map((criterion, index) => (
                <AccordionItem
                  key={criterion.id}
                  value={criterion.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="truncate font-medium">
                        {getLocalizedName(criterion) || (language === 'fr' ? 'Nouveau critère' : 'New criterion')}
                      </span>
                      <div className="flex items-center gap-2 ml-auto mr-2 flex-shrink-0">
                        {criterion.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            {language === 'fr' ? 'Requis' : 'Required'}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {criterion.weight}%
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1.5 block">
                          {language === 'fr' ? 'Nom (EN)' : 'Name (EN)'}
                        </Label>
                        <Input
                          value={criterion.name}
                          onChange={(e) =>
                            handleUpdateCriterion(criterion.id, { name: e.target.value })
                          }
                          placeholder="Evidence Quality"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">
                          {language === 'fr' ? 'Nom (FR)' : 'Name (FR)'}
                        </Label>
                        <Input
                          value={criterion.nameFr}
                          onChange={(e) =>
                            handleUpdateCriterion(criterion.id, { nameFr: e.target.value })
                          }
                          placeholder="Qualité des preuves"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs mb-1.5 block">
                          {language === 'fr' ? 'Description (EN)' : 'Description (EN)'}
                        </Label>
                        <Textarea
                          value={criterion.description}
                          onChange={(e) =>
                            handleUpdateCriterion(criterion.id, { description: e.target.value })
                          }
                          placeholder="What is expected for this criterion..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">
                          {language === 'fr' ? 'Description (FR)' : 'Description (FR)'}
                        </Label>
                        <Textarea
                          value={criterion.descriptionFr}
                          onChange={(e) =>
                            handleUpdateCriterion(criterion.id, { descriptionFr: e.target.value })
                          }
                          placeholder="Ce qui est attendu pour ce critère..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="w-24">
                        <Label className="text-xs mb-1.5 block">
                          {language === 'fr' ? 'Poids (%)' : 'Weight (%)'}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={criterion.weight}
                          onChange={(e) =>
                            handleUpdateCriterion(criterion.id, {
                              weight: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <Switch
                          id={`required-${criterion.id}`}
                          checked={criterion.isRequired}
                          onCheckedChange={(checked) =>
                            handleUpdateCriterion(criterion.id, { isRequired: checked })
                          }
                        />
                        <Label htmlFor={`required-${criterion.id}`} className="text-sm cursor-pointer">
                          {language === 'fr' ? 'Obligatoire pour réussir' : 'Required to pass'}
                        </Label>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive ml-auto"
                        onClick={() => handleDeleteCriterion(criterion.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {language === 'fr' ? 'Supprimer' : 'Delete'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Grid3X3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {language === 'fr'
                  ? 'Aucun critère défini'
                  : 'No criteria defined'}
              </p>
              <p className="text-sm mt-1">
                {language === 'fr'
                  ? 'Sélectionnez un modèle ou ajoutez des critères manuellement'
                  : 'Select a template or add criteria manually'}
              </p>
            </div>
          )}

          {/* Add Criterion Button */}
          <Button
            variant="outline"
            onClick={handleAddCriterion}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Ajouter un critère' : 'Add criterion'}
          </Button>

          {/* Summary */}
          {evaluationGrid.length > 0 && (
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>
                  {evaluationGrid.filter(c => c.isRequired).length}{' '}
                  {language === 'fr' ? 'critères obligatoires' : 'required criteria'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                <span>
                  {evaluationGrid.length}{' '}
                  {language === 'fr' ? 'critères au total' : 'total criteria'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
