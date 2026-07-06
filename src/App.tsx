import React, { useState, useEffect } from 'react';
import { Trip, TripDetails, ItineraryItem, ExpenseItem, User } from './types';
import * as api from './lib/api';
import TripSidebar from './components/TripSidebar';
import TripDetailsView from './components/TripDetailsView';
import NewTripModal from './components/NewTripModal';
import ShowcaseView from './components/ShowcaseView';
import AuthModal from './components/AuthModal';
import { Menu, AlertCircle, Plus, Sparkles, Navigation } from 'lucide-react';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<string>('');

  // Application lists & focus states
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [activeTripDetails, setActiveTripDetails] = useState<TripDetails | null>(null);

  // View Routing: 'showcase' (landing / details) or 'planner' (existing workspace)
  const [view, setView] = useState<'showcase' | 'planner'>('showcase');
  const [defaultDestination, setDefaultDestination] = useState<string>('');

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // 1. Load initial trips list
  const loadTripsList = async (selectIdToFocus?: number) => {
    if (!localStorage.getItem('wandersync_token')) {
      setTrips([]);
      setActiveTripId(null);
      setActiveTripDetails(null);
      setIsLoadingList(false);
      return;
    }
    try {
      setGlobalError('');
      setIsLoadingList(true);
      const data = await api.fetchTrips();
      setTrips(data);

      if (data.length > 0) {
        // If we want to focus on a specific trip, or fall back to the first trip
        const idToSelect = selectIdToFocus !== undefined ? selectIdToFocus : data[0].id;
        setActiveTripId(idToSelect);
      } else {
        setActiveTripId(null);
        setActiveTripDetails(null);
      }
    } catch (err) {
      console.error('Error loading trips list:', err);
      setGlobalError('Failed to load trips list.');
    } finally {
      setIsLoadingList(false);
    }
  };

  // Check and restore active user session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.fetchCurrentUser();
        if (user) {
          setCurrentUser(user);
          // Wait for loadTripsList to finish before stopping loading spinner
          await loadTripsList();
        } else {
          setIsLoadingList(false);
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        setIsLoadingList(false);
      }
    };
    initAuth();
  }, []);

  // 2. Fetch details for the active trip whenever activeTripId changes
  useEffect(() => {
    if (activeTripId === null) {
      setActiveTripDetails(null);
      return;
    }

    const loadActiveTripDetails = async () => {
      try {
        setIsLoadingDetails(true);
        setGlobalError('');
        const details = await api.fetchTripDetails(activeTripId);
        setActiveTripDetails(details);
      } catch (err) {
        console.error('Error loading trip details:', err);
        setGlobalError(`Failed to load details for trip #${activeTripId}`);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadActiveTripDetails();
  }, [activeTripId]);

  // 3. Handlers for Trip actions
  const handleCreateTrip = async (
    newTripData: { name: string; destination: string; start_date: string; end_date: string },
    presetItems?: {
      itineraries: Omit<ItineraryItem, 'id' | 'trip_id'>[];
      expenses: Omit<ExpenseItem, 'id' | 'trip_id'>[];
    }
  ) => {
    try {
      setGlobalError('');
      const created = await api.createTrip(newTripData);
      
      if (presetItems) {
        if (presetItems.itineraries && presetItems.itineraries.length > 0) {
          for (const it of presetItems.itineraries) {
            await api.addItinerary(created.id, it);
          }
        }
        if (presetItems.expenses && presetItems.expenses.length > 0) {
          for (const exp of presetItems.expenses) {
            await api.addExpense(created.id, exp);
          }
        }
      }

      // Reload list and focus on the newly created trip
      await loadTripsList(created.id);
    } catch (err) {
      console.error('Failed to create trip:', err);
      setGlobalError('Failed to create new trip.');
      throw err;
    }
  };

  const handleUpdateTrip = async (id: number, updatedData: { name: string; destination: string; start_date: string; end_date: string }) => {
    try {
      setGlobalError('');
      await api.updateTrip(id, updatedData);
      
      // Update local sidebar item details
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
      );

      // Update active details state in-place
      setActiveTripDetails((prev) => {
        if (!prev || prev.id !== id) return prev;
        return { ...prev, ...updatedData };
      });
    } catch (err) {
      console.error('Failed to update trip:', err);
      setGlobalError('Failed to update trip details.');
      throw err;
    }
  };

  const handleDeleteTrip = async (id: number) => {
    try {
      setGlobalError('');
      await api.deleteTrip(id);

      // Remove from state
      const updatedTrips = trips.filter((t) => t.id !== id);
      setTrips(updatedTrips);

      if (activeTripId === id) {
        if (updatedTrips.length > 0) {
          setActiveTripId(updatedTrips[0].id);
        } else {
          setActiveTripId(null);
          setActiveTripDetails(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete trip:', err);
      setGlobalError('Failed to delete trip.');
    }
  };

  const handleRegenerateTheme = async (id: number) => {
    try {
      setGlobalError('');
      setIsLoadingDetails(true);
      const updatedTheme = await api.regenerateTripTheme(id);
      
      // Update active trip details with the new theme values
      setActiveTripDetails((prev) => {
        if (!prev || prev.id !== id) return prev;
        return {
          ...prev,
          theme_headline: updatedTheme.headline,
          theme_tagline: updatedTheme.tagline,
          theme_color_bg: updatedTheme.color_bg,
          theme_color_accent: updatedTheme.color_accent,
          theme_site_name: updatedTheme.historical_site,
          theme_trivia: updatedTheme.trivia,
        };
      });

      // Update in trips list as well
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? {
          ...t,
          theme_headline: updatedTheme.headline,
          theme_tagline: updatedTheme.tagline,
          theme_color_bg: updatedTheme.color_bg,
          theme_color_accent: updatedTheme.color_accent,
          theme_site_name: updatedTheme.historical_site,
          theme_trivia: updatedTheme.trivia,
        } : t))
      );
    } catch (err) {
      console.error('Failed to regenerate theme:', err);
      setGlobalError('Failed to regenerate trip theme using AI.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // 4. Handlers for Itinerary actions
  const handleAddItinerary = async (item: Omit<ItineraryItem, 'id' | 'trip_id'>) => {
    if (activeTripId === null) return;
    try {
      setGlobalError('');
      const added = await api.addItinerary(activeTripId, item);
      
      // Sync local state in-place to avoid complete reload layout flicker
      setActiveTripDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          itineraries: [...prev.itineraries, added],
        };
      });
    } catch (err) {
      console.error('Failed to add itinerary item:', err);
      setGlobalError('Failed to record itinerary activity.');
      throw err;
    }
  };

  const handleUpdateItinerary = async (itemId: number, item: Omit<ItineraryItem, 'id' | 'trip_id'>) => {
    if (activeTripId === null) return;
    try {
      setGlobalError('');
      const updated = await api.updateItinerary(activeTripId, itemId, item);
      
      // Sync local state
      setActiveTripDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          itineraries: prev.itineraries.map((it) => (it.id === itemId ? updated : it)),
        };
      });
    } catch (err) {
      console.error('Failed to update itinerary item:', err);
      setGlobalError('Failed to save itinerary changes.');
      throw err;
    }
  };

  const handleDeleteItinerary = async (itemId: number) => {
    if (activeTripId === null) return;
    try {
      setGlobalError('');
      await api.deleteItinerary(activeTripId, itemId);
      
      // Sync local state
      setActiveTripDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          itineraries: prev.itineraries.filter((it) => it.id !== itemId),
        };
      });
    } catch (err) {
      console.error('Failed to delete itinerary item:', err);
      setGlobalError('Failed to delete itinerary activity.');
      throw err;
    }
  };

  // 5. Handlers for Expense actions
  const handleAddExpense = async (expense: Omit<ExpenseItem, 'id' | 'trip_id'>) => {
    if (activeTripId === null) return;
    try {
      setGlobalError('');
      const added = await api.addExpense(activeTripId, expense);
      
      // Sync local state and update total expenses in activeDetails and sidebar
      setActiveTripDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: [...prev.expenses, added],
        };
      });

      setTrips((prevTrips) =>
        prevTrips.map((t) => {
          if (t.id === activeTripId) {
            return { ...t, total_expenses: t.total_expenses + added.amount };
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Failed to add expense:', err);
      setGlobalError('Failed to record expense.');
      throw err;
    }
  };

  const handleUpdateExpense = async (expenseId: number, expense: Omit<ExpenseItem, 'id' | 'trip_id'>) => {
    if (activeTripId === null) return;
    try {
      setGlobalError('');
      
      // Find old expense amount to compute diff
      const oldExpense = activeTripDetails?.expenses.find((e) => e.id === expenseId);
      const diffAmount = expense.amount - (oldExpense ? oldExpense.amount : 0);

      const updated = await api.updateExpense(activeTripId, expenseId, expense);
      
      // Sync local state
      setActiveTripDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: prev.expenses.map((e) => (e.id === expenseId ? updated : e)),
        };
      });

      setTrips((prevTrips) =>
        prevTrips.map((t) => {
          if (t.id === activeTripId) {
            return { ...t, total_expenses: t.total_expenses + diffAmount };
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Failed to update expense:', err);
      setGlobalError('Failed to update expense transaction.');
      throw err;
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (activeTripId === null || !activeTripDetails) return;
    try {
      setGlobalError('');
      const expenseToDelete = activeTripDetails.expenses.find((e) => e.id === expenseId);
      if (!expenseToDelete) return;

      await api.deleteExpense(activeTripId, expenseId);
      
      // Sync local state
      setActiveTripDetails((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== expenseId),
        };
      });

      setTrips((prevTrips) =>
        prevTrips.map((t) => {
          if (t.id === activeTripId) {
            return { ...t, total_expenses: Math.max(0, t.total_expenses - expenseToDelete.amount) };
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setGlobalError('Failed to delete expense.');
      throw err;
    }
  };

  const activeBg = activeTripDetails?.theme_color_bg || '#FAF6F2';

  // Auth Action Handlers
  const handleLogout = async () => {
    try {
      await api.logoutUser();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setCurrentUser(null);
    setTrips([]);
    setActiveTripId(null);
    setActiveTripDetails(null);
    setView('showcase');
  };

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    await loadTripsList();
    
    if (pendingDestination) {
      setDefaultDestination(pendingDestination);
      setView('planner');
      setIsNewTripModalOpen(true);
      setPendingDestination('');
    } else {
      setView('planner');
    }
  };

  const handleSwitchToPlanner = () => {
    if (!currentUser) {
      setPendingDestination('');
      setIsAuthModalOpen(true);
    } else {
      setView('planner');
    }
  };

  const handleStartPlanningDestination = (destName: string) => {
    if (!currentUser) {
      setPendingDestination(destName);
      setIsAuthModalOpen(true);
    } else {
      setDefaultDestination(destName);
      setView('planner');
      setIsNewTripModalOpen(true);
    }
  };

  // Render the beautiful responsive Travel Destination Showcase Website
  if (view === 'showcase') {
    return (
      <>
        <ShowcaseView 
          onSwitchToPlanner={handleSwitchToPlanner}
          onStartPlanningDestination={handleStartPlanningDestination}
          currentUser={currentUser}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onLogoutClick={handleLogout}
        />
        <NewTripModal
          isOpen={isNewTripModalOpen}
          onClose={() => {
            setIsNewTripModalOpen(false);
            setDefaultDestination('');
          }}
          onSubmit={handleCreateTrip}
          defaultDestination={defaultDestination}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPendingDestination('');
          }}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // Otherwise render the full-featured interactive planning workspace
  return (
    <div 
      className="min-h-screen flex flex-col md:flex-row text-slate-800 font-sans transition-all duration-500"
      style={{ backgroundColor: activeBg }}
    >
      {/* Mobile Header with quick access back to the showcase */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#EFE9E2] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => setView('showcase')}
          className="flex items-center gap-1.5 text-xs font-bold text-[#7A2E3A] bg-[#E8C4B8]/30 px-3.5 py-1.5 rounded-full"
        >
          <Navigation size={13} /> Explore
        </button>
        <button
          id="menu-toggle-btn"
          onClick={() => setIsSidebarOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Open trip menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Sidebar Overlay on Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30"
        />
      )}

      {/* Left Panel Sidebar */}
      <TripSidebar
        trips={trips}
        activeTripId={activeTripId}
        onSelectTrip={setActiveTripId}
        onDeleteTrip={handleDeleteTrip}
        onAddNewTrip={() => setIsNewTripModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onGoBackToShowcase={() => setView('showcase')}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {/* Global Error Notice */}
        {globalError && (
          <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-2xl animate-fade-in shadow-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="font-semibold">{globalError}</span>
          </div>
        )}

        {/* Workspace Display Routing */}
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading your travel workspace...</p>
          </div>
        ) : trips.length === 0 ? (
          /* Empty State Welcome Board */
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 max-w-xl mx-auto text-center shadow-sm my-12 space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xs">
              🌎
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">Your Next Voyage Begins Here</h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Build daily schedules, map activities, and log real-time travel expenses securely in one place. Create your first trip to unlock the suite!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                id="get-started-btn"
                onClick={() => setIsNewTripModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-xs active:scale-[0.98]"
              >
                <Navigation size={14} />
                Plan My First Trip
              </button>
              <button
                onClick={() => setView('showcase')}
                className="inline-flex items-center gap-2 bg-[#FAF5F0] border border-[#EFE9E2] hover:bg-[#FAF5F0]/85 text-[#7A2E3A] font-semibold px-6 py-3 rounded-xl shadow-xs transition-all text-xs active:scale-[0.98]"
              >
                <Navigation size={14} />
                Browse Destinations
              </button>
            </div>
          </div>
        ) : isLoadingDetails || !activeTripDetails ? (
          /* Loading Details Spinner */
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading plan details...</p>
          </div>
        ) : (
          /* Dynamic Workspace Details View */
          <TripDetailsView
            trip={activeTripDetails}
            onUpdateTrip={handleUpdateTrip}
            onAddItinerary={handleAddItinerary}
            onUpdateItinerary={handleUpdateItinerary}
            onDeleteItinerary={handleDeleteItinerary}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onBackToSidebar={() => setIsSidebarOpen(true)}
            onRegenerateTheme={handleRegenerateTheme}
          />
        )}
      </main>

      {/* New Trip Dialog Overlays */}
      <NewTripModal
        isOpen={isNewTripModalOpen}
        onClose={() => {
          setIsNewTripModalOpen(false);
          setDefaultDestination('');
        }}
        onSubmit={handleCreateTrip}
        defaultDestination={defaultDestination}
      />

      {/* Auth Dialog Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingDestination('');
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
