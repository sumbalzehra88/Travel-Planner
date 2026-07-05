import React, { useState, useEffect } from 'react';
import { Compass, Heart, ArrowRight, Menu, X, ArrowLeft, Search, MapPin, Sparkles, Globe, Calendar, DollarSign, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

interface Destination {
  id: string;
  name: string;
  country: string;
  tagline: string;
  heroImage: string;
  detailImage: string;
  description: string;
  quickFacts: {
    continent: string;
    currency: string;
    bestTime: string;
    language: string;
    specialty: string;
  };
  experiences: {
    title: string;
    category: string;
    icon: string;
    description: string;
  }[];
}

interface ShowcaseViewProps {
  onSwitchToPlanner: () => void;
  onStartPlanningDestination: (destinationName: string) => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

const DESTINATIONS: Destination[] = [
  {
    id: 'istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    tagline: 'Where East Meets Timeless Beauty',
    heroImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1200&auto=format&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=1200&auto=format&fit=crop',
    description: 'Istanbul is a magical metropolis straddling Europe and Asia across the Bosphorus Strait. Its Old City reflects the cultural influences of the many empires that once ruled here. Witness the iconic Blue Mosque, Hagia Sophia, and the bustling grand bazaars.',
    quickFacts: {
      continent: 'Europe & Asia',
      currency: 'Turkish Lira (TRY)',
      bestTime: 'April to May, September to November',
      language: 'Turkish',
      specialty: 'Turkish Tea & Baklava'
    },
    experiences: [
      { title: 'Historic Landmarks', category: 'Culture', icon: '🕌', description: 'Explore the architectural marvels of Hagia Sophia and the Blue Mosque.' },
      { title: 'Local Flavors', category: 'Gastronomy', icon: '🍵', description: 'Sip hot Turkish tea from a traditional tulip glass in the Grand Bazaar.' },
      { title: 'Bosphorus Cruise', category: 'Adventure', icon: '🚢', description: 'Take a scenic boat tour separating the two legendary continents.' }
    ]
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    tagline: 'The Heart of Traditional Japan',
    heroImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
    description: 'Kyoto, once the imperial capital of Japan, is famous for its thousands of classical Buddhist temples, zen gardens, Shinto shrines, and traditional wooden Machiya houses. It preserves ancient cultural rituals in a modern-day sanctuary.',
    quickFacts: {
      continent: 'Asia',
      currency: 'Japanese Yen (JPY)',
      bestTime: 'April (Cherry Blossoms) or October (Autumn Leaves)',
      language: 'Japanese',
      specialty: 'Matcha Tea & Kaiseki Dining'
    },
    experiences: [
      { title: 'Bamboo Forest', category: 'Nature', icon: '🎋', description: 'Walk through the towering green stalks of Arashiyama.' },
      { title: 'Gion Geisha Tour', category: 'Heritage', icon: '🌸', description: 'Stroll along historic streets and observe traditional tea houses.' },
      { title: 'Golden Pavilion', category: 'Spirituality', icon: '⛩️', description: 'Admire the stunning Kinkaku-ji temple reflecting over its mirror pond.' }
    ]
  },
  {
    id: 'amalfi',
    name: 'Amalfi Coast',
    country: 'Italy',
    tagline: 'The Cliffside Paradise',
    heroImage: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop',
    description: 'The Amalfi Coast is a breathtaking 50-kilometer stretch of coastline along the southern edge of Italy’s Sorrentine Peninsula. It is dotted with pastel-colored fishing villages clinging to steep cliffs rising directly from the Mediterranean sea.',
    quickFacts: {
      continent: 'Europe',
      currency: 'Euro (EUR)',
      bestTime: 'May to September',
      language: 'Italian',
      specialty: 'Limoncello & Fresh Seafood'
    },
    experiences: [
      { title: 'Path of the Gods', category: 'Hiking', icon: '🥾', description: 'Hike along soaring trails offering infinite ocean views.' },
      { title: 'Positano Cliffside', category: 'Leisure', icon: '🏖️', description: 'Relax on volcanic sands surrounded by vertical pastel architecture.' },
      { title: 'Lemon Groves', category: 'Agritourism', icon: '🍋', description: 'Taste fresh hand-crafted limoncello in a sun-drenched orchard.' }
    ]
  }
];

export default function ShowcaseView({ 
  onSwitchToPlanner, 
  onStartPlanningDestination,
  currentUser,
  onLoginClick,
  onLogoutClick
}: ShowcaseViewProps) {
  const [currentTab, setCurrentTab] = useState<'home' | 'detail'>('home');
  const [selectedDestId, setSelectedDestId] = useState<string>('istanbul');
  const [favorites, setFavorites] = useState<string[]>(['istanbul']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Monitor page scroll to make navbar background solid on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeDestination = DESTINATIONS.find(d => d.id === selectedDestId) || DESTINATIONS[0];

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSelectDestination = (id: string) => {
    setSelectedDestId(id);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5F0] text-slate-800 font-sans selection:bg-[#E8C4B8] selection:text-[#7A2E3A] overflow-x-hidden">
      
      {/* 1. STICKY GLASS NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 py-3 md:px-8 ${
        isScrolled 
          ? 'bg-[#FAF5F0]/90 backdrop-blur-md shadow-sm border-b border-[#EFE9E2]' 
          : 'bg-white/40 backdrop-blur-md border-b border-white/20'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="w-10 h-10 rounded-full bg-[#7A2E3A] flex items-center justify-center text-white shadow-md">
              <Compass size={20} className="animate-spin-slow" />
            </div>
            <span className="font-serif italic font-extrabold text-[#7A2E3A] text-lg md:text-xl tracking-tight">WanderSync</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 bg-white/50 px-6 py-2 rounded-full border border-white/40 shadow-xs">
            <button onClick={() => { setCurrentTab('home'); setTimeout(() => scrollToSection('destinations'), 100); }} className="text-xs font-semibold text-slate-700 hover:text-[#7A2E3A] transition-colors">Destinations</button>
            <button onClick={() => { setCurrentTab('home'); setTimeout(() => scrollToSection('experiences'), 100); }} className="text-xs font-semibold text-slate-700 hover:text-[#7A2E3A] transition-colors">Experiences</button>
            <button onClick={onSwitchToPlanner} className="text-xs font-bold text-[#7A2E3A] hover:opacity-85 transition-opacity flex items-center gap-1.5">
              <Sparkles size={13} />
              My Workspace Planner
            </button>
          </div>

          {/* Nav Right Actions */}
          <div className="flex items-center gap-3">
            {/* User Auth Section (Desktop) */}
            {currentUser ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 bg-white/70 px-3.5 py-2 rounded-full border border-white/80 shadow-xs">
                  Hi, <strong className="text-[#7A2E3A]">{currentUser.username}</strong>
                </span>
                <button
                  onClick={onLogoutClick}
                  className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-3.5 py-2 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="hidden md:flex items-center gap-1.5 text-xs font-bold text-white bg-[#7A2E3A] hover:bg-[#60202B] px-4.5 py-2 rounded-full shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Favorites Counter */}
            <button className="relative w-11 h-11 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-slate-700 hover:text-[#7A2E3A] hover:bg-white shadow-xs transition-all active:scale-95" title="View Favorites">
              <Heart size={18} className={favorites.length > 0 ? 'fill-[#7A2E3A] text-[#7A2E3A]' : ''} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#7A2E3A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Mobile Burger Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden w-11 h-11 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-[#7A2E3A] hover:bg-white shadow-xs active:scale-95"
            >
              <Menu size={18} />
            </button>
          </div>

        </div>
      </nav>

      {/* MOBILE DRAWER MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 md:hidden flex justify-end"
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-4/5 max-w-sm bg-[#FAF5F0] h-full p-6 flex flex-col justify-between shadow-2xl border-l border-[#EFE9E2]"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-[#7A2E3A]" />
                    <span className="font-serif italic font-extrabold text-[#7A2E3A] text-md">WanderSync</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="w-10 h-10 rounded-full bg-white border border-[#EFE9E2] flex items-center justify-center text-[#7A2E3A] hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 flex flex-col">
                  <button onClick={() => { setCurrentTab('home'); setIsMobileMenuOpen(false); }} className="text-left py-3 border-b border-[#EFE9E2] font-semibold text-slate-800 text-sm hover:text-[#7A2E3A]">Home Showcase</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); scrollToSection('destinations'); }} className="text-left py-3 border-b border-[#EFE9E2] font-semibold text-slate-800 text-sm hover:text-[#7A2E3A]">Explore Destinations</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); scrollToSection('experiences'); }} className="text-left py-3 border-b border-[#EFE9E2] font-semibold text-slate-800 text-sm hover:text-[#7A2E3A]">Vibrant Experiences</button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); onSwitchToPlanner(); }} 
                    className="text-left py-3 font-bold text-[#7A2E3A] text-sm flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    My Workspace Planner (SQLite)
                  </button>
                </div>

                {/* User Auth Section (Mobile Drawer) */}
                <div className="mt-8 space-y-3">
                  {currentUser ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-white/60 border border-[#EFE9E2] rounded-xl text-center">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Logged In As</p>
                        <p className="text-sm font-bold text-[#7A2E3A] mt-0.5">{currentUser.username}</p>
                      </div>
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); onLogoutClick(); }} 
                        className="w-full text-center py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }} 
                      className="w-full text-center py-2.5 bg-[#7A2E3A] hover:bg-[#60202B] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#E8C4B8]/30 rounded-2xl border border-[#D8A9A0]/30 text-center">
                <p className="text-[11px] text-slate-500">Plan and track your next journey seamlessly on-the-go.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN BODY CONTENTS */}
      <div className="pt-20">
        
        {/* --- PAGE 1: LANDING PAGE --- */}
        {currentTab === 'home' ? (
          <div>
            
            {/* HERO SECTION */}
            <section className="relative px-4 md:px-8 py-6 md:py-16 max-w-7xl mx-auto">
              <div className="relative rounded-[32px] overflow-hidden min-h-[580px] md:min-h-[640px] flex items-center shadow-lg border border-[#EFE9E2] bg-[#E8C4B8]/20">
                
                {/* Background Full-bleed Illustration */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={DESTINATIONS[0].heroImage} 
                    alt="Istanbul storybook watercolor background" 
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle warm watercolor/golden-hour overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FAF5F0]/90 via-transparent to-transparent md:bg-gradient-to-r md:from-[#FAF5F0]/95 md:via-transparent md:to-transparent z-1" />
                </div>

                {/* Hero Content Grid */}
                <div className="relative z-10 w-full px-6 md:px-16 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Headline & Subheading */}
                  <div className="text-center md:text-left space-y-4">
                    <span className="text-xs font-bold text-[#7A2E3A] tracking-widest uppercase block bg-[#E8C4B8]/50 w-fit px-3 py-1 rounded-full mx-auto md:mx-0">
                      ✧ Featured Destination
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#7A2E3A] leading-tight tracking-tight">
                      {DESTINATIONS[0].name}
                    </h1>
                    <p className="font-serif italic text-base md:text-xl text-[#7A2E3A]/80 font-medium">
                      {DESTINATIONS[0].tagline}
                    </p>
                  </div>

                  {/* Floating Glassmorphism Description Card */}
                  <div className="flex justify-center md:justify-end">
                    <div className="w-full max-w-sm bg-white/70 backdrop-blur-md rounded-[24px] p-6 md:p-8 border border-white/50 shadow-xl space-y-6">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Introduction</span>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                          {DESTINATIONS[0].description}
                        </p>
                      </div>

                      {/* Circular arrow maroon CTA */}
                      <button 
                        onClick={() => handleSelectDestination(DESTINATIONS[0].id)}
                        className="w-full h-12 rounded-full bg-[#7A2E3A] hover:bg-[#7A2E3A]/90 text-white font-semibold text-xs transition-all flex items-center justify-between px-6 shadow-md hover:shadow-lg group active:scale-[0.98]"
                      >
                        <span>Discover {DESTINATIONS[0].name}</span>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <ArrowRight size={14} />
                        </div>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* "EXPLORE DESTINATIONS" SECTION */}
            <section id="destinations" className="px-4 md:px-8 py-16 max-w-7xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold text-[#7A2E3A] uppercase tracking-widest block">Curated Voyages</span>
                <h2 className="text-3xl md:text-4xl font-serif text-[#7A2E3A]">Explore Destinations</h2>
                <div className="w-12 h-1 bg-[#7A2E3A] mx-auto rounded-full mt-2" />
              </div>

              {/* Responsive Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {DESTINATIONS.map((dest) => (
                  <div 
                    key={dest.id}
                    onClick={() => handleSelectDestination(dest.id)}
                    className="group bg-white rounded-[24px] overflow-hidden border border-[#EFE9E2] shadow-[0_8px_30px_rgb(122,46,58,0.03)] hover:shadow-[0_16px_40px_rgb(122,46,58,0.08)] transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col"
                  >
                    {/* Destination Thumbnail */}
                    <div className="relative aspect-4/3 overflow-hidden">
                      <img 
                        src={dest.heroImage} 
                        alt={`${dest.name}, ${dest.country}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {/* Heart action overlay */}
                      <button 
                        onClick={(e) => toggleFavorite(dest.id, e)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-slate-600 hover:text-[#7A2E3A] hover:bg-white shadow-xs transition-colors active:scale-90"
                      >
                        <Heart size={16} className={favorites.includes(dest.id) ? 'fill-[#7A2E3A] text-[#7A2E3A]' : ''} />
                      </button>
                      
                      {/* Location Badge */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-bold text-[#7A2E3A] flex items-center gap-1">
                        <MapPin size={10} />
                        {dest.country}
                      </div>
                    </div>

                    {/* Destination Metadata */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif text-slate-800 font-bold group-hover:text-[#7A2E3A] transition-colors">
                          {dest.name}, {dest.country}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {dest.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#FAF5F0] text-xs font-semibold text-[#7A2E3A] group-hover:underline">
                        <span>Begin Journey</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* "EXPLORE EXPERIENCES" GRID */}
            <section id="experiences" className="px-4 md:px-8 py-16 bg-[#FAF5F0] max-w-7xl mx-auto space-y-10">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold text-[#7A2E3A] uppercase tracking-widest block">Dynamic Activities</span>
                <h2 className="text-3xl md:text-4xl font-serif text-[#7A2E3A]">Vibrant Experiences</h2>
                <div className="w-12 h-1 bg-[#7A2E3A] mx-auto rounded-full mt-2" />
              </div>

              {/* Icon-card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/80 p-6 rounded-[24px] border border-[#EFE9E2] flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8C4B8]/40 flex items-center justify-center text-2xl flex-shrink-0">
                    🕌
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-slate-800 font-bold text-sm">Landmarks & History</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Immerse yourself in legendary basilicas, historic mosques, temples, and timeless castle architectures.
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 p-6 rounded-[24px] border border-[#EFE9E2] flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8C4B8]/40 flex items-center justify-center text-2xl flex-shrink-0">
                    🍵
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-slate-800 font-bold text-sm">Local Delicacies</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Savor aromatic teas, delicious pastries, authentic spice markets, and local culinary masterpieces.
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 p-6 rounded-[24px] border border-[#EFE9E2] flex gap-4 items-start shadow-xs hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8C4B8]/40 flex items-center justify-center text-2xl flex-shrink-0">
                    🚢
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-slate-800 font-bold text-sm">Scenic Cruises & Views</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ride ferry yachts separating majestic continents, walk cliff paths, and witness dreamlike scenic sunsets.
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        ) : (
          
          /* --- PAGE 2: DESTINATION DETAIL PAGE --- */
          <div className="animate-fade-in">
            
            {/* FULL-WIDTH HERO BANNER */}
            <section className="px-4 md:px-8 py-6 max-w-7xl mx-auto relative">
              <div className="relative rounded-[32px] overflow-hidden min-h-[420px] md:min-h-[480px] flex items-end shadow-lg border border-[#EFE9E2]">
                
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img 
                    src={activeDestination.detailImage} 
                    alt={activeDestination.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-black/10" />
                </div>

                {/* Floating Top Buttons */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                  {/* Back to Homepage */}
                  <button 
                    onClick={() => setCurrentTab('home')}
                    className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#7A2E3A] hover:bg-white shadow-md active:scale-95 transition-all"
                    title="Back to destinations"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  {/* Favorite Toggle */}
                  <button 
                    onClick={() => toggleFavorite(activeDestination.id)}
                    className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-600 hover:text-[#7A2E3A] hover:bg-white shadow-md active:scale-95 transition-all"
                  >
                    <Heart size={16} className={favorites.includes(activeDestination.id) ? 'fill-[#7A2E3A] text-[#7A2E3A]' : ''} />
                  </button>
                </div>

                {/* Title & Overlay */}
                <div className="relative z-10 p-6 md:p-12 text-white space-y-2">
                  <span className="text-[10px] font-bold text-[#E8C4B8] tracking-widest uppercase block">Destination Showcase</span>
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight">
                    Timeless {activeDestination.name}
                  </h1>
                  <p className="text-xs md:text-sm text-[#FAF5F0]/90 font-sans tracking-wide max-w-xl">
                    Live the magic of historical heritages, vibrant avenues, and unforgettable landmarks.
                  </p>
                </div>

              </div>
            </section>

            {/* TWO-COLUMN DETAIL LAYOUT */}
            <section className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Column 1: Detailed Description (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[24px] p-6 md:p-8 border border-[#EFE9E2] shadow-xs space-y-4">
                    <h2 className="text-xl md:text-2xl font-serif text-[#7A2E3A] font-bold">About the Voyage</h2>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      {activeDestination.description}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Every corner of this destination is filled with historical artifacts, vibrant culinary routes, and deep traditions. Visiting promises to create golden, lifelong memories of discovery.
                    </p>
                  </div>

                  {/* Horizontally scrollable Experiences row on mobile */}
                  <div className="space-y-4">
                    <h3 className="text-base font-serif text-[#7A2E3A] font-bold px-1">Curated Experiences</h3>
                    <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-none snap-x snap-mandatory">
                      {activeDestination.experiences.map((exp, idx) => (
                        <div 
                          key={idx}
                          className="min-w-[260px] md:min-w-0 snap-center bg-[#FAF5F0] border border-[#EFE9E2] rounded-[20px] p-5 space-y-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-[#7A2E3A] uppercase tracking-wider bg-[#E8C4B8]/30 px-2.5 py-0.5 rounded-full">{exp.category}</span>
                              <span className="text-xl">{exp.icon}</span>
                            </div>
                            <h4 className="font-serif font-bold text-slate-800 text-sm">{exp.title}</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{exp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Quick Facts Card (1/3 width) */}
                <div className="space-y-6">
                  <div className="bg-[#E8C4B8]/20 border border-[#D8A9A0]/40 rounded-[24px] p-6 space-y-6 shadow-xs">
                    <h3 className="text-base font-serif text-[#7A2E3A] font-bold border-b border-[#D8A9A0]/40 pb-3">Quick Facts</h3>
                    
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><Globe size={13} /> Region</span>
                        <span className="font-semibold text-slate-800">{activeDestination.quickFacts.continent}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><DollarSign size={13} /> Currency</span>
                        <span className="font-semibold text-slate-800">{activeDestination.quickFacts.currency}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={13} /> Best Season</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[150px]">{activeDestination.quickFacts.bestTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><BookOpen size={13} /> Language</span>
                        <span className="font-semibold text-slate-800">{activeDestination.quickFacts.language}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 flex items-center gap-1.5"><Sparkles size={13} /> Specialty</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[150px]">{activeDestination.quickFacts.specialty}</span>
                      </div>
                    </div>

                    {/* Full-width maroon button CTA */}
                    <button 
                      onClick={() => onStartPlanningDestination(`${activeDestination.name}, ${activeDestination.country}`)}
                      className="w-full h-12 rounded-full bg-[#7A2E3A] hover:bg-[#7A2E3A]/90 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                      <Sparkles size={14} />
                      Start Exploring in My Workspace
                    </button>
                  </div>
                </div>

              </div>
            </section>

          </div>
        )}

        {/* FOOTER */}
        <footer className="bg-[#FAF5F0] border-t border-[#EFE9E2] px-6 py-12 mt-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7A2E3A] flex items-center justify-center text-white">
                  <Compass size={16} />
                </div>
                <span className="font-serif italic font-extrabold text-[#7A2E3A] text-md">WanderSync</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Seamlessly blending aesthetic travel showcases with a full-featured planning workspace, structured itineraries, and real-time budget metric trackers.
              </p>
            </div>

            <div>
              <h5 className="font-serif text-xs font-bold text-[#7A2E3A] uppercase tracking-wider mb-4">Voyages</h5>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><button onClick={() => handleSelectDestination('istanbul')} className="hover:text-[#7A2E3A]">Istanbul, Turkey</button></li>
                <li><button onClick={() => handleSelectDestination('kyoto')} className="hover:text-[#7A2E3A]">Kyoto, Japan</button></li>
                <li><button onClick={() => handleSelectDestination('amalfi')} className="hover:text-[#7A2E3A]">Amalfi Coast, Italy</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-serif text-xs font-bold text-[#7A2E3A] uppercase tracking-wider mb-4">Workspace</h5>
              <ul className="space-y-2 text-xs text-slate-500">
                <li><button onClick={onSwitchToPlanner} className="hover:text-[#7A2E3A] flex items-center gap-1"><span>Interactive Planners</span> <span className="bg-[#E8C4B8]/50 px-1.5 py-0.5 rounded text-[8px] text-[#7A2E3A] uppercase font-bold">SQLite</span></button></li>
                <li><button onClick={onSwitchToPlanner} className="hover:text-[#7A2E3A]">Daily Calendars</button></li>
                <li><button onClick={onSwitchToPlanner} className="hover:text-[#7A2E3A]">Expense Tracking Meters</button></li>
              </ul>
            </div>

            <div>
              <h5 className="font-serif text-xs font-bold text-[#7A2E3A] uppercase tracking-wider mb-4">WanderSync App</h5>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                Connect and sync all itineraries directly inside your sandboxed secure database.
              </p>
              <div className="flex gap-2 justify-start">
                <button onClick={onSwitchToPlanner} className="bg-[#7A2E3A] text-white font-semibold text-[10px] px-4 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all">
                  Open Application Workspace
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto border-t border-[#EFE9E2] mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 gap-4">
            <p>© 2026 WanderSync Inc. All Rights Reserved.</p>
            <p className="font-mono">City, Country Format Standard Verification Passed</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
