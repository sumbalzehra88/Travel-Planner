import { Trip, TripDetails, ItineraryItem, ExpenseItem, User } from '../types';

const metaEnv = (import.meta as any).env;
const API_BASE = metaEnv?.VITE_API_URL 
  ? `${metaEnv.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

// Helper to construct authorization and json headers
function getHeaders(includeJson: boolean = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('wandersync_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==========================================
// AUTHENTICATION CLIENTS
// ==========================================

export async function registerUser(username: string, password: string): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Registration failed');
  }
  
  const result = await response.json();
  localStorage.setItem('wandersync_token', result.token);
  return result;
}

export async function loginUser(username: string, password: string): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  
  const result = await response.json();
  localStorage.setItem('wandersync_token', result.token);
  return result;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('wandersync_token');
  if (!token) return null;

  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    localStorage.removeItem('wandersync_token');
    return null;
  }

  const data = await response.json();
  return data.user;
}

export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem('wandersync_token');
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    }).catch(() => {});
  }
  localStorage.removeItem('wandersync_token');
}

// ==========================================
// TRIP CLIENTS
// ==========================================

export async function fetchTrips(): Promise<Trip[]> {
  const response = await fetch(`${API_BASE}/trips`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch trips');
  }
  return response.json();
}

export async function fetchTripDetails(id: number): Promise<TripDetails> {
  const response = await fetch(`${API_BASE}/trips/${id}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch trip details for ID ${id}`);
  }
  return response.json();
}

export async function createTrip(trip: Omit<Trip, 'id' | 'total_expenses'>): Promise<TripDetails> {
  const response = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(trip),
  });
  if (!response.ok) {
    throw new Error('Failed to create trip');
  }
  return response.json();
}

export async function updateTrip(id: number, trip: Omit<Trip, 'id' | 'total_expenses'>): Promise<Trip> {
  const response = await fetch(`${API_BASE}/trips/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(trip),
  });
  if (!response.ok) {
    throw new Error('Failed to update trip');
  }
  return response.json();
}

export async function deleteTrip(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/trips/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete trip');
  }
}

// Itineraries
export async function addItinerary(
  tripId: number,
  item: Omit<ItineraryItem, 'id' | 'trip_id'>
): Promise<ItineraryItem> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/itinerary`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error('Failed to add itinerary item');
  }
  return response.json();
}

export async function updateItinerary(
  tripId: number,
  itemId: number,
  item: Omit<ItineraryItem, 'id' | 'trip_id'>
): Promise<ItineraryItem> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/itinerary/${itemId}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error('Failed to update itinerary item');
  }
  return response.json();
}

export async function deleteItinerary(tripId: number, itemId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/itinerary/${itemId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete itinerary item');
  }
}

// Expenses
export async function addExpense(
  tripId: number,
  item: Omit<ExpenseItem, 'id' | 'trip_id'>
): Promise<ExpenseItem> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error('Failed to add expense');
  }
  return response.json();
}

export async function updateExpense(
  tripId: number,
  itemId: number,
  item: Omit<ExpenseItem, 'id' | 'trip_id'>
): Promise<ExpenseItem> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/expenses/${itemId}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error('Failed to update expense');
  }
  return response.json();
}

export async function deleteExpense(tripId: number, itemId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/trips/${tripId}/expenses/${itemId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to delete expense');
  }
}

export async function regenerateTripTheme(id: number): Promise<any> {
  const response = await fetch(`${API_BASE}/trips/${id}/theme`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to regenerate trip theme');
  }
  return response.json();
}
