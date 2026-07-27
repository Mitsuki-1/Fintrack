import { useState, useEffect } from 'react';
import { getExpenses, getCategories, createExpense, updateExpense, deleteExpense } from '../api/endpoints';
import type { Expense, Category } from '../types';
import { formatAmount } from '../utils/format';

const LIMIT = 10;

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ categoryId: '' as number | '', amount: '', spentAt: '', description: '', isRecurring: false, recurrence: '' as string });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const [year, mon] = month.split('-').map(Number);
    const from = `${year}-${String(mon).padStart(2, '0')}-01`;
    const nextMonth = mon === 12 ? 1 : mon + 1;
    const nextYear = mon === 12 ? year + 1 : year;
    const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const params: any = { page, limit: LIMIT, from, to };
    if (filterCategoryId) params.categoryId = filterCategoryId;
    getExpenses(params)
      .then((data) => { if (!cancelled) { setExpenses(data.items); setTotal(data.total); } })
      .catch((err: any) => { if (!cancelled) setError(err?.response?.data?.error?.message || 'Ошибка загрузки'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month, page, filterCategoryId]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err: any) => setError(err?.response?.data?.error?.message || 'Не удалось загрузить категории'));
  }, []);

  const today = new Date();

  const openCreate = () => {
    setEditingExpense(null);
    setFormData({ categoryId: categories.length > 0 ? categories[0].id : '', amount: '', spentAt: today.toISOString().slice(0, 10), description: '', isRecurring: false, recurrence: '' });
    setShowForm(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ categoryId: expense.categoryId ?? '', amount: String(expense.amountMinor / 100), spentAt: expense.spentAt, description: expense.description ?? '', isRecurring: expense.isRecurring, recurrence: expense.recurrence ?? '' });
    setShowForm(true);
  };

  const reload = () => {
    const [year, mon] = month.split('-').map(Number);
    const from = `${year}-${String(mon).padStart(2, '0')}-01`;
    const nextMonth = mon === 12 ? 1 : mon + 1;
    const nextYear = mon === 12 ? year + 1 : year;
    const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const params: any = { page, limit: LIMIT, from, to };
    if (filterCategoryId) params.categoryId = filterCategoryId;
    getExpenses(params).then((data) => { setExpenses(data.items); setTotal(data.total); }).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { categoryId: Number(formData.categoryId), amountMinor: Math.round(Number(formData.amount) * 100), currency: 'UZS', spentAt: formData.spentAt, description: formData.description || null, isRecurring: formData.isRecurring, recurrence: formData.isRecurring ? formData.recurrence : null };
      if (editingExpense) { await updateExpense(editingExpense.id, payload); } else { await createExpense(payload); }
      setShowForm(false);
      reload();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот расход?')) return;
    try { await deleteExpense(id); reload(); } catch (err: any) { setError(err?.response?.data?.error?.message || 'Ошибка удаления'); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const getCategoryName = (categoryId: number) => categories.find((c) => c.id === categoryId)?.name || '—';

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-200";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Расходы</h1>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm">
          + Добавить расход
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Месяц</label>
          <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className={inputCls + " w-auto"} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Категория</label>
          <select value={filterCategoryId} onChange={(e) => { setFilterCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(1); }} className={inputCls + " w-auto"}>
            <option value="">Все</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm animate-slide-down">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <span className="text-5xl mb-3">💸</span>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">Расходов нет</h3>
            <p className="text-sm">Добавьте первый расход за этот месяц</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Дата</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Категория</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Сумма</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:table-cell">Описание</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden md:table-cell">Повтор</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{exp.spentAt}</td>
                    <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{getCategoryName(exp.categoryId)}</td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">{formatAmount(exp.amountMinor)} сум</td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{exp.description || '—'}</td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {exp.isRecurring ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                          {exp.recurrence === 'monthly' ? 'Ежемес.' : 'Ежегод.'}
                        </span>
                      ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(exp)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">Ред.</button>
                        <button onClick={() => handleDelete(exp.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200">Удал.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 animate-fade-in">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">Назад</button>
          <span className="text-sm text-slate-500 dark:text-slate-400">Стр. {page} из {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">Вперед</button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50 animate-scale-in">
            <div className="p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">{editingExpense ? 'Редактировать расход' : 'Новый расход'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Категория</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : '' })} required className={inputCls}>
                    <option value="">Выберите категорию</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Сумма (в сумах)</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0.01" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Дата</label>
                  <input type="date" value={formData.spentAt} onChange={(e) => setFormData({ ...formData, spentAt: e.target.value })} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Описание</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} maxLength={500} className={inputCls} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Регулярный расход</label>
                </div>
                {formData.isRecurring && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Периодичность</label>
                    <select value={formData.recurrence} onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })} className={inputCls}>
                      <option value="">Выберите...</option>
                      <option value="monthly">Ежемесячно</option>
                      <option value="yearly">Ежегодно</option>
                    </select>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">Отмена</button>
                  <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm gradient-primary hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                    {submitting ? 'Сохранение...' : (editingExpense ? 'Сохранить' : 'Создать')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
