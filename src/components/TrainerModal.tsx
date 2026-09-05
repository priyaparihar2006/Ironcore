import React, { useState } from 'react';
import { Trainer } from '../types';
import { X, Star, Award, Calendar, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

interface TrainerModalProps {
  trainer: Trainer | null;
  onClose: () => void;
}

export const TrainerModal: React.FC<TrainerModalProps> = ({ trainer, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  if (!trainer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[32px] bg-white border border-neutral-200/80 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Avatar & Background */}
        <div className="relative h-48 w-full bg-gradient-to-tr from-[#080512] to-purple-900 p-6 flex items-end">
          <div className="relative z-10 flex items-center gap-4">
            <img
              src={trainer.image}
              alt={trainer.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
            />
            <div className="text-white">
              <h3 className="text-xl font-bold">{trainer.name}</h3>
              <p className="text-xs text-purple-200">{trainer.specialty}</p>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {trainer.rating}
                </span>
                <span className="text-white/60">({trainer.reviewsCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5 text-xs sm:text-sm">
          
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Coach Bio</h4>
            <p className="text-neutral-600 leading-relaxed">
              {trainer.bio}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">Certifications & Credentials</h4>
            <div className="space-y-1.5">
              {trainer.certifications.map((cert, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 text-neutral-800 text-xs">
                  <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">Available 1-on-1 Consultation Slots</h4>
            <div className="grid grid-cols-2 gap-2">
              {trainer.availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                    selectedSlot === slot
                      ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {isBooked ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <div className="font-bold">Session Booked!</div>
              <p className="text-xs text-emerald-700">Coach {trainer.name} has reserved {selectedSlot} for your session.</p>
            </div>
          ) : (
            <button
              onClick={() => {
                if (selectedSlot) setIsBooked(true);
              }}
              disabled={!selectedSlot}
              className={`w-full py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                selectedSlot
                  ? 'bg-[#080512] text-white hover:bg-neutral-800 shadow-md'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <span>{selectedSlot ? `Book Consultation (${selectedSlot})` : 'Select a Slot Above'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
