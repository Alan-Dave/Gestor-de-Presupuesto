/**
 * HTTP API client with JWT auth header injection.
 */
const API_BASE = import.meta.env.VITE_API_BASE || (window.location.port === '5173' ? 'http://localhost:8000/api' : '/api');

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error de red' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/* ── Auth ──────────────────────────────────────────────────────────── */
import type {
  TokenResponse, RegisterData, LoginData, User,
  Account, AccountCreateData,
  Transaction, TransactionCreateData, TransferCreateData,
  Budget, BudgetCreateData, BudgetSummary,
  Rule, RuleCreateData,
  DashboardMetrics, Currency,
  Installment, InstallmentCreateData, InstallmentSummary,
} from '../types';

export const authApi = {
  register: (data: RegisterData) =>
    request<TokenResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: LoginData) =>
    request<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<User>('/auth/me'),
};

/* ── Accounts ─────────────────────────────────────────────────────── */
export const accountsApi = {
  list: () => request<Account[]>('/accounts/'),
  create: (data: AccountCreateData) =>
    request<Account>('/accounts/', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: number) => request<Account>(`/accounts/${id}`),
  update: (id: number, data: Partial<AccountCreateData>) =>
    request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/accounts/${id}`, { method: 'DELETE' }),
};

/* ── Transactions ─────────────────────────────────────────────────── */
export const transactionsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Transaction[]>(`/transactions/${qs}`);
  },
  pending: () => request<Transaction[]>('/transactions/pending'),
  ingest: (data: TransactionCreateData) =>
    request<Transaction>('/transactions/ingest', { method: 'POST', body: JSON.stringify(data) }),
  classify: (id: number, category: string) =>
    request<Transaction>(`/transactions/${id}/classify`, {
      method: 'PUT',
      body: JSON.stringify({ category }),
    }),
  reassign: (id: number, account_id: number) =>
    request<Transaction>(`/transactions/${id}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ account_id }),
    }),
  transfer: (data: TransferCreateData) =>
    request<Transaction[]>('/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),
};

/* ── Budgets ──────────────────────────────────────────────────────── */
export const budgetsApi = {
  list: (year?: number, month?: number) => {
    const params: Record<string, string> = {};
    if (year) params.year = String(year);
    if (month) params.month = String(month);
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request<Budget[]>(`/budgets/${qs}`);
  },
  create: (data: BudgetCreateData) =>
    request<Budget>('/budgets/', { method: 'POST', body: JSON.stringify(data) }),
  summary: (year?: number, month?: number) => {
    const params: Record<string, string> = {};
    if (year) params.year = String(year);
    if (month) params.month = String(month);
    const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request<BudgetSummary[]>(`/budgets/summary${qs}`);
  },
};

/* ── Rules ────────────────────────────────────────────────────────── */
export const rulesApi = {
  list: () => request<Rule[]>('/rules/'),
  create: (data: RuleCreateData) =>
    request<Rule>('/rules/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<RuleCreateData>) =>
    request<Rule>(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/rules/${id}`, { method: 'DELETE' }),
};

/* ── Dashboard ────────────────────────────────────────────────────── */
export const dashboardApi = {
  metrics: () => request<DashboardMetrics>('/dashboard/metrics'),
};

/* ── Currencies ───────────────────────────────────────────────────── */
export const currenciesApi = {
  list: () => request<Currency[]>('/currencies/'),
};

/* ── Installments (Cuotas) ────────────────────────────────────────── */
export const installmentsApi = {
  list: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<Installment[]>(`/installments/${qs}`);
  },
  summary: () => request<InstallmentSummary>('/installments/summary'),
  get: (id: number) => request<Installment>(`/installments/${id}`),
  create: (data: InstallmentCreateData) =>
    request<Installment>('/installments/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<InstallmentCreateData> & { status?: string }) =>
    request<Installment>(`/installments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  payNext: (id: number) =>
    request<Installment>(`/installments/${id}/pay-next`, { method: 'POST' }),
  delete: (id: number) =>
    request<void>(`/installments/${id}`, { method: 'DELETE' }),
};

/* ── Email Integration ────────────────────────────────────────────── */
import type { EmailIntegration, EmailIntegrationCreateData, EmailSyncResult } from '../types';

export const emailApi = {
  getConfig: () => request<EmailIntegration>('/email/config'),
  saveConfig: (data: EmailIntegrationCreateData) =>
    request<EmailIntegration>('/email/config', { method: 'POST', body: JSON.stringify(data) }),
  sync: () => request<EmailSyncResult>('/email/sync', { method: 'POST' }),
};
