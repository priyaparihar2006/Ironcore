import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { DashboardPreview } from '../components/DashboardPreview';
import { ProgramsSection } from '../components/ProgramsSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { ProgressSection } from '../components/ProgressSection';
import { TrainersSection } from '../components/TrainersSection';
import { PricingSection } from '../components/PricingSection';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';
import { TrialModal } from '../components/TrialModal';
import { ProgramModal } from '../components/ProgramModal';
import { TrainerModal } from '../components/TrainerModal';
import { WorkoutProgram, Trainer, PricingPlan } from '../types';

export const LandingPage: React.FC = () => {
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [selectedPlanForTrial, setSelectedPlanForTrial] = useState<PricingPlan | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenTrial = (plan?: PricingPlan) => {
    setSelectedPlanForTrial(plan || null);
    setTrialModalOpen(true);
  };

  const handleEnrollProgram = (program: WorkoutProgram) => {
    showToast(`Successfully enrolled in ${program.title}! Schedule added to your dashboard.`);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#080512] font-sans antialiased selection:bg-purple-100 selection:text-purple-900 flex flex-col justify-between">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#080512] text-white px-5 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border border-purple-500/30 flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar onOpenTrial={() => handleOpenTrial()} />

      {/* Main Page Content */}
      <main className="flex-1">
        
        {/* 1. HERO SECTION */}
        <Hero onJoinNow={() => handleOpenTrial()} />

        {/* 2. FITNESS DASHBOARD PREVIEW */}
        <DashboardPreview />

        {/* 3. PROGRAMS SECTION */}
        <ProgramsSection onSelectProgram={(prog) => setSelectedProgram(prog)} />

        {/* 4. FEATURES SECTION */}
        <FeaturesSection />

        {/* 5. PROGRESS SECTION */}
        <ProgressSection />

        {/* 6. TRAINERS SECTION */}
        <TrainersSection onSelectTrainer={(trainer) => setSelectedTrainer(trainer)} />

        {/* 7. PRICING SECTION */}
        <PricingSection onSelectPlan={(plan) => handleOpenTrial(plan)} />

        {/* 8. TESTIMONIALS */}
        <TestimonialsSection />

        {/* 9. CTA SECTION */}
        <CTASection onStartTrial={() => handleOpenTrial()} />

      </main>

      {/* 10. FOOTER */}
      <Footer />

      {/* Interactive Modals */}
      <TrialModal
        isOpen={trialModalOpen}
        onClose={() => setTrialModalOpen(false)}
        defaultPlan={selectedPlanForTrial}
      />

      <ProgramModal
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onEnroll={handleEnrollProgram}
      />

      <TrainerModal
        trainer={selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
      />

    </div>
  );
};
