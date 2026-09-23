import { ValidationInput, useFormValidation } from '../components/ValidationInput';
import { emailError } from '../lib/validation';
import React, { useState } from 'react';
import { Dumbbell, ArrowRight, CheckCircle2, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const validation = useFormValidation({ email: emailError(email) });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.validate()) return;
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full px-4 md:px-8 lg:px-12 pt-16 pb-12 bg-white border-t border-[var(--color-border-main)]/80">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-[var(--color-border-main)]/70">
          
          {/* Brand Info (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-xs">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              <span className="text-2xl font-bold tracking-tighter text-[var(--color-text-main)]">
                IronCore
              </span>
            </div>

            <p className="text-sm text-neutral-600 leading-relaxed max-w-sm">
              The high-end fitness platform combining elite athletic coaching, real-time biometric telemetry, and modern facility management.
            </p>

            <div className="pt-2 space-y-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>Flagship Hub: 404 Indiranagar 100ft Rd, Bangalore</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>+91 (80) 4122-IRON (4766)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>concierge@ironcorefit.com</span>
              </div>
            </div>
          </div>

          {/* Navigation Links (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)]">Navigation</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><a href="#" className="hover:text-[var(--color-text-main)] transition-colors">Home</a></li>
              <li><a href="#dashboard" className="hover:text-[var(--color-text-main)] transition-colors">OS Dashboard</a></li>
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">Programs</a></li>
              <li><a href="#features" className="hover:text-[var(--color-text-main)] transition-colors">Platform Features</a></li>
              <li><a href="#progress" className="hover:text-[var(--color-text-main)] transition-colors">Results & Metrics</a></li>
              <li><a href="#pricing" className="hover:text-[var(--color-text-main)] transition-colors">Memberships</a></li>
            </ul>
          </div>

          {/* Programs Links (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)]">Programs</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">Strength Training</a></li>
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">Muscle Building</a></li>
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">Weight Loss & Shred</a></li>
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">HIIT & Burn</a></li>
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">Cardio & VO2 Max</a></li>
              <li><a href="#programs" className="hover:text-[var(--color-text-main)] transition-colors">Functional Movement</a></li>
            </ul>
          </div>

          {/* Company & Support + Newsletter (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)]">Stay in The IronCore Loop</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Get weekly science-backed training protocols, nutrition breakdowns, and priority event access.
            </p>

            <form noValidate onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                <ValidationInput {...validation.field('email', 'Email address')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-full text-xs bg-[var(--color-brand-bg)] border border-[var(--color-border-main)] text-[var(--color-text-main)] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                maxLength={254} autoComplete="email" />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold hover:bg-neutral-800 transition-colors shrink-0"
                >
                  Join
                </button>
              </div>
              {subscribed && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Welcome to the team! Check your inbox.</span>
                </div>
              )}
            </form>

            <div className="pt-2">
              <span className="text-xs font-semibold text-neutral-600 block mb-2">Connect with Us</span>
              <div className="flex items-center gap-2.5">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-purple-100 hover:text-[var(--color-text-main)] text-neutral-700 flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-purple-100 hover:text-[var(--color-text-main)] text-neutral-700 flex items-center justify-center transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-purple-100 hover:text-[var(--color-text-main)] text-neutral-700 flex items-center justify-center transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-purple-100 hover:text-[var(--color-text-main)] text-neutral-700 flex items-center justify-center transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} IronCore Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Security Standards</a>
            <a href="#" className="hover:underline">Club Regulations</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
