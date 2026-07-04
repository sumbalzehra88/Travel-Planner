import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, MapPin, Sparkles, X, Compass, Globe, Info, Bookmark, Map } from 'lucide-react';
import { ItineraryItem, ExpenseItem } from '../types';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    trip: { name: string; destination: string; start_date: string; end_date: string },
    presetItems?: {
      itineraries: Omit<ItineraryItem, 'id' | 'trip_id'>[];
      expenses: Omit<ExpenseItem, 'id' | 'trip_id'>[];
    }
  ) => Promise<void>;
  defaultDestination?: string;
}

// Preset types
type PresetKey = 'custom' | 'kyoto' | 'rome' | 'paris';

interface PresetData {
  name: string;
  destination: string;
  durationDays: number;
  description: string;
  colorTheme: {
    accent: string;
    bg: string;
  };
  itineraries: { dayOffset: number; time: string; activity: string; notes: string }[];
  expenses: { description: string; amount: number; category: string; dayOffset: number }[];
}

export default function NewTripModal({ isOpen, onClose, onSubmit, defaultDestination }: NewTripModalProps) {
  const [activePreset, setActivePreset] = useState<PresetKey>('custom');
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to get formatted date string with offset days
  const getOffsetDateString = (baseDateStr: string, offsetDays: number): string => {
    if (!baseDateStr) return '';
    const date = new Date(baseDateStr);
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
  };

  // Predefined Curated Journey Presets
  const presets: Record<PresetKey, PresetData | null> = {
    custom: null,
    kyoto: {
      name: 'Zen Gardens & Ancient Temples',
      destination: 'Kyoto, Japan',
      durationDays: 3,
      description: 'Experience moss-covered pathways, golden pavilions reflecting on ponds, and centuries of graceful heritage.',
      colorTheme: { accent: '#15803D', bg: '#F0FDF4' },
      itineraries: [
        { dayOffset: 0, time: '09:00', activity: 'Arrival at Kyoto Station', notes: 'Collect passes and catch local train to hotel' },
        { dayOffset: 0, time: '14:00', activity: 'Check-in at Ryokan Sawanoya', notes: 'Enjoy traditional welcome tea and seasonal wagashi' },
        { dayOffset: 0, time: '18:30', activity: 'Kaiseki Dinner in Gion', notes: 'Indulge in an authentic multi-course Japanese dining experience' },
        { dayOffset: 1, time: '08:30', activity: 'Kinkaku-ji (Golden Pavilion)', notes: 'Arrive early to capture the golden temple reflecting on mirror pond' },
        { dayOffset: 1, time: '11:30', activity: 'Ryoan-ji Rock Garden', notes: 'Contemplate the famous 15 dry-landscape stones' },
        { dayOffset: 1, time: '15:00', activity: 'Arashiyama Bamboo Grove', notes: 'Enjoy a peaceful walk through the towering green stalks' },
        { dayOffset: 2, time: '07:00', activity: 'Fushimi Inari-Taisha Shrine', notes: 'Hike through thousands of red Torii gates to beat the midday heat' },
        { dayOffset: 2, time: '13:00', activity: 'Kiyomizu-dera Temple', notes: 'Explore the historic wooden stage offering sweeping Kyoto views' },
        { dayOffset: 2, time: '17:00', activity: 'Tea Ceremony in Higashiyama', notes: 'Learn the graceful art of preparing whisked matcha tea' },
      ],
      expenses: [
        { description: 'Traditional Ryokan Stay', amount: 320, category: 'Lodging', dayOffset: 0 },
        { description: 'Gion Kaiseki Feast', amount: 120, category: 'Food', dayOffset: 0 },
        { description: 'Kyoto Temple Admissions', amount: 35, category: 'Activities', dayOffset: 1 },
        { description: 'Matcha Tea Ceremony Class', amount: 45, category: 'Activities', dayOffset: 2 },
        { description: 'Haruka Express & Metro Card', amount: 90, category: 'Transportation', dayOffset: 0 },
      ],
    },
    rome: {
      name: 'Imperial Ruins & Italian Osterias',
      destination: 'Rome, Italy',
      durationDays: 3,
      description: 'Cross the drawbridges of medieval history, standing inside grand arenas where history was carved in stone.',
      colorTheme: { accent: '#B45309', bg: '#FFFBEB' },
      itineraries: [
        { dayOffset: 0, time: '10:00', activity: 'Check-in at Hotel Pantheon', notes: 'Historic boutique residence steps away from the majestic dome' },
        { dayOffset: 0, time: '13:00', activity: 'Lunch at Osteria da Fortunata', notes: 'Taste hand-made strozzapreti prepared by hand in front of you' },
        { dayOffset: 0, time: '15:30', activity: 'Wander to Trevi Fountain', notes: 'Toss a coin into the fountain to guarantee a return visit to Rome' },
        { dayOffset: 1, time: '09:00', activity: 'Colosseum & Roman Forum Tour', notes: 'Guided tour exploring ancient Senate chambers and gladiator arenas' },
        { dayOffset: 1, time: '14:00', activity: 'Espresso at Sant’Eustachio', notes: 'Try Rome’s historic, frothy sweetened espresso' },
        { dayOffset: 1, time: '19:00', activity: 'Dinner in Trastevere', notes: 'Traditional Roman Cacio e Pepe at Da Enzo al 29' },
        { dayOffset: 2, time: '08:30', activity: 'Vatican Museums & Sistine Chapel', notes: 'Marvel at Michelangelo’s famous ceiling frescoes' },
        { dayOffset: 2, time: '13:30', activity: 'Pizza Bianca in Campo de’ Fiori', notes: 'Crispy, warm Roman pizza bread with rosemary and olive oil' },
        { dayOffset: 2, time: '16:00', activity: 'St. Peter’s Dome Climb', notes: 'Climb the steps for the ultimate panorama of St. Peter’s Square' },
      ],
      expenses: [
        { description: 'Skip-the-line Colosseum Tour', amount: 65, category: 'Activities', dayOffset: 1 },
        { description: 'Vatican Museum Pass', amount: 40, category: 'Activities', dayOffset: 2 },
        { description: 'Hotel Pantheon Stay (2 Nights)', amount: 280, category: 'Lodging', dayOffset: 0 },
        { description: 'Osteria Dinners & Gelato', amount: 110, category: 'Food', dayOffset: 0 },
        { description: 'Metro Pass & Taxi Transit', amount: 25, category: 'Transportation', dayOffset: 0 },
      ],
    },
    paris: {
      name: 'La Belle Époque Arts',
      destination: 'Paris, France',
      durationDays: 3,
      description: 'Stroll along wide tree-lined boulevards and dive into the legendary galleries of the worlds greatest art museums.',
      colorTheme: { accent: '#6D28D9', bg: '#F5F3FF' },
      itineraries: [
        { dayOffset: 0, time: '11:00', activity: 'Arrive at Gare du Nord', notes: 'Pick up weekly Navigo decouverte metro pass' },
        { dayOffset: 0, time: '14:30', activity: 'Check-in at Hotel Amour', notes: 'Literary themed boutique accommodation in Pigalle' },
        { dayOffset: 0, time: '16:00', activity: 'Sunset at Sacré-Cœur Basilica', notes: 'Climb the steps to watch sunset over the iconic zinc roofs' },
        { dayOffset: 1, time: '09:00', activity: 'Louvre Museum Masterpieces', notes: 'Seek out Winged Victory, Venus de Milo, and the Mona Lisa' },
        { dayOffset: 1, time: '13:30', activity: 'Lunch at Café de Flore', notes: 'Classic literary cafe ambiance in Saint-Germain-des-Prés' },
        { dayOffset: 1, time: '16:00', activity: 'Seine River Cruise', notes: 'Relax on a glass boat as lights reflect on Paris’ ancient bridges' },
        { dayOffset: 2, time: '09:30', activity: 'Musée d’Orsay Impressionists', notes: 'Gaze at masterworks in a converted majestic Beaux-Arts station' },
        { dayOffset: 2, time: '14:00', activity: 'Patisserie Tasting Walk', notes: 'Sample salted caramel macarons and freshly baked croissants' },
        { dayOffset: 2, time: '20:00', activity: 'Dinner at Bouillon Chartier', notes: 'Heritage Belle Époque dining hall with classic French culinary fare' },
      ],
      expenses: [
        { description: 'Museum Entry (Louvre & Orsay)', amount: 55, category: 'Activities', dayOffset: 1 },
        { description: 'Vedettes du Pont Neuf Cruise', amount: 22, category: 'Activities', dayOffset: 1 },
        { description: 'Macarons & Patisserie Tour', amount: 45, category: 'Food', dayOffset: 2 },
        { description: 'Café de Flore Lunch', amount: 35, category: 'Food', dayOffset: 1 },
        { description: 'Hotel Amour Stay (2 nights)', amount: 290, category: 'Lodging', dayOffset: 0 },
      ],
    },
  };

  // Whenever activePreset changes, fill standard fields or clear them
  useEffect(() => {
    const preset = presets[activePreset];
    if (preset) {
      setName(preset.name);
      setDestination(preset.destination);

      // Set start date to today, and end date dynamically based on duration
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);

      const computedEnd = getOffsetDateString(today, preset.durationDays - 1);
      setEndDate(computedEnd);
    } else {
      setName('');
      setDestination('');
      setStartDate('');
      setEndDate('');
    }
    setError('');
  }, [activePreset]);

  // Hook to handle pre-filling when opened from the Showcase view
  useEffect(() => {
    if (isOpen && defaultDestination) {
      const lowerDest = defaultDestination.toLowerCase();
      if (lowerDest.includes('kyoto')) {
        setActivePreset('kyoto');
      } else {
        setActivePreset('custom');
        setDestination(defaultDestination);
        const cityOnly = defaultDestination.split(',')[0].trim();
        setName(`My Dream Voyage to ${cityOnly}`);
        
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        
        // 3 days duration as default
        const date = new Date(today);
        date.setDate(date.getDate() + 2);
        setEndDate(date.toISOString().split('T')[0]);
      }
    } else if (isOpen && !defaultDestination) {
      setActivePreset('custom');
    }
  }, [isOpen, defaultDestination]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter a trip name.');
    if (!destination.trim()) return setError('Please enter a destination.');
    if (!startDate) return setError('Please choose a start date.');
    if (!endDate) return setError('Please choose an end date.');

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return setError('The start date cannot fall after the end date.');
    }

    try {
      setIsSubmitting(true);

      const preset = presets[activePreset];
      let presetItems = undefined;

      if (preset) {
        // Construct itineraries with calculated target dates/day indices
        const formattedItineraries: Omit<ItineraryItem, 'id' | 'trip_id'>[] = preset.itineraries.map((it) => ({
          day_index: it.dayOffset,
          time: it.time,
          activity: it.activity,
          notes: it.notes,
        }));

        // Construct expenses with calculated dates based on start_date
        const formattedExpenses: Omit<ExpenseItem, 'id' | 'trip_id'>[] = preset.expenses.map((exp) => ({
          description: exp.description,
          amount: exp.amount,
          category: exp.category,
          date: getOffsetDateString(startDate, exp.dayOffset),
        }));

        presetItems = {
          itineraries: formattedItineraries,
          expenses: formattedExpenses,
        };
      }

      await onSubmit(
        {
          name: name.trim(),
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
        },
        presetItems
      );

      // Reset
      setActivePreset('custom');
      setName('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-[#FCFAF8] w-full max-w-xl rounded-[2rem] shadow-2xl border border-[#EFE9E2] overflow-hidden relative font-sans">
        
        {/* Header decoration */}
        <div 
          className="h-1.5 w-full transition-all duration-300"
          style={{ 
            backgroundColor: activePreset !== 'custom' && presets[activePreset]
              ? presets[activePreset]?.colorTheme.accent 
              : '#A25E49' 
          }}
        />

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#EFE9E2]/60 bg-white">
          <div className="flex items-center gap-2.5">
            <Compass 
              size={20} 
              style={{ 
                color: activePreset !== 'custom' && presets[activePreset]
                  ? presets[activePreset]?.colorTheme.accent 
                  : '#A25E49' 
              }} 
            />
            <h3 className="font-serif italic font-bold text-slate-900 text-lg">
              {activePreset === 'custom' ? 'Plan a New Voyage' : 'Explore Curated Presets'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 transition-all"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preset Selector Rail */}
        <div className="px-8 pt-6 pb-2 grid grid-cols-4 gap-2 bg-white border-b border-[#EFE9E2]/30">
          <button
            type="button"
            onClick={() => setActivePreset('custom')}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activePreset === 'custom'
                ? 'border-[#A25E49] bg-[#A25E49]/10 text-[#A25E49]'
                : 'border-[#EFE9E2] bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Globe size={13} />
            <span>Blank Slate</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePreset('kyoto')}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activePreset === 'kyoto'
                ? 'border-[#15803D] bg-[#15803D]/10 text-[#15803D]'
                : 'border-[#EFE9E2] bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bookmark size={13} style={{ color: '#15803D' }} />
            <span>Kyoto Zen</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePreset('rome')}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activePreset === 'rome'
                ? 'border-[#B45309] bg-[#B45309]/10 text-[#B45309]'
                : 'border-[#EFE9E2] bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bookmark size={13} style={{ color: '#B45309' }} />
            <span>Rome Imperial</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePreset('paris')}
            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activePreset === 'paris'
                ? 'border-[#6D28D9] bg-[#6D28D9]/10 text-[#6D28D9]'
                : 'border-[#EFE9E2] bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bookmark size={13} style={{ color: '#6D28D9' }} />
            <span>Paris Belle</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset details notice */}
          {activePreset !== 'custom' && presets[activePreset] && (
            <div 
              className="p-4 rounded-2xl border flex items-start gap-3 transition-all duration-300"
              style={{ 
                backgroundColor: presets[activePreset]?.colorTheme.bg,
                borderColor: `${presets[activePreset]?.colorTheme.accent}20`
              }}
            >
              <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: presets[activePreset]?.colorTheme.accent }} />
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: presets[activePreset]?.colorTheme.accent }}>
                  Curated Journey Details
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">
                  {presets[activePreset]?.description}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Map size={11} /> {presets[activePreset]?.destination}
                  </span>
                  <span>•</span>
                  <span>{presets[activePreset]?.durationDays} Days Duration</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trip Name */}
            <div className="md:col-span-2">
              <label htmlFor="modal-trip-name" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Trip Name
              </label>
              <input
                id="modal-trip-name"
                type="text"
                placeholder="e.g. Summer Vacation, Tokyo Exploration, Weekend Getaway"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={activePreset !== 'custom'}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400 disabled:bg-slate-100/50 disabled:text-slate-500"
                required
              />
            </div>

            {/* Destination */}
            <div className="md:col-span-2">
              <label htmlFor="modal-trip-dest" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Destination
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="modal-trip-dest"
                  type="text"
                  placeholder="e.g. Bali, Tokyo, Paris, Rome"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={activePreset !== 'custom'}
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400 disabled:bg-slate-100/50 disabled:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div>
              <label htmlFor="modal-trip-start" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Start Date
              </label>
              <input
                id="modal-trip-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // Maintain preset duration if we've selected a preset
                  const preset = presets[activePreset];
                  if (preset && e.target.value) {
                    setEndDate(getOffsetDateString(e.target.value, preset.durationDays - 1));
                  }
                }}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800"
                required
              />
            </div>

            <div>
              <label htmlFor="modal-trip-end" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                End Date
              </label>
              <input
                id="modal-trip-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={activePreset !== 'custom'}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 disabled:bg-slate-100/50 disabled:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Quick info if pre-populating */}
          {activePreset !== 'custom' && presets[activePreset] && (
            <div className="p-4 bg-slate-50 border border-[#EFE9E2]/80 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-500">
                End-to-End Dynamic Seed Data
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                This preset will seed <strong>{presets[activePreset]?.itineraries.length} daily activities</strong> in your day-by-day planner timelines, and set up <strong>{presets[activePreset]?.expenses.length} transaction entries</strong> totaling <strong>${presets[activePreset]?.expenses.reduce((s, e) => s + e.amount, 0)}</strong> inside your SQLite Ledger.
              </p>
            </div>
          )}

          {activePreset === 'custom' && (
            <div className="p-4 bg-[#FAF5F0] border border-[#EFE9E2] rounded-2xl">
              <span className="text-[10px] font-bold text-[#A25E49] uppercase tracking-wider block mb-1">
                ✧ Smart Design Generation Enabled
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Submit this trip to automatically generate custom theme stylings on the backend! It will tailor background tones, header taglines, historical sites, and local trivia specific to your destination.
              </p>
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="flex gap-3 px-8 py-5 border-t border-[#EFE9E2]/60 bg-white">
          <button
            id="submit-new-trip-btn"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 text-white font-bold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider hover:brightness-95 transition-all active:scale-[0.98] cursor-pointer text-center disabled:opacity-50"
            style={{ 
              backgroundColor: activePreset !== 'custom' && presets[activePreset]
                ? presets[activePreset]?.colorTheme.accent 
                : '#A25E49' 
            }}
          >
            {isSubmitting ? 'Weaving Experience...' : activePreset === 'custom' ? 'Create Trip' : 'Assemble Curated Trip'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-[#EFE9E2] hover:bg-slate-50 text-slate-600 font-bold py-3 px-5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
