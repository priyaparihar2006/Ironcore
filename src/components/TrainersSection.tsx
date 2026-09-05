import React from 'react';
import { Trainer } from '../types';
import { TRAINERS } from '../data/mockData';
import { Star, Award, Users, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface TrainersSectionProps {
  onSelectTrainer: (trainer: Trainer) => void;
}

export const TrainersSection: React.FC<TrainersSectionProps> = ({ onSelectTrainer }) => {
  return (
    <section id="trainers" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>World-Class Coaching Staff</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
              Master Coaches & Biomechanists
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
              Trained at elite sports institutes. Our coaches analyze movement vectors, manage recovery readiness, and personalize your journey.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Accepting 1-on-1 and Hybrid Athletes</span>
          </div>
        </div>

        {/* 4 Trainer Profile Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {TRAINERS.map((trainer) => (
            <div
              key={trainer.id}
              className="group relative rounded-[28px] bg-white border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Container with Gradient Overlay */}
              <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-neutral-900">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Rating Badge Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#080512] text-xs font-bold shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{trainer.rating}</span>
                  <span className="text-[10px] text-neutral-600 font-normal">({trainer.reviewsCount})</span>
                </div>

                {/* Experience Badge Top Left */}
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                    {trainer.experience}
                  </span>
                </div>

                {/* Overlay Details on Bottom of Image */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-bold leading-snug">{trainer.name}</h3>
                  <p className="text-xs text-purple-200 font-medium">{trainer.specialty}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-xs text-neutral-600 leading-relaxed mb-4 line-clamp-3">
                    {trainer.bio}
                  </p>

                  {/* Certifications preview */}
                  <div className="space-y-1 mb-5">
                    {trainer.certifications.slice(0, 1).map((cert, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-neutral-700 font-medium">
                        <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-neutral-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{trainer.clientCount}+ coached</span>
                  </div>

                  <button
                    onClick={() => onSelectTrainer(trainer)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-[#080512] bg-neutral-100 hover:bg-[#080512] hover:text-white transition-colors duration-200"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
