// ─── Enums ────────────────────────────────────────────────
export type IncomeSourceType = 'salary' | 'freelance' | 'other';
export type CategoryKind = 'subscription' | 'utility' | 'groceries' | 'rent' | 'other';
export type Recurrence = 'monthly' | 'yearly';

// ─── User ─────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string | null;
  defaultCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: number;
  email: string;
  displayName: string | null;
  defaultCurrency: string;
  createdAt: string;
}

// ─── Income Source ────────────────────────────────────────
export interface IncomeSource {
  id: number;
  userId: number;
  name: string;
  type: IncomeSourceType;
  isActive: boolean;
  createdAt: string;
}

// ─── Income ───────────────────────────────────────────────
export interface Income {
  id: number;
  userId: number;
  sourceId: number | null;
  amountMinor: number;
  currency: string;
  receivedAt: string;
  note: string | null;
  isRecurring: boolean;
  recurrence: Recurrence | null;
  createdAt: string;
}

// ─── Category ─────────────────────────────────────────────
export interface Category {
  id: number;
  userId: number | null;
  name: string;
  kind: CategoryKind;
  icon: string | null;
  color: string | null;
}

// ─── Expense ──────────────────────────────────────────────
export interface Expense {
  id: number;
  userId: number;
  categoryId: number;
  amountMinor: number;
  currency: string;
  spentAt: string;
  description: string | null;
  isRecurring: boolean;
  recurrence: Recurrence | null;
  createdAt: string;
}

// ─── Pagination ───────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

// ─── Summary ──────────────────────────────────────────────
export interface SummaryResponse {
  month: string;
  currency: string;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  balanceMinor: number;
}

export interface SummaryByCategoryItem {
  categoryId: number;
  name: string;
  kind: CategoryKind;
  totalMinor: number;
}

export interface SummaryBySourceItem {
  sourceId: number | null;
  name: string | null;
  totalMinor: number;
}

export interface RecurringItem {
  type: 'income' | 'expense';
  categoryId?: number;
  sourceId?: number;
  name: string;
  amountMinor: number;
  recurrence: Recurrence;
}

export interface RecurringResponse {
  monthlyExpenseMinor: number;
  items: RecurringItem[];
}

// ─── Error ────────────────────────────────────────────────
export interface AppError {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

// ─── Express extension ────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}