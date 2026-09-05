import React from 'react';
import { TESTIMONIALS } from '../data/mockData';
import { Star, Quote, Sparkles, CheckCircle2 } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-xs font-semibold text-purple-800 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Community Stories</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#080512] tracking-tight mb-4">
            Built for Dedicated People
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            From beginners stepping into the weight room for the first time to competitive athletes setting all-time PRs.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="relative rounded-[28px] bg-white border border-neutral-200/80 p-7 sm:p-8 shadow-xs hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating & Quote Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex text-amber-400 gap-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-purple-200" />
                </div>

                {/* Member Quote */}
                <p className="text-sm sm:text-base text-neutral-700 leading-relaxed mb-6 font-normal">
                  "{item.quote}"
                </p>

                {/* Achievement Highlight Tag */}
                <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>{item.achievement}</span>
                </div>
              </div>

              {/* Author Info */}
              <div className="pt-5 border-t border-neutral-100 flex items-center gap-3.5">
                <img
                  src={item.avatar}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#080512]">{item.name}</h4>
                  <p className="text-xs text-neutral-600">{item.role} • {item.location}</p>
                  <span className="text-[10px] text-purple-700 font-semibold">{item.duration}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
