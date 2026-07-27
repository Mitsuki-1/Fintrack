import apiClient from './client';
import type {
  User,
  IncomeSource,
  Income,
  Category,
  Expense,
  PaginatedResponse,
  SummaryResponse,
  SummaryByCategoryResponse,
  SummaryBySourceResponse,
  RecurringResponse,
} from '../types';

// ─── Auth ──────────────────────────────────────────────────────

export const register = (data: { email: string; password: string; displayName?: string }) =>
  apiClient.post<{ user: User; token: string }>('/auth/register', data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  apiClient.post<{ user: User; token: string }>('/auth/login', data).then((r) => r.data);

export const getMe = () =>
  apiClient.get<{ user: User }>('/auth/me').then((r) => r.data);

// ─── Income Sources ────────────────────────────────────────────

export const getIncomeSources = () =>
  apiClient.get<IncomeSource[]>('/income-sources').then((r) => r.data);

export const createIncomeSource = (data: { name: string; type: string }) =>
  apiClient.post<IncomeSource>('/income-sources', data).then((r) => r.data);

export const updateIncomeSource = (id: number, data: Partial<{ name: string; type: string; isActive: boolean }>) =>
  apiClient.patch<IncomeSource>(`/income-sources/${id}`, data).then((r) => r.data);

export const deleteIncomeSource = (id: number) =>
  apiClient.delete(`/income-sources/${id}`);

// ─── Incomes ───────────────────────────────────────────────────

export const getIncomes = (params: {
  from?: string;
  to?: string;
  sourceId?: number;
  page?: number;
  limit?: number;
}) =>
  apiClient.get<PaginatedResponse<Income>>('/incomes', { params }).then((r) => r.data);

export const getIncome = (id: number) =>
  apiClient.get<Income>(`/incomes/${id}`).then((r) => r.data);

export const createIncome = (data: {
  sourceId?: number | null;
  amountMinor: number;
  currency?: string;
  receivedAt: string;
  note?: string | null;
  isRecurring?: boolean;
  recurrence?: string | null;
}) =>
  apiClient.post<Income>('/incomes', data).then((r) => r.data);

export const updateIncome = (id: number, data: Partial<{
  sourceId: number | null;
  amountMinor: number;
  currency: string;
  receivedAt: string;
  note: string | null;
  isRecurring: boolean;
  recurrence: string | null;
}>) =>
  apiClient.patch<Income>(`/incomes/${id}`, data).then((r) => r.data);

export const deleteIncome = (id: number) =>
  apiClient.delete(`/incomes/${id}`);

// ─── Categories ────────────────────────────────────────────────

export const getCategories = () =>
  apiClient.get<Category[]>('/categories').then((r) => r.data);

export const createCategory = (data: { name: string; kind?: string; color?: string }) =>
  apiClient.post<Category>('/categories', data).then((r) => r.data);

export const updateCategory = (id: number, data: Partial<{ name: string; kind: string; color: string }>) =>
  apiClient.patch<Category>(`/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id: number) =>
  apiClient.delete(`/categories/${id}`);

// ─── Expenses ──────────────────────────────────────────────────

export const getExpenses = (params: {
  from?: string;
  to?: string;
  categoryId?: number;
  page?: number;
  limit?: number;
}) =>
  apiClient.get<PaginatedResponse<Expense>>('/expenses', { params }).then((r) => r.data);

export const getExpense = (id: number) =>
  apiClient.get<Expense>(`/expenses/${id}`).then((r) => r.data);

export const createExpense = (data: {
  categoryId: number;
  amountMinor: number;
  currency?: string;
  spentAt: string;
  description?: string | null;
  isRecurring?: boolean;
  recurrence?: string | null;
}) =>
  apiClient.post<Expense>('/expenses', data).then((r) => r.data);

export const updateExpense = (id: number, data: Partial<{
  categoryId: number;
  amountMinor: number;
  currency: string;
  spentAt: string;
  description: string | null;
  isRecurring: boolean;
  recurrence: string | null;
}>) =>
  apiClient.patch<Expense>(`/expenses/${id}`, data).then((r) => r.data);

export const deleteExpense = (id: number) =>
  apiClient.delete(`/expenses/${id}`);

// ─── Summary ───────────────────────────────────────────────────

export const getSummary = (month: string) =>
  apiClient.get<SummaryResponse>('/summary', { params: { month } }).then((r) => r.data);

export const getSummaryByCategory = (month: string) =>
  apiClient.get<SummaryByCategoryResponse>('/summary/by-category', { params: { month } }).then((r) => r.data);

export const getSummaryBySource = (month: string) =>
  apiClient.get<SummaryBySourceResponse>('/summary/by-source', { params: { month } }).then((r) => r.data);

export const getRecurring = () =>
  apiClient.get<RecurringResponse>('/summary/recurring').then((r) => r.data);