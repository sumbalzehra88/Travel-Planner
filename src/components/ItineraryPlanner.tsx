import React, { useState } from 'react';
import { ItineraryItem, TripDetails } from '../types';
import { Clock, Plus, Trash2, Edit2, AlertCircle, Sparkles, MapPin, AlignLeft, Calendar, Navigation } from 'lucide-react';
import WeatherForecast from './WeatherForecast';

interface ItineraryPlannerProps {
  trip: TripDetails;
  onAddItinerary: (item: Omit<ItineraryItem, 'id' | 'trip_id'>) => Promise<void>;
  onUpdateItinerary: (itemId: number, item: Omit<ItineraryItem, 'id' | 'trip_id'>) => Promise<void>;
  onDeleteItinerary: (itemId: number) => Promise<void>;
}

// Helper to generate the list of days between start and end dates
export function getDaysArray(start: string, end: string) {
  const arr = [];
  const dtStart = new Date(start.replace(/-/g, '/'));
  const dtEnd = new Date(end.replace(/-/g, '/'));

  if (isNaN(dtStart.getTime()) || isNaN(dtEnd.getTime())) {
    return [{ index: 0, dateString: start, label: 'Day 1', formattedDate: start }];
  }

  const current = new Date(dtStart);
  let index = 0;

  while (current <= dtEnd) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    arr.push({
      index,
      dateString,
      label: `Day ${index + 1}`,
      formattedDate: current.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });

    current.setDate(current.getDate() + 1);
    index++;

    if (index > 100) break; // Safety guard
  }

  if (arr.length === 0) {
    arr.push({
      index: 0,
      dateString: start,
      label: 'Day 1',
      formattedDate: dtStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return arr;
}

export default function ItineraryPlanner({
  trip,
  onAddItinerary,
  onUpdateItinerary,
  onDeleteItinerary,
}: ItineraryPlannerProps) {
  const days = getDaysArray(trip.start_date, trip.end_date);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Dynamic colors
  const themeAccent = trip.theme_color_accent || '#A25E49';
  const themeBg = trip.theme_color_bg || '#FAF6F2';
  const themeAccentLight = trip.theme_color_accent ? `${trip.theme_color_accent}12` : '#FAF5F0';
  const themeAccentBorder = trip.theme_color_accent ? `${trip.theme_color_accent}25` : '#EFE9E2';

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Filter activities for the active day
  const activeDayItineraries = trip.itineraries.filter(
    (item) => item.day_index === activeDayIndex
  ).sort((a, b) => {
    // Basic sorting by time string
    return a.time.localeCompare(b.time);
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingItem(null);
    setTime('');
    setActivity('');
    setNotes('');
    setError('');
  };

  const handleStartEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setIsAdding(false);
    setTime(item.time);
    setActivity(item.activity);
    setNotes(item.notes);
    setError('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingItem(null);
    setTime('');
    setActivity('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!time.trim()) {
      setError('Please specify a time.');
      return;
    }
    if (!activity.trim()) {
      setError('Please write an activity.');
      return;
    }

    try {
      if (editingItem) {
        await onUpdateItinerary(editingItem.id, {
          day_index: activeDayIndex,
          time,
          activity,
          notes,
        });
        setEditingItem(null);
      } else {
        await onAddItinerary({
          day_index: activeDayIndex,
          time,
          activity,
          notes,
        });
        setIsAdding(false);
      }
      // Reset form fields
      setTime('');
      setActivity('');
      setNotes('');
    } catch (err) {
      setError('Failed to save itinerary item. Please try again.');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (confirm('Delete this activity from your itinerary?')) {
      try {
        await onDeleteItinerary(itemId);
      } catch (err) {
        alert('Failed to delete itinerary item.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Day Selector */}
      <div className="border-b border-slate-100 pb-1">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none scroll-smooth">
          {days.map((day) => {
            const isSelected = day.index === activeDayIndex;
            return (
              <button
                key={day.index}
                id={`day-tab-${day.index}`}
                onClick={() => {
                  setActiveDayIndex(day.index);
                  handleCancel();
                }}
                className={`
                  flex-shrink-0 px-4 py-2.5 rounded-xl text-left border transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]
                `}
                style={isSelected ? {
                  background: 'linear-gradient(135deg, #7A2E3A, #60202B)', // Solid brand maroon gradient for the active day tab
                  borderColor: '#7A2E3A',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(122, 46, 58, 0.3)'
                } : {
                  backgroundColor: '#ffffff',
                  borderColor: '#EFE9E2',
                  color: '#475569'
                }}
              >
                <div className={`text-[10px] font-extrabold uppercase tracking-wider leading-none ${isSelected ? 'text-white/85' : 'text-slate-500'}`}>{day.label}</div>
                <div className={`text-xs font-extrabold mt-1 whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-900'}`}>{day.formattedDate}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather Forecast Component */}
      <WeatherForecast
        destination={trip.destination}
        startDate={trip.start_date}
        endDate={trip.end_date}
        themeAccent={themeAccent}
        themeBg={themeBg}
        themeAccentLight={themeAccentLight}
        themeAccentBorder={themeAccentBorder}
        activeDayIndex={activeDayIndex}
      />

      {/* Main Itinerary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Timeline Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-extrabold text-slate-950 flex items-center gap-2">
              <Calendar size={15} style={{ color: themeAccent }} /> Itinerary for {days[activeDayIndex]?.formattedDate || `Day ${activeDayIndex + 1}`}
            </h2>
            {!isAdding && !editingItem && (
              <button
                id="add-activity-btn"
                onClick={handleStartAdd}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 border rounded-xl hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-sm text-white"
                style={{
                  background: `linear-gradient(135deg, ${themeAccent}, ${themeAccent}dd)`,
                  borderColor: themeAccent,
                  boxShadow: `0 4px 10px ${themeAccent}25`
                }}
              >
                <Plus size={12} className="stroke-[3px]" />
                Add Activity
              </button>
            )}
          </div>

          {activeDayItineraries.length === 0 ? (
            <div className="bg-[#FAF1EC]/30 border border-[#EFE9E2] rounded-2xl p-8 text-center shadow-2xs">
              <span className="text-3xl block mb-2">🎈</span>
              <p className="text-sm font-extrabold text-slate-900">No activities scheduled yet</p>
              <p className="text-xs text-slate-600 font-bold mt-1">Make the most of your trip! Click "Add Activity" to plan this day.</p>
            </div>
          ) : (
            <div className="relative ml-4 pl-6 space-y-6 py-2">
              {/* Gradient connecting line */}
              <div 
                className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(to bottom, ${themeAccent}, #7A2E3A, ${themeAccent}40)`
                }}
              />

              {activeDayItineraries.map((item) => (
                <div key={item.id} className="relative group" id={`itinerary-item-${item.id}`}>
                  {/* Glowing Timeline dot */}
                  <span 
                    className="absolute -left-[29px] top-1.5 border-2 border-white w-3.5 h-3.5 rounded-full shadow-sm group-hover:scale-125 transition-all duration-300 flex items-center justify-center"
                    style={{ 
                      backgroundColor: themeAccent,
                      boxShadow: `0 0 8px 1.5px ${themeAccent}60`
                    }}
                  ></span>

                  <div className="bg-white border border-[#EFE9E2] hover:border-slate-300 p-4 rounded-xl shadow-xs transition-all duration-300 hover:shadow-sm">
                    <div className="flex justify-between items-start gap-4">
                      {/* Left: Time and Activity */}
                      <div className="space-y-2">
                        <div 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold font-mono uppercase tracking-wider border text-white shadow-2xs leading-none"
                          style={{ 
                            backgroundColor: themeAccent,
                            borderColor: themeAccent,
                          }}
                        >
                          <Clock size={10} className="stroke-[2.5px]" />
                          {item.time}
                        </div>
                        <h4 className="font-serif italic font-bold text-sm text-slate-950 leading-snug">
                          {item.activity}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-slate-800 bg-[#FAF1EC]/50 p-2.5 rounded-lg border border-[#EFE9E2]/60 mt-2 flex items-start gap-1.5 font-medium leading-relaxed">
                            <AlignLeft size={11} className="text-[#7A2E3A] mt-0.5 flex-shrink-0" />
                            <span className="whitespace-pre-line">{item.notes}</span>
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          id={`edit-activity-btn-${item.id}`}
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-[#7A2E3A] hover:bg-[#FAF1EC]/50 rounded-lg transition-all"
                          title="Edit activity"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          id={`delete-activity-btn-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete activity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form Panel */}
        <div className="lg:col-span-5 font-sans">
          {(isAdding || editingItem) ? (
            <div className="bg-white border border-[#EFE9E2] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E2]/60">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} style={{ color: themeAccent }} />
                  {editingItem ? 'Edit Activity Details' : 'Add New Activity'}
                </h3>
                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: themeAccent,
                    backgroundColor: themeAccentLight,
                    borderColor: themeAccentBorder
                  }}
                >
                  Day {activeDayIndex + 1}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="activity-time" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Time
                  </label>
                  <input
                    id="activity-time"
                    type="text"
                    placeholder="e.g. 10:00 AM, 14:30, Morning"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400"
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

                {/* Activity input */}
                <div>
                  <label htmlFor="activity-name" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Activity Name
                  </label>
                  <input
                    id="activity-name"
                    type="text"
                    placeholder="e.g., Flight to Bali, Dinner at Sea Circus"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400"
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

                {/* Notes Input */}
                <div>
                  <label htmlFor="activity-notes" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="activity-notes"
                    placeholder="Booking confirmation, addresses, reminders..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400 resize-none"
                    onFocus={(e) => {
                      e.target.style.borderColor = themeAccent;
                      e.target.style.boxShadow = `0 0 0 1px ${themeAccent}15`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#EFE9E2';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    id="save-activity-btn"
                    type="submit"
                    className="flex-1 text-white font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider hover:brightness-95 transition-all active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: themeAccent }}
                  >
                    {editingItem ? 'Save Changes' : 'Create Activity'}
                  </button>
                  <button
                    id="cancel-activity-btn"
                    type="button"
                    onClick={handleCancel}
                    className="bg-white border border-[#EFE9E2] hover:bg-slate-50 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div 
              className="border rounded-[1.8rem] p-6 text-center transition-all duration-300 relative overflow-hidden shadow-sm flex flex-col items-center justify-center min-h-[220px]"
              style={{
                background: `linear-gradient(135deg, ${themeBg}, ${themeAccentLight}50)`,
                borderColor: themeAccent,
                borderWidth: '1.5px',
                boxShadow: `0 4px 20px -3px ${themeAccent}10`
              }}
            >
              {/* Ambient decoration glow */}
              <div 
                className="absolute -left-12 -bottom-12 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none" 
                style={{ backgroundColor: themeAccent }}
              />

              <Navigation size={40} className="mb-4 text-[#7A2E3A]" style={{ color: themeAccent }} />
              <h4 className="font-serif italic font-extrabold text-sm text-slate-900 tracking-tight mb-2">Dynamic Timeline</h4>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-xs mx-auto">
                Schedule your itinerary day-by-day. Select a day tab above to plan specific schedules, flights, scenic visits, or relaxation slots.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
