import React, { useState } from 'react';
import { FEATURES } from '../data/mockData';
import { 
  Dumbbell, 
  TrendingUp, 
  UserCheck, 
  Apple, 
  QrCode, 
  CreditCard, 
  Users, 
  Target, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const [activeFeatureId, setActiveFeatureId] = useState<string>(FEATURES[0].id);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Dumbbell': return <Dumbbell className="w-6 h-6 text-purple-600" />;
      case 'TrendingUp': return <TrendingUp className="w-6 h-6 text-cyan-600" />;
      case 'UserCheck': return <UserCheck className="w-6 h-6 text-emerald-600" />;
      case 'Apple': return <Apple className="w-6 h-6 text-orange-600" />;
      case 'QrCode': return <QrCode className="w-6 h-6 text-purple-600" />;
      case 'CreditCard': return <CreditCard className="w-6 h-6 text-indigo-600" />;
      case 'Users': return <Users className="w-6 h-6 text-pink-600" />;
      case 'Target': return <Target className="w-6 h-6 text-amber-600" />;
      default: return <Dumbbell className="w-6 h-6 text-purple-600" />;
    }
  };

  const activeFeature = FEATURES.find(f => f.id === activeFeatureId) || FEATURES[0];

  return (
    <section id="features" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-b from-[#F8F7FA] via-white to-[#F8F7FA] relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Complete Gym & Member Ecosystem</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
            Everything Your Fitness Journey Needs
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            Eliminate fragmented apps and disjointed spreadsheets. IronCore unifies world-class training telemetry, club operations, and nutrition into one seamless stack.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {FEATURES.map((feature) => {
            const isSelected = feature.id === activeFeatureId;
            return (
              <div
                key={feature.id}
                onClick={() => setActiveFeatureId(feature.id)}
                className={`group cursor-pointer rounded-[24px] p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-purple-400/90 shadow-[0_12px_30px_-10px_rgba(109,40,217,0.12)] ring-2 ring-purple-500/10'
                    : 'bg-white/80 hover:bg-white border-neutral-200/70 hover:border-purple-200 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100/90 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getIcon(feature.iconName)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#080512] mb-2 group-hover:text-purple-700 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-6">
                    {feature.shortDesc}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-[#080512] block">
                      {feature.metric}
                    </span>
                    <span className="text-[10px] text-neutral-600 block">
                      {feature.metricLabel}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-neutral-100 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Detail Spotlight Banner */}
        <div className="mt-10 rounded-[28px] bg-gradient-to-r from-[#080512] via-[#1a1233] to-[#2e1d52] p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-purple-200 mb-3 backdrop-blur-sm">
              <span>Deep-Dive Spotlight:</span>
              <strong className="text-white">{activeFeature.title}</strong>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold mb-2">
              Empowering athletes and gym managers with high precision tools.
            </h4>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {activeFeature.fullDesc}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center w-full sm:w-auto">
              <span className="text-2xl font-extrabold text-purple-200 block">{activeFeature.metric}</span>
              <span className="text-[10px] text-neutral-300 uppercase tracking-wider font-semibold">{activeFeature.metricLabel}</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
