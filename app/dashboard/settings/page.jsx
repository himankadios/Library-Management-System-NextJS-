'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Sliders, Save, Building, Clock, DollarSign, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    FINE_PER_DAY: '1.00',
    BORROW_DURATION_DAYS: '14',
    MAX_BOOKS_STUDENT: '4',
    LIBRARY_NAME: 'AuraLib Central University Library',
    LIBRARY_EMAIL: 'library@university.edu',
    LIBRARY_PHONE: '+1 (555) 234-5678',
    ALLOW_STUDENT_RESERVATIONS: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('System parameters updated successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading system settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-royal-600" />
          <span>System & Circulation Configuration</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Global policies, late fine formulas, borrowing limits, and institutional contact identity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Circulation Policies */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Circulation & Lending Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Daily Overdue Fine ($)
              </label>
              <input
                type="number"
                step="0.25"
                name="FINE_PER_DAY"
                value={settings.FINE_PER_DAY}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Assessed per day overdue</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Standard Loan Duration (Days)
              </label>
              <input
                type="number"
                name="BORROW_DURATION_DAYS"
                value={settings.BORROW_DURATION_DAYS}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default loan window</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Max Books Per Student
              </label>
              <input
                type="number"
                name="MAX_BOOKS_STUDENT"
                value={settings.MAX_BOOKS_STUDENT}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Active checkout ceiling</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400 flex items-center gap-2">
            <Building className="w-4 h-4" /> Institution Identity & Support
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Official Library Name
              </label>
              <input
                type="text"
                name="LIBRARY_NAME"
                value={settings.LIBRARY_NAME}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Helpdesk Email
              </label>
              <input
                type="email"
                name="LIBRARY_EMAIL"
                value={settings.LIBRARY_EMAIL}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Library Contact Phone
              </label>
              <input
                type="text"
                name="LIBRARY_PHONE"
                value={settings.LIBRARY_PHONE}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Policies...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
