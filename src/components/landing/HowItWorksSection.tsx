import { useLanguage } from '@/contexts/LanguageContext';
import { Upload, FileEdit, ClipboardCheck } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    number: '01',
    titleKey: 'howItWorks.step1.title',
    descriptionKey: 'howItWorks.step1.description',
  },
  {
    icon: FileEdit,
    number: '02',
    titleKey: 'howItWorks.step2.title',
    descriptionKey: 'howItWorks.step2.description',
  },
  {
    icon: ClipboardCheck,
    number: '03',
    titleKey: 'howItWorks.step3.title',
    descriptionKey: 'howItWorks.step3.description',
  },
];

export const HowItWorksSection = () => {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.titleKey} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/5 border-2 border-primary/20">
                      <step.icon className="h-12 w-12 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {step.number}
                    </div>
                  </div>
                  
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(step.descriptionKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
