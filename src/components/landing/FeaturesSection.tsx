import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch, ListChecks, Link2, BookOpen, Languages, Download } from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    titleKey: 'features.source.title',
    descriptionKey: 'features.source.description',
  },
  {
    icon: ListChecks,
    titleKey: 'features.claims.title',
    descriptionKey: 'features.claims.description',
  },
  {
    icon: Link2,
    titleKey: 'features.citation.title',
    descriptionKey: 'features.citation.description',
  },
  {
    icon: BookOpen,
    titleKey: 'features.apa.title',
    descriptionKey: 'features.apa.description',
  },
  {
    icon: Languages,
    titleKey: 'features.bilingual.title',
    descriptionKey: 'features.bilingual.description',
  },
  {
    icon: Download,
    titleKey: 'features.export.title',
    descriptionKey: 'features.export.description',
  },
];

export const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.titleKey} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{t(feature.titleKey)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t(feature.descriptionKey)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
