import React, { useState } from 'react';
import { Trip, User } from '../types';
import { Calendar, MapPin, Search, Trash2, Plus, Menu, X, DollarSign, Compass, FolderOpen } from 'lucide-react';

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

    const activeTrip = trips.find(t => t.id === activeTripId);
    const activeThemeAccent = activeTrip?.theme_color_accent || '#A25E49';
    const activeThemeAccentLight = activeTrip?.theme_color_accent ? `${activeTrip.theme_color_accent}12` : '#FAF5F0';
    const activeThemeAccentBorder = activeTrip?.theme_color_accent ? `${activeTrip.theme_color_accent}25` : '#EFE9E2';

    return (
      <aside
        id="sidebar"
        className={`
          fixed inset-y-0 left-0 z-40 w-80 bg-[#FCFAF8] border-r border-[#EFE9E2] flex flex-col transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EFE9E2]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass size={28} style={{ color: activeThemeAccent }} />
            <div>
              <h1 className="font-serif italic font-bold text-xl text-slate-950 tracking-tight leading-none">Travels</h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-wide uppercase mt-1">Curated Journeys</p>
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

        {/* Action Button */}
        <div className="p-4 space-y-2">
          <button
            id="new-trip-btn"
            onClick={() => {
              onAddNewTrip();
              onClose(); // Close drawer on mobile
            }}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-4 rounded-xl shadow-xs hover:brightness-95 hover:shadow-md transition-all duration-200 text-xs tracking-wider uppercase active:scale-[0.98]"
            style={{ backgroundColor: activeThemeAccent }}
          >
            <Plus size={14} />
            Create New Trip
          </button>
          {onGoBackToShowcase && (
            <button
              onClick={() => {
                onGoBackToShowcase();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#E8C4B8]/20 hover:bg-[#E8C4B8]/35 border border-[#D8A9A0]/40 text-[#7A2E3A] font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all duration-200 text-xs active:scale-[0.98]"
            >
              <Compass size={13} />
              Explore Destinations
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
                e.target.style.borderColor = activeThemeAccent;
                e.target.style.boxShadow = `0 0 0 1px ${activeThemeAccent}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#EFE9E2';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Trip List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {filteredTrips.length === 0 ? (
            <div className="text-center py-10 px-4">
              <FolderOpen size={36} className="mx-auto mb-3 text-slate-400" style={{ color: activeThemeAccent }} />
              <p className="text-sm font-medium text-slate-700">No voyages found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for something else or plan a new trip!</p>
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const isActive = trip.id === activeTripId;
              const themeAccent = trip.theme_color_accent || '#A25E49';
              const themeAccentLight = trip.theme_color_accent ? `${trip.theme_color_accent}12` : '#FAF5F0';
              const themeAccentBorder = trip.theme_color_accent ? `${trip.theme_color_accent}25` : '#EFE9E2';

              return (
                <div
                  key={trip.id}
                  id={`trip-card-${trip.id}`}
                  onClick={() => {
                    onSelectTrip(trip.id);
                    onClose(); // Close sidebar on mobile
                  }}
                  className={`
                    relative group flex flex-col p-4 rounded-xl cursor-pointer border transition-all duration-200
                  `}
                  style={isActive ? {
                    backgroundColor: themeAccentLight,
                    borderColor: themeAccentBorder,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  } : {
                    backgroundColor: '#ffffff',
                    borderColor: '#EFE9E2'
                  }}
                >
                  {/* Trip name & Delete button */}
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      className="font-serif italic font-bold text-sm line-clamp-1 transition-colors"
                      style={isActive ? { color: themeAccent } : { color: '#1e293b' }}
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
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold font-sans transition-all"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold font-sans transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-trip-btn-${trip.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(trip.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100/80 transition-all flex-shrink-0"
                        title="Delete trip"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin size={12} className="flex-shrink-0" style={isActive ? { color: themeAccent } : { color: '#94a3b8' }} />
                    <span className="line-clamp-1 font-sans">{trip.destination}</span>
                  </div>

                  {/* Date range */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                    <Calendar size={12} className="flex-shrink-0" style={isActive ? { color: themeAccent } : { color: '#94a3b8' }} />
                    <span className="font-sans">
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </span>
                  </div>

                  {/* Budget summary indicator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-medium font-sans">
                    <span className="flex items-center gap-0.5">
                      Expenses
                    </span>
                    <span className={`font-semibold ${trip.total_expenses > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                      ${Number(trip.total_expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-[#EFE9E2]/60 bg-slate-50/50 flex flex-col gap-2">
          {currentUser && (
            <div className="flex items-center justify-between bg-white border border-[#EFE9E2] p-2.5 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#7A2E3A]/10 text-[#7A2E3A] flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                  {currentUser.username.substring(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 truncate">{currentUser.username}</p>
                  <p className="text-[10px] text-slate-400 font-sans tracking-wide uppercase leading-none mt-0.5">Explorer</p>
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
          <p className="text-[9px] text-slate-400 text-center font-mono uppercase tracking-wider mt-1">Curated Travel Companion</p>
        </div>
      </aside>
  );
}
