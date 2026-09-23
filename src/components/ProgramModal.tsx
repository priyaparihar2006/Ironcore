import React, { useState } from 'react';
import { WorkoutProgram } from '../types';
import { X, Clock, Calendar, Flame, Star, CheckCircle2, Dumbbell, Sparkles, ArrowRight } from 'lucide-react';

interface ProgramModalProps {
  program: WorkoutProgram | null;
  onClose: () => void;
  onEnroll: (program: WorkoutProgram) => void;
}

export const ProgramModal: React.FC<ProgramModalProps> = ({ program, onClose, onEnroll }) => {
  const [enrolled, setEnrolled] = useState(false);

  if (!program) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-lg bg-white border border-[var(--color-border-main)]/80 shadow-sm overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header */}
        <div className="relative h-56 sm:h-64 w-full shrink-0 bg-neutral-900">
          <img
            src={program.image}
            alt={program.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[var(--color-text-main)]">
                {program.level}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">
                {program.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold ml-auto">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{program.rating}</span>
                <span className="text-white/70 font-normal">({program.reviewsCount} reviews)</span>
              </div>
            </div>

            <h3 className="text-3xl font-bold">{program.title}</h3>
            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-1">Led by {program.trainer} • {program.trainerRole}</p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-8 sm:p-8 overflow-y-auto space-y-6 flex-1 text-neutral-700">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-[var(--color-brand-bg)] border border-neutral-100 text-center text-xs">
            <div>
              <span className="text-neutral-600 text-xs uppercase font-semibold block">Duration</span>
              <span className="font-bold text-[var(--color-text-main)]">{program.duration}</span>
            </div>
            <div>
              <span className="text-neutral-600 text-xs uppercase font-semibold block">Frequency</span>
              <span className="font-bold text-[var(--color-text-main)]">{program.frequency}</span>
            </div>
            <div>
              <span className="text-neutral-600 text-xs uppercase font-semibold block">Burn Rate</span>
              <span className="font-bold text-orange-600">{program.caloriesBurn}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">About the Program</h4>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {program.description}
            </p>
          </div>

          {/* Highlights */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">Key Highlights</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {program.highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-brand-bg)]/70 text-purple-950 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Syllabus Split */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">Sample Weekly Routine Split</h4>
            <div className="space-y-3">
              {program.schedule.map((dayPlan, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-[var(--color-border-main)] shadow-sm/80 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--color-text-main)] bg-[var(--color-brand-bg)] px-2.5 py-0.5 rounded-md">
                      {dayPlan.day}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text-main)]">{dayPlan.focus}</span>
                  </div>
                  <ul className="text-xs text-neutral-600 space-y-1 pl-1">
                    {dayPlan.exercises.map((ex, exIdx) => (
                      <li key={exIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-neutral-100 bg-[var(--color-brand-bg)] flex items-center justify-between">
          <div className="text-xs">
            <span className="text-neutral-600 block">Access included with</span>
            <strong className="text-[var(--color-text-main)]">Pro & Elite Memberships</strong>
          </div>

          {enrolled ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Enrolled in My Schedule!</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setEnrolled(true);
                onEnroll(program);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-black hover:bg-neutral-800 transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Enroll In This Program</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
