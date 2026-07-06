import React, { useState } from 'react';
import { Trip, User } from '../types';
import { Calendar, MapPin, Search, Trash2, Plus, Menu, X, DollarSign, Navigation, FolderOpen } from 'lucide-react';

interface TripSidebarProps {
  trips: Trip[];
  activeTripId: number | null;
  onSelectTrip: (id: number) => void;
  onDeleteTrip: (id: number) => void;
  onAddNewTrip: () => void;
  isOpen: boolean;
  onClose: () => void;
  onGoBackToShowcase?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function TripSidebar({
  trips,
  activeTripId,
  onSelectTrip,
  onDeleteTrip,
  onAddNewTrip,
  isOpen,
  onClose,
  onGoBackToShowcase,
  currentUser,
  onLogout,
}: TripSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filteredTrips = trips.filter(
    (trip) =>
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      // Replace dashes with slashes to avoid timezone offset issues in date parsing
      const date = new Date(dateString.replace(/-/g, '/'));
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };

  const getDestinationThumbnail = (dest: string, tripName: string) => {
    const text = `${dest} ${tripName}`.toLowerCase();
    if (text.includes('turkey') || text.includes('istanbul') || text.includes('hagia')) {
      return 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=120&auto=format&fit=crop&q=80';
    }
    if (text.includes('kyoto') || text.includes('japan') || text.includes('zen') || text.includes('garden')) {
      return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=120&auto=format&fit=crop&q=80';
    }
    if (text.includes('bali') || text.includes('indonesia') || text.includes('beach') || text.includes('island')) {
      return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=120&auto=format&fit=crop&q=80';
    }
    if (text.includes('paris') || text.includes('france') || text.includes('eiffel')) {
      return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&auto=format&fit=crop&q=80';
    }
    if (text.includes('rome') || text.includes('italy') || text.includes('colosseum')) {
      return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=120&auto=format&fit=crop&q=80';
    }
    if (text.includes('swiss') || text.includes('switzerland') || text.includes('alps') || text.includes('mountain')) {
      return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=120&auto=format&fit=crop&q=80';
    }
    // General fallback
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=120&auto=format&fit=crop&q=80';
  };

  const activeTrip = trips.find(t => t.id === activeTripId);
  const activeThemeAccent = activeTrip?.theme_color_accent || '#A25E49';

  return (
    <aside
      id="sidebar"
      className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-gradient-to-b from-[#FCFAF8] via-[#FAF3EC] to-[#F5E6DC] border-r border-[#EFE9E2] flex flex-col transition-transform duration-300 ease-in-out relative overflow-hidden
        md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Subtle dotted background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#7A2E3A 1.5px, transparent 1.5px)', 
          backgroundSize: '16px 16px' 
        }} 
      />

      {/* Header */}
      <div className="p-6 border-b border-[#EFE9E2]/60 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Navigation size={28} style={{ color: '#7A2E3A' }} />
          <div>
            <h1 className="font-serif italic font-bold text-xl text-slate-950 tracking-tight leading-none">Travels</h1>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide uppercase mt-1">Curated Journeys</p>
          </div>
        </div>
        <button
          id="close-sidebar-btn"
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          title="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2 relative z-10">
        <button
          id="new-trip-btn"
          onClick={() => {
            onAddNewTrip();
            onClose(); // Close drawer on mobile
          }}
          className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 px-4 rounded-xl shadow-md hover:brightness-105 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-xs tracking-wider uppercase cursor-pointer"
          style={{ 
            backgroundColor: '#7A2E3A',
            boxShadow: '0 4px 14px rgba(122, 46, 58, 0.3)'
          }}
        >
          <Plus size={14} className="stroke-[3px]" />
          Create New Trip
        </button>
        {onGoBackToShowcase && (
          <button
            onClick={() => {
              onGoBackToShowcase();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7A2E3A]/5 to-[#7A2E3A]/10 hover:from-[#7A2E3A]/15 hover:to-[#7A2E3A]/20 border border-[#7A2E3A]/25 text-[#7A2E3A] font-extrabold py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 text-xs cursor-pointer"
          >
            <Navigation size={13} />
            Explore Destinations
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4 relative z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="trip-search-input"
            type="text"
            placeholder="Search trips or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EFE9E2] rounded-xl text-xs focus:outline-none focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-sans"
            style={{
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#7A2E3A';
              e.target.style.boxShadow = '0 0 0 1px rgba(122, 46, 58, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#EFE9E2';
              e.target.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Trip List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 relative z-10">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-10 px-4">
            <FolderOpen size={36} className="mx-auto mb-3 text-[#7A2E3A]/60" />
            <p className="text-sm font-bold text-slate-800">No voyages found</p>
            <p className="text-xs text-slate-500 mt-1">Try searching for something else or plan a new trip!</p>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            const isActive = trip.id === activeTripId;
            const themeAccent = trip.theme_color_accent || '#7A2E3A';

            return (
              <div
                key={trip.id}
                id={`trip-card-${trip.id}`}
                onClick={() => {
                  onSelectTrip(trip.id);
                  onClose(); // Close sidebar on mobile
                }}
                className={`
                  relative group flex gap-3 p-3.5 rounded-xl cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md
                `}
                style={isActive ? {
                  backgroundColor: '#7A2E3A', // Solid branding maroon for high-contrast active state
                  borderColor: '#7A2E3A',
                  boxShadow: '0 8px 20px -6px rgba(122, 46, 58, 0.45), 0 4px 10px -4px rgba(122, 46, 58, 0.2)'
                } : {
                  backgroundColor: '#ffffff',
                  borderColor: '#EFE9E2'
                }}
              >
                {/* Photo Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-100 relative shadow-sm">
                  <img 
                    src={getDestinationThumbnail(trip.destination, trip.name)} 
                    alt={trip.destination} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-1">
                    <h3
                      className={`font-serif italic font-extrabold text-sm line-clamp-1 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {trip.name}
                    </h3>
                    {confirmDeleteId === trip.id ? (
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`confirm-delete-${trip.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrip(trip.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold font-sans transition-all"
                        >
                          Del
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans transition-all ${
                            isActive ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-trip-btn-${trip.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(trip.id);
                        }}
                        className={`p-1 rounded transition-all flex-shrink-0 ${
                          isActive ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                        }`}
                        title="Delete trip"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Destination */}
                  <div className={`flex items-center gap-1 text-[11px] mt-1 ${isActive ? 'text-[#FAF1EC]' : 'text-slate-700'}`}>
                    <MapPin size={11} className="flex-shrink-0" style={{ color: isActive ? '#FAF1EC' : '#7A2E3A' }} />
                    <span className="line-clamp-1 font-semibold">{trip.destination}</span>
                  </div>

                  {/* Date range */}
                  <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${isActive ? 'text-[#FAF1EC]/85' : 'text-slate-700'}`}>
                    <Calendar size={11} className="flex-shrink-0" style={{ color: isActive ? '#FAF1EC' : '#7A2E3A' }} />
                    <span className="font-semibold">
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </span>
                  </div>

                  {/* Expenses indicator */}
                  <div className={`mt-2 pt-1.5 border-t flex justify-between items-center text-[10px] font-bold font-sans ${
                    isActive ? 'border-white/10 text-[#FAF1EC]' : 'border-slate-100 text-slate-700'
                  }`}>
                    <span>Expenses</span>
                    <span className={isActive ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>
                      ${Number(trip.total_expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-[#EFE9E2]/60 bg-[#FCFAF8]/85 flex flex-col gap-2 relative z-10">
        {currentUser && (
          <div className="flex items-center justify-between bg-white border border-[#EFE9E2] p-2.5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#7A2E3A]/10 text-[#7A2E3A] flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {currentUser.username.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser.username}</p>
                <p className="text-[10px] text-slate-500 font-sans tracking-wide uppercase leading-none mt-0.5 font-bold">Explorer</p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                title="Sign Out"
              >
                Log Out
              </button>
            )}
          </div>
        )}
        <p className="text-[9px] text-slate-500 text-center font-mono uppercase tracking-wider mt-1 font-bold">Curated Travel Companion</p>
      </div>
    </aside>
  );
}
