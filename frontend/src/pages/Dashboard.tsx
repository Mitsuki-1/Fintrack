import { useState, useEffect } from 'react';
import { getSummary, getSummaryByCategory, getSummaryBySource, getRecurring } from '../api/endpoints';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import type { SummaryResponse, SummaryByCategoryResponse, SummaryBySourceResponse, RecurringResponse } from '../types';
import { formatAmount } from '../utils/format';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Dashboard() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [byCategory, setByCategory] = useState<SummaryByCategoryResponse | null>(null);
  const [bySource, setBySource] = useState<SummaryBySourceResponse | null>(null);
  const [recurring, setRecurring] = useState<RecurringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getSummary(month), getSummaryByCategory(month), getSummaryBySource(month), getRecurring()])
      .then(([s, cat, src, rec]) => {
        if (!cancelled) { setSummary(s); setByCategory(cat); setBySource(src); setRecurring(rec); }
      })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.error?.message || 'Ошибка загрузки'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 border-3 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Загрузка данных...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 animate-slide-down">{error}</div>
    </div>
  );

  const categoryData = byCategory?.items.map((item) => ({ name: item.name, value: item.totalMinor })) || [];
  const sourceData = bySource?.items.map((item) => ({ name: item.name || 'Без источника', value: item.totalMinor })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Дашборд</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all duration-200"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 gradient-success opacity-5 group-hover:opacity-10 transition-opacity duration-300" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Доход</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary ? formatAmount(summary.totalIncomeMinor) : 0} <span className="text-base font-medium">сум</span></p>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 gradient-danger opacity-5 group-hover:opacity-10 transition-opacity duration-300" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Расход</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{summary ? formatAmount(summary.totalExpenseMinor) : 0} <span className="text-base font-medium">сум</span></p>
          </div>
        </div>
        <div className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 gradient-balance opacity-5 group-hover:opacity-10 transition-opacity duration-300" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Баланс</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{summary ? formatAmount(summary.balanceMinor) : 0} <span className="text-base font-medium">сум</span></p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Расходы по категориям</h3>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <span className="text-4xl mb-2">📊</span>
              <p className="text-sm">Добавьте расходы за этот месяц</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${formatAmount(value)} сум`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Доходы по источникам</h3>
          {sourceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <span className="text-4xl mb-2">📈</span>
              <p className="text-sm">Добавьте доходы за этот месяц</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickFormatter={(value) => formatAmount(value)} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip formatter={(value: number) => `${formatAmount(value)} сум`} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recurring */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Постоянные обязательства (в месяц)</h3>
        {recurring && recurring.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Название</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Сумма</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Период</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {recurring.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{item.name}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">{formatAmount(item.amountMinor)} сум</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                        {item.recurrence === 'monthly' ? 'Ежемесячно' : 'Ежегодно'}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-700/20">
                  <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">Итого ежемесячно</td>
                  <td className="py-3 px-4 text-sm font-bold text-red-600 dark:text-red-400">{formatAmount(recurring.monthlyExpenseMinor)} сум</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <span className="text-4xl mb-2">🔄</span>
            <p className="text-sm">Нет постоянных платежей</p>
          </div>
        )}
      </div>
    </div>
  );
}
