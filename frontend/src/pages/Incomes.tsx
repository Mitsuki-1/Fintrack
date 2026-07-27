import { useState, useEffect } from 'react';
import { getIncomes, getIncomeSources, createIncome, updateIncome, deleteIncome, createIncomeSource } from '../api/endpoints';
import type { Income, IncomeSource } from '../types';
import { formatAmount } from '../utils/format';

const LIMIT = 10;

export default function Incomes() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterSourceId, setFilterSourceId] = useState<number | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState({ sourceId: '' as number | '', amount: '', receivedAt: '', note: '', isRecurring: false, recurrence: '' as string });
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState<'salary' | 'freelance' | 'other'>('salary');
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
    if (filterSourceId) params.sourceId = filterSourceId;
    getIncomes(params)
      .then((data) => { if (!cancelled) { setIncomes(data.items); setTotal(data.total); } })
      .catch((err: any) => { if (!cancelled) setError(err?.response?.data?.error?.message || 'Ошибка загрузки'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month, page, filterSourceId]);

  useEffect(() => {
    getIncomeSources()
      .then(setSources)
      .catch((err: any) => setError(err?.response?.data?.error?.message || 'Не удалось загрузить источники'));
  }, []);

  const today = new Date();

  const openCreate = () => {
    setEditingIncome(null);
    setFormData({ sourceId: sources.length > 0 ? sources[0].id : '', amount: '', receivedAt: today.toISOString().slice(0, 10), note: '', isRecurring: false, recurrence: '' });
    setShowForm(true);
  };

  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setFormData({ sourceId: income.sourceId ?? '', amount: String(income.amountMinor / 100), receivedAt: income.receivedAt, note: income.note ?? '', isRecurring: income.isRecurring, recurrence: income.recurrence ?? '' });
    setShowForm(true);
  };

  const reload = () => {
    const [year, mon] = month.split('-').map(Number);
    const from = `${year}-${String(mon).padStart(2, '0')}-01`;
    const nextMonth = mon === 12 ? 1 : mon + 1;
    const nextYear = mon === 12 ? year + 1 : year;
    const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const params: any = { page, limit: LIMIT, from, to };
    if (filterSourceId) params.sourceId = filterSourceId;
    getIncomes(params).then((data) => { setIncomes(data.items); setTotal(data.total); }).catch(() => {});
  };

  const reloadSources = () => {
    getIncomeSources().then(setSources).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { sourceId: formData.sourceId ? Number(formData.sourceId) : null, amountMinor: Math.round(Number(formData.amount) * 100), currency: 'UZS', receivedAt: formData.receivedAt, note: formData.note || null, isRecurring: formData.isRecurring, recurrence: formData.isRecurring ? formData.recurrence : null };
      if (editingIncome) { await updateIncome(editingIncome.id, payload); } else { await createIncome(payload); }
      setShowForm(false);
      reload();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот доход?')) return;
    try { await deleteIncome(id); reload(); } catch (err: any) { setError(err?.response?.data?.error?.message || 'Ошибка удаления'); }
  };

  const handleCreateSource = async () => {
    if (!newSourceName.trim()) return;
    try { await createIncomeSource({ name: newSourceName.trim(), type: newSourceType }); setNewSourceName(''); reloadSources(); } catch (err: any) { setError(err?.response?.data?.error?.message || 'Ошибка создания источника'); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all duration-200";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Доходы</h1>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm">
          + Добавить доход
        </button>
      </div>

      {/* Source Creator */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-slide-up">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Создать источник дохода</h3>
        <div className="flex flex-wrap gap-3">
          <input placeholder="Название (напр. PROWEB)" value={newSourceName} onChange={(e) => setNewSourceName(e.target.value)} className={inputCls + " flex-1 min-w-[200px]"} />
          <select value={newSourceType} onChange={(e) => setNewSourceType(e.target.value as any)} className={inputCls + " w-auto"}>
            <option value="salary">Зарплата</option>
            <option value="freelance">Фриланс</option>
            <option value="other">Другое</option>
          </select>
          <button onClick={handleCreateSource} className="px-5 py-2.5 rounded-xl font-semibold text-white gradient-primary hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm">Создать</button>
        </div>
        {sources.length > 0 && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Источники: {sources.filter(s => s.isActive).map(s => s.name).join(', ')}</p>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Месяц</label>
          <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} className={inputCls + " w-auto"} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Источник</label>
          <select value={filterSourceId} onChange={(e) => { setFilterSourceId(e.target.value ? Number(e.target.value) : ''); setPage(1); }} className={inputCls + " w-auto"}>
            <option value="">Все</option>
            {sources.filter(s => s.isActive).map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
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
        ) : incomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <span className="text-5xl mb-3">💰</span>
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">Доходов нет</h3>
            <p className="text-sm">Добавьте первый доход за этот месяц</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Дата</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Источник</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Сумма</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:table-cell">Примечание</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden md:table-cell">Повтор</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {incomes.map((inc) => {
                  const source = sources.find((s) => s.id === inc.sourceId);
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{inc.receivedAt}</td>
                      <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{source?.name || '—'}</td>
                      <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">{formatAmount(inc.amountMinor)} сум</td>
                      <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">{inc.note || '—'}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {inc.isRecurring ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
                            {inc.recurrence === 'monthly' ? 'Ежемес.' : 'Ежегод.'}
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(inc)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">Ред.</button>
                          <button onClick={() => handleDelete(inc.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-200">Удал.</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">{editingIncome ? 'Редактировать доход' : 'Новый доход'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Источник</label>
                  <select value={formData.sourceId} onChange={(e) => setFormData({ ...formData, sourceId: e.target.value ? Number(e.target.value) : '' })} className={inputCls}>
                    <option value="">Без источника</option>
                    {sources.filter(s => s.isActive).map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Сумма (в сумах)</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0.01" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Дата получения</label>
                  <input type="date" value={formData.receivedAt} onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Примечание</label>
                  <input type="text" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} maxLength={500} className={inputCls} />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Регулярный доход</label>
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
                    {submitting ? 'Сохранение...' : (editingIncome ? 'Сохранить' : 'Создать')}
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
