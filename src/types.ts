export interface User {
  id: number;
  username: string;
}

export interface Trip {
  id: number;
  name: string;
  destination: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  total_expenses: number;
  theme_headline?: string;
  theme_tagline?: string;
  theme_color_bg?: string;
  theme_color_accent?: string;
  theme_site_name?: string;
  theme_trivia?: string;
}

export interface ItineraryItem {
  id: number;
  trip_id: number;
  day_index: number; // 0 for Day 1, etc.
  time: string;      // "HH:MM" or similar text
  activity: string;
  notes: string;
}

export interface ExpenseItem {
  id: number;
  trip_id: number;
  description: string;
  amount: number;
  category: string;
  date: string;      // YYYY-MM-DD
}

export interface TripDetails extends Trip {
  itineraries: ItineraryItem[];
  expenses: ExpenseItem[];
}

export type ExpenseCategory = 'Transportation' | 'Food' | 'Lodging' | 'Activities' | 'Shopping' | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Transportation',
  'Food',
  'Lodging',
  'Activities',
  'Shopping',
  'Other'
];
