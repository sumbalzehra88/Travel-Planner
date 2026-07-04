import React, { useState } from 'react';
import { ExpenseItem, EXPENSE_CATEGORIES, ExpenseCategory, TripDetails } from '../types';
import { DollarSign, Plus, Trash2, Edit2, AlertCircle, Sparkles, Receipt, List, Calendar, PieChart, Target } from 'lucide-react';

interface BudgetTrackerProps {
  trip: TripDetails;
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'trip_id'>) => Promise<void>;
  onUpdateExpense: (expenseId: number, expense: Omit<ExpenseItem, 'id' | 'trip_id'>) => Promise<void>;
  onDeleteExpense: (expenseId: number) => Promise<void>;
}

export default function BudgetTracker({
  trip,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: BudgetTrackerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  // Dynamic colors
  const themeAccent = trip.theme_color_accent || '#A25E49';
  const themeBg = trip.theme_color_bg || '#FAF6F2';
  const themeAccentLight = trip.theme_color_accent ? `${trip.theme_color_accent}12` : '#FAF5F0';
  const themeAccentBorder = trip.theme_color_accent ? `${trip.theme_color_accent}25` : '#EFE9E2';

  // Form states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Transportation');
  const [date, setDate] = useState(trip.start_date);
  const [error, setError] = useState('');

  // Calculations
  const totalSpent = trip.expenses.reduce((sum, item) => sum + item.amount, 0);

  // Group by category for visual analytics
  const categorySummary = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    const total = trip.expenses.filter((item) => item.category === cat).reduce((sum, item) => sum + item.amount, 0);
    acc[cat] = total;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Determine category percentage
  const maxCategoryAmount = Math.max(...Object.values(categorySummary), 1);

  // Helper color map for category badges/bars
  const categoryStyles: Record<ExpenseCategory, { bg: string; text: string; fill: string; dot: string }> = {
    Transportation: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', fill: 'bg-blue-500', dot: 'bg-blue-400' },
    Food: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', fill: 'bg-amber-500', dot: 'bg-amber-400' },
    Lodging: { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', fill: 'bg-purple-500', dot: 'bg-purple-400' },
    Activities: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', fill: 'bg-emerald-500', dot: 'bg-emerald-400' },
    Shopping: { bg: 'bg-pink-50 border-pink-100', text: 'text-pink-700', fill: 'bg-pink-500', dot: 'bg-pink-400' },
    Other: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', fill: 'bg-slate-500', dot: 'bg-slate-400' },
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingItem(null);
    setDescription('');
    setAmount('');
    setCategory('Transportation');
    setDate(trip.start_date);
    setError('');
  };

  const handleStartEdit = (item: ExpenseItem) => {
    setEditingItem(item);
    setIsAdding(false);
    setDescription(item.description);
    setAmount(item.amount.toString());
    setCategory(item.category as ExpenseCategory);
    setDate(item.date);
    setError('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingItem(null);
    setDescription('');
    setAmount('');
    setCategory('Transportation');
    setDate(trip.start_date);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setError('Please add an expense description.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!date) {
      setError('Please select a date.');
      return;
    }

    try {
      if (editingItem) {
        await onUpdateExpense(editingItem.id, {
          description,
          amount: parsedAmount,
          category,
          date,
        });
        setEditingItem(null);
      } else {
        await onAddExpense({
          description,
          amount: parsedAmount,
          category,
          date,
        });
        setIsAdding(false);
      }
      // Reset
      setDescription('');
      setAmount('');
      setCategory('Transportation');
      setDate(trip.start_date);
    } catch (err) {
      setError('Failed to record expense.');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (confirm('Delete this expense?')) {
      try {
        await onDeleteExpense(itemId);
      } catch (err) {
        alert('Failed to delete expense.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const dateObj = new Date(dateString.replace(/-/g, '/'));
      return dateObj.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Running Total & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch font-sans">
        {/* Total Card */}
        <div 
          className="md:col-span-5 text-white rounded-[1.8rem] p-6 shadow-xs flex flex-col justify-between transition-all duration-300"
          style={{ backgroundColor: themeAccent }}
        >
          <div>
            <span className="text-white/80 font-mono text-[10px] uppercase tracking-wider font-bold">Total Running Expenses</span>
            <h3 className="text-4xl font-bold tracking-tight mt-1 font-serif italic">
              ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-white/70 mt-2 font-mono">
              Summed from {trip.expenses.length} transaction entries on SQLite
            </p>
          </div>
          <div className="pt-6 border-t border-white/20 mt-6 flex justify-between items-center">
            <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Active Trip Tracker</span>
            {!isAdding && !editingItem && (
              <button
                id="add-expense-trigger"
                onClick={handleStartAdd}
                className="bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer"
              >
                <Plus size={12} />
                Add Expense
              </button>
            )}
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="md:col-span-7 bg-white border border-[#EFE9E2] rounded-[1.8rem] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PieChart size={13} style={{ color: themeAccent }} /> Category Breakdown
            </h4>
            <div className="space-y-3.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const total = categorySummary[cat];
                const styles = categoryStyles[cat];
                const pct = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
                const barWidth = totalSpent > 0 ? (total / maxCategoryAmount) * 100 : 0;

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                        {cat}
                      </span>
                      <span>
                        ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        <span className="text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 border border-[#EFE9E2] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${styles.fill} rounded-full transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Ledger & Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
        {/* Expense List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt size={16} style={{ color: themeAccent }} />
              Expense Log
            </h2>
          </div>

          {trip.expenses.length === 0 ? (
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-8 text-center">
              <span className="text-3xl block mb-2">💸</span>
              <p className="text-sm font-semibold text-slate-800">No expenses recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Start tracking your budget. Click "Add Expense" to save a transaction.</p>
            </div>
          ) : (
            <div className="border border-[#EFE9E2] bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-[#EFE9E2]/60">
                {trip.expenses.map((item) => {
                  const styles = categoryStyles[item.category as ExpenseCategory] || categoryStyles.Other;
                  return (
                    <div
                      key={item.id}
                      id={`expense-row-${item.id}`}
                      className="group flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Left: Description + Category/Date */}
                      <div className="space-y-1 pr-4">
                        <h4 className="font-semibold text-sm text-slate-950 leading-tight">
                          {item.description}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles.bg} ${styles.text}`}
                          >
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(item.date)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Price + Delete Button */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-950">
                          ${item.amount.toFixed(2)}
                        </span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            id={`edit-expense-btn-${item.id}`}
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            id={`delete-expense-btn-${item.id}`}
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Expense input form */}
        <div className="lg:col-span-5">
          {isAdding || editingItem ? (
            <div className="bg-white border border-[#EFE9E2] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-[#EFE9E2]/60">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} style={{ color: themeAccent }} />
                  {editingItem ? 'Edit Expense details' : 'Log New Expense'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Description Input */}
                <div>
                  <label htmlFor="expense-desc" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Expense Description
                  </label>
                  <input
                    id="expense-desc"
                    type="text"
                    placeholder="e.g. Flight ticket, Ubud Resort, Lunch buffet"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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

                {/* Amount & Category */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="expense-amount" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                      Amount ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">$</span>
                      <input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-xs pl-7 pr-3.5 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400"
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

                  <div>
                    <label htmlFor="expense-cat" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      id="expense-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-[#EFE9E2] rounded-xl focus:outline-none transition-all text-slate-800"
                      onFocus={(e) => {
                        e.target.style.borderColor = themeAccent;
                        e.target.style.boxShadow = `0 0 0 1px ${themeAccent}15`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#EFE9E2';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Input */}
                <div>
                  <label htmlFor="expense-date" className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                    Expense Date
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    min={trip.start_date}
                    max={trip.end_date}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    id="save-expense-btn"
                    type="submit"
                    className="flex-1 text-white font-bold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider hover:brightness-95 transition-all active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: themeAccent }}
                  >
                    {editingItem ? 'Save Changes' : 'Record Expense'}
                  </button>
                  <button
                    id="cancel-expense-btn"
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
              className="border rounded-2xl p-5 text-center transition-all duration-300"
              style={{
                backgroundColor: themeAccentLight,
                borderColor: themeAccentBorder
              }}
            >
              <Target size={24} className="mx-auto mb-2.5" style={{ color: themeAccent }} />
              <h4 className="font-bold text-[10px] text-slate-800 uppercase tracking-wider mb-1 font-sans">Financial Ledger</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Log travel expenses for transportation, accommodation, meals, or leisure to see running real-time totals and budget category bar breakdowns.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
