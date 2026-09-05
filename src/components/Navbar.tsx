import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, User, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenTrial: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenTrial }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Programs', href: '#programs' },
    { label: 'Features', href: '#features' },
    { label: 'Progress', href: '#progress' },
    { label: 'Trainers', href: '#trainers' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Reviews', href: '#testimonials' },
  ];

  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'TRAINER') return '/trainer';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      <nav
        className={`w-full max-w-7xl mx-auto h-20 sm:h-24 px-6 sm:px-10 lg:px-12 flex items-center justify-between transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F8F7FA]/90 backdrop-blur-xl border-b border-neutral-200/70 shadow-xs'
            : 'bg-transparent'
        }`}
      >
        {/* Brand Logo - Minimal Editorial Icon */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group cursor-pointer"
          id="nav-logo"
        >
          <div className="w-8 h-8 bg-[#080512] rounded-lg flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-2xl font-black tracking-tighter text-[#080512]">
            IronCore
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 xl:gap-10 text-sm font-semibold">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#080512] opacity-70 hover:opacity-100 transition-opacity tracking-tight"
            >
              {link.label}
            </a>
          ))}
          {user && (
            <Link
              to={getDashboardPath()}
              className="text-purple-700 font-bold hover:text-purple-900 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Portal Dashboard</span>
            </Link>
          )}
        </div>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={getDashboardPath()}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-white border border-neutral-200/80 shadow-xs hover:bg-neutral-50 transition-all"
              >
                <img
                  src={
                    user.avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
                  }
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <span className="text-xs font-bold text-[#080512]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2.5 rounded-full border border-neutral-200 text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                id="nav-signin-btn"
                className="text-sm font-semibold text-[#080512] opacity-70 hover:opacity-100 transition-opacity"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                id="nav-free-trial-btn"
                className="bg-[#080512] text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl shadow-black/10 hover:bg-neutral-800 transition-all duration-200 active:scale-95"
              >
                Join IronCore
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {user ? (
            <Link
              to={getDashboardPath()}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#080512]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="sm:hidden px-4 py-2 rounded-full text-xs font-bold text-white bg-[#080512]"
            >
              Join
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-700 hover:text-[#080512] hover:bg-neutral-100 transition-colors"
            aria-label="Toggle navigation menu"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mx-4 my-2 p-5 rounded-[24px] bg-white/95 backdrop-blur-xl border border-neutral-200 shadow-xl flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-bold text-neutral-800 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 mt-2 border-t border-neutral-100 space-y-2">
            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-bold rounded-full bg-[#080512] text-white flex items-center justify-center gap-2 shadow-lg"
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-300" />
                  <span>Open {user.role} Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-[#080512] hover:bg-neutral-100 rounded-xl block"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-bold rounded-full bg-[#080512] text-white flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Start 14-Day Trial</span>
                  <ArrowRight className="w-4 h-4 text-purple-300" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
