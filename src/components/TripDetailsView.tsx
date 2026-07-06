import React, { useState } from 'react';
import { TripDetails, ItineraryItem, ExpenseItem } from '../types';
import ItineraryPlanner from './ItineraryPlanner';
import BudgetTracker from './BudgetTracker';
import { Calendar, MapPin, Edit2, Check, X, AlertCircle, Trash2, ArrowLeft, Sparkles, Landmark, Wallet } from 'lucide-react';

interface TripDetailsViewProps {
  trip: TripDetails;
  onUpdateTrip: (id: number, trip: { name: string; destination: string; start_date: string; end_date: string }) => Promise<void>;
  onAddItinerary: (item: Omit<ItineraryItem, 'id' | 'trip_id'>) => Promise<void>;
  onUpdateItinerary: (itemId: number, item: Omit<ItineraryItem, 'id' | 'trip_id'>) => Promise<void>;
  onDeleteItinerary: (itemId: number) => Promise<void>;
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'trip_id'>) => Promise<void>;
  onUpdateExpense: (expenseId: number, expense: Omit<ExpenseItem, 'id' | 'trip_id'>) => Promise<void>;
  onDeleteExpense: (expenseId: number) => Promise<void>;
  onBackToSidebar?: () => void; // Mobile view back trigger
  onRegenerateTheme?: (id: number) => Promise<void>;
}

type ActiveView = 'itinerary' | 'budget';

export default function TripDetailsView({
  trip,
  onUpdateTrip,
  onAddItinerary,
  onUpdateItinerary,
  onDeleteItinerary,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onBackToSidebar,
  onRegenerateTheme,
}: TripDetailsViewProps) {
  const [activeView, setActiveView] = useState<ActiveView>('itinerary');
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Edit trip states
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.start_date);
  const [endDate, setEndDate] = useState(trip.end_date);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset edit states when trip changes
  React.useEffect(() => {
    setName(trip.name);
    setDestination(trip.destination);
    setStartDate(trip.start_date);
    setEndDate(trip.end_date);
    setIsEditingTrip(false);
    setError('');
  }, [trip.id, trip.name, trip.destination, trip.start_date, trip.end_date]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Trip Name is required.');
    if (!destination.trim()) return setError('Destination is required.');
    if (!startDate || !endDate) return setError('Both dates are required.');

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return setError('Start date cannot be after end date.');
    }

    try {
      setIsSaving(true);
      await onUpdateTrip(trip.id, {
        name: name.trim(),
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      setIsEditingTrip(false);
    } catch (err) {
      setError('Failed to update trip details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshTheme = async () => {
    if (!onRegenerateTheme) return;
    try {
      setIsRegenerating(true);
      await onRegenerateTheme(trip.id);
    } catch (err) {
      console.error('Failed to refresh theme:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const formatDateString = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      const date = new Date(dateString.replace(/-/g, '/'));
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };

  const totalSpent = trip.expenses.reduce((sum, item) => sum + item.amount, 0);

  // Dynamic Theme Colors
  const themeBg = trip.theme_color_bg || '#FAF6F2';
  const themeAccent = trip.theme_color_accent || '#A25E49';
  const themeAccentLight = trip.theme_color_accent ? `${trip.theme_color_accent}12` : '#FAF5F0';
  const themeAccentBorder = trip.theme_color_accent ? `${trip.theme_color_accent}25` : '#EFE9E2';

  const accentTextStyle = { color: themeAccent };
  const accentBgStyle = { backgroundColor: themeBg };
  const accentLightStyle = { backgroundColor: themeAccentLight, borderColor: themeAccentBorder };

  return (
    <div className="space-y-6" style={{ '--theme-bg': themeBg, '--theme-accent': themeAccent } as React.CSSProperties}>
      {/* Back button for mobile view */}
      {onBackToSidebar && (
        <button
          id="back-to-sidebar-btn"
          onClick={onBackToSidebar}
          className="md:hidden flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
        >
          <ArrowLeft size={14} />
          Back to Trip List
        </button>
      )}

      {/* Trip Info Header Card */}
      <div id="trip-header-card" className="bg-[#FCFAF8] border border-[#EFE9E2] rounded-[1.8rem] p-6 md:p-8 shadow-xs relative overflow-hidden transition-all duration-300">
        {/* Subtle decorative color bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 z-10" 
          style={{ backgroundColor: themeAccent }}
        />
        {/* Ambient gradient fade expanding downward */}
        <div 
          className="absolute top-0 left-0 right-0 h-20 pointer-events-none opacity-[0.06] transition-all duration-500"
          style={{
            background: `linear-gradient(to bottom, ${themeAccent}, transparent)`
          }}
        />

        {!isEditingTrip ? (
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span 
                    className="px-3 py-1 rounded-full font-mono text-[9px] font-extrabold tracking-wider uppercase transition-all duration-300 shadow-2xs border text-white"
                    style={{
                      backgroundColor: '#7A2E3A', // Bolder brand-colored maroon
                      borderColor: '#7A2E3A',
                    }}
                  >
                    ACTIVE TRIP PLAN
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-serif italic font-bold text-slate-900 tracking-tight transition-all duration-300">
                    {trip.name}
                  </h2>
                  {trip.theme_headline && (
                    <p className="text-sm font-serif italic font-semibold tracking-wide transition-colors duration-500" style={accentTextStyle}>
                      "{trip.theme_headline}"
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-700 font-bold font-sans">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="flex-shrink-0 transition-colors duration-500" style={accentTextStyle} />
                    <span>{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="flex-shrink-0 transition-colors duration-500" style={accentTextStyle} />
                    <span>
                      {formatDateString(trip.start_date)} - {formatDateString(trip.end_date)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                id="edit-trip-details-btn"
                onClick={() => setIsEditingTrip(true)}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-[#7A2E3A] hover:bg-[#FAF1EC] border border-[#EFE9E2] hover:border-[#D8A9A0] px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex-shrink-0 cursor-pointer"
              >
                <Edit2 size={13} />
                Edit Details
              </button>
            </div>

            {/* Historical Site & AI Trivia Banner */}
            {(trip.theme_site_name || trip.theme_trivia) && (
              <div 
                className="border rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-500 relative overflow-hidden shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${themeBg}, ${themeAccentLight}50)`,
                  borderColor: themeAccent,
                  borderWidth: '1.5px',
                  boxShadow: `0 4px 20px -3px ${themeAccent}15`
                }}
              >
                {/* Highlight glow accent */}
                <div 
                  className="absolute -right-16 -top-16 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none" 
                  style={{ backgroundColor: themeAccent }}
                />

                <div className="space-y-1.5 flex-1 relative z-10">
                  <div className="flex flex-wrap items-center gap-2 font-bold text-xs" style={accentTextStyle}>
                    <Landmark size={14} style={accentTextStyle} />
                    <span>{trip.theme_site_name || 'Historical Center'}</span>
                    {trip.theme_tagline && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-700 font-extrabold italic">{trip.theme_tagline}</span>
                      </>
                    )}
                  </div>
                  {trip.theme_trivia && (
                    <p className="text-xs text-slate-800 font-medium leading-relaxed max-w-3xl">
                      <span className="font-extrabold text-[#7A2E3A]">Did you know?</span> {trip.theme_trivia}
                    </p>
                  )}
                </div>

                {onRegenerateTheme && (
                  <button
                    id="regenerate-ai-theme-btn"
                    type="button"
                    disabled={isRegenerating}
                    onClick={handleRefreshTheme}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border hover:brightness-110 hover:scale-[1.03] active:scale-[0.98] transition-all flex-shrink-0 cursor-pointer relative z-10"
                    style={{
                      background: `linear-gradient(135deg, ${themeAccent}, ${themeAccent}dd)`,
                      color: '#ffffff',
                      borderColor: themeAccent,
                      boxShadow: `0 4px 12px ${themeAccent}40`
                    }}
                  >
                    <Sparkles size={11} className={isRegenerating ? 'animate-spin' : ''} />
                    {isRegenerating ? 'Analyzing...' : 'AI Refresh'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="space-y-5 font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-[#EFE9E2]">
              <h3 className="font-serif italic font-bold text-sm text-slate-800">Edit Trip Details</h3>
              <div className="flex gap-2">
                <button
                  id="save-trip-details-btn"
                  type="submit"
                  disabled={isSaving}
                  className="p-2 text-white hover:brightness-95 rounded-xl transition-all cursor-pointer"
                  style={{ backgroundColor: themeAccent }}
                  title="Save changes"
                >
                  <Check size={14} />
                </button>
                <button
                  id="cancel-trip-details-btn"
                  type="button"
                  onClick={() => setIsEditingTrip(false)}
                  className="p-2 text-slate-500 bg-white border border-[#EFE9E2] hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-trip-name" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Trip Name</label>
                <input
                  id="edit-trip-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800"
                  onFocus={(e) => {
                    e.target.style.borderColor = themeAccent;
                    e.target.style.boxShadow = `0 0 0 1px ${themeAccent}15`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EFE9E2';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-trip-destination" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Destination</label>
                <input
                  id="edit-trip-destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800"
                  onFocus={(e) => {
                    e.target.style.borderColor = themeAccent;
                    e.target.style.boxShadow = `0 0 0 1px ${themeAccent}15`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EFE9E2';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-trip-start" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Start Date</label>
                <input
                  id="edit-trip-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800"
                  onFocus={(e) => {
                    e.target.style.borderColor = themeAccent;
                    e.target.style.boxShadow = `0 0 0 1px ${themeAccent}15`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EFE9E2';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-trip-end" className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">End Date</label>
                <input
                  id="edit-trip-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800"
                  onFocus={(e) => {
                    e.target.style.borderColor = themeAccent;
                    e.target.style.boxShadow = `0 0 0 1px ${themeAccent}15`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EFE9E2';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200/80">
        <button
          id="itinerary-tab-btn"
          onClick={() => setActiveView('itinerary')}
          className="px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all duration-300 flex items-center gap-2 cursor-pointer"
          style={activeView === 'itinerary' ? {
            borderColor: themeAccent,
            color: themeAccent,
            fontWeight: 'bold'
          } : {
            borderColor: 'transparent',
            color: '#64748b'
          }}
        >
          <Calendar size={15} />
          Day-by-Day Itinerary
        </button>
        <button
          id="budget-tab-btn"
          onClick={() => setActiveView('budget')}
          className="px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-all duration-300 flex items-center gap-2 cursor-pointer"
          style={activeView === 'budget' ? {
            borderColor: themeAccent,
            color: themeAccent,
            fontWeight: 'bold'
          } : {
            borderColor: 'transparent',
            color: '#64748b'
          }}
        >
          <Wallet size={15} />
          Budget Tracker ({trip.expenses.length})
        </button>
      </div>

      {/* Active Tab View */}
      <div className="bg-[#FCFAF8] border border-[#EFE9E2] rounded-[1.8rem] p-6 md:p-8 shadow-xs transition-all duration-300">
        {activeView === 'itinerary' ? (
          <ItineraryPlanner
            trip={trip}
            onAddItinerary={onAddItinerary}
            onUpdateItinerary={onUpdateItinerary}
            onDeleteItinerary={onDeleteItinerary}
          />
        ) : (
          <BudgetTracker
            trip={trip}
            onAddExpense={onAddExpense}
            onUpdateExpense={onUpdateExpense}
            onDeleteExpense={onDeleteExpense}
          />
        )}
      </div>
    </div>
  );
}
