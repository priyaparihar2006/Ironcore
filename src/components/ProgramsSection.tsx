import React, { useState } from 'react';
import { WorkoutProgram } from '../types';
import { WORKOUT_PROGRAMS } from '../data/mockData';
import { Flame, Clock, Calendar, Star, ArrowRight, Sparkles, Filter } from 'lucide-react';

interface ProgramsSectionProps {
  onSelectProgram: (program: WorkoutProgram) => void;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({ onSelectProgram }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Strength', 'Hypertrophy', 'Fat Loss', 'Endurance', 'Functional'];

  const filteredPrograms = selectedCategory === 'All'
    ? WORKOUT_PROGRAMS
    : WORKOUT_PROGRAMS.filter(p => p.category === selectedCategory);

  return (
    <section id="programs" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Scientific Training Architecture</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
              Train With Purpose
            </h2>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
              Every program is engineered around progressive overload, recovery bio-metrics, and measurable physiological adaptations.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-[#080512] text-white shadow-sm'
                    : 'bg-white text-neutral-600 hover:text-[#080512] border border-neutral-200/80 hover:bg-neutral-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid: 6 Cards as requested */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPrograms.map((program) => (
            <div
              key={program.id}
              className="group relative rounded-[28px] bg-white border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-200/80 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Container with Badges */}
              <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-neutral-900">
                <img
                  src={program.image}
                  alt={program.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Level Tag Top Left */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-[#080512] shadow-xs">
                    {program.level}
                  </span>
                </div>

                {/* Rating Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{program.rating}</span>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                    {program.duration}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-purple-300" />
                    {program.frequency}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[#080512] group-hover:text-purple-700 transition-colors">
                      {program.title}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                      {program.category}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-600 leading-relaxed mb-5 line-clamp-2">
                    {program.description}
                  </p>

                  {/* Highlights Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {program.highlights.slice(0, 2).map((h, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100/80 text-neutral-700 font-medium">
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer of Card with Trainer & CTA */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="text-xs">
                      <span className="text-neutral-600 block text-[10px]">Lead Coach</span>
                      <span className="font-bold text-[#080512]">{program.trainer}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProgram(program)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#080512] hover:bg-purple-900 group-hover:bg-purple-700 transition-all duration-200 shadow-xs"
                  >
                    <span>View Program</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
