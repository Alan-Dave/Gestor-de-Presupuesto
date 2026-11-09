/* TypeScript interfaces matching the backend Pydantic schemas */

export interface User {
  id: number;
  email: string;
  username: string;
  currency_code: string;
  locale: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: string;
  initial_balance: number;
  current_balance: number;
  currency_code: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Transaction {
  id: number;
  account_id: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  status: 'PENDING' | 'CLASSIFIED' | 'TRANSFER';
  category: 'FIXED' | 'PERSONAL' | 'SAVINGS' | 'TRANSFER' | null;
  amount: number;
  description: string;
  raw_description: string | null;
  linked_transaction_id: number | null;
  budget_id: number | null;
  rule_id: number | null;
  transaction_date: string;
  created_at: string;
  updated_at: string | null;
  account_name: string | null;
  account_color: string | null;
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  monthly_limit: number;
  annual_limit: number | null;
  year: number;
  month: number;
  created_at: string;
  updated_at: string | null;
}

export interface BudgetSummary {
  category: string;
  monthly_limit: number;
  annual_limit: number | null;
  spent_this_month: number;
  spent_this_year: number;
  month_progress_pct: number;
  year_progress_pct: number | null;
}

export interface Rule {
  id: number;
  user_id: number;
  keyword: string;
  category: string;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface DashboardMetrics {
  total_balance: number;
  liquid_balance: number;
  pending_amount: number;
  total_income_month: number;
  total_expenses_month: number;
  pending_count: number;
  budget_summaries: BudgetSummary[];
  accounts_count: number;
  currency_code: string;
  currency_symbol: string;
  active_installments_monthly: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  locale: string;
  flag: string;
  country: string;
}

/* Request DTOs */
export interface RegisterData {
  email: string;
  username: string;
  password: string;
  currency_code: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AccountCreateData {
  name: string;
  type: string;
  initial_balance: number;
  currency_code?: string;
  icon?: string;
  color?: string;
}

export interface TransactionCreateData {
  account_id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  transaction_date?: string;
}

export interface TransferCreateData {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description?: string;
  transaction_date?: string;
}

export interface BudgetCreateData {
  category: string;
  monthly_limit: number;
  annual_limit?: number;
  year: number;
  month: number;
}

export interface RuleCreateData {
  keyword: string;
  category: string;
  is_active?: boolean;
  priority?: number;
}

export interface EmailIntegration {
  id: number;
  user_id: number;
  imap_server: string;
  imap_port: number;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export interface EmailIntegrationCreateData {
  imap_server?: string;
  imap_port?: number;
  app_password: string;
}

export interface EmailSyncResult {
  success: boolean;
  transactions_added: number;
  message: string;
}

export interface Installment {
  id: number;
  user_id: number;
  account_id: number | null;
  account_name: string | null;
  account_color: string | null;
  description: string;
  total_amount: number;
  installment_amount: number;
  total_installments: number;
  paid_installments: number;
  remaining_installments: number;
  paid_amount: number;
  remaining_amount: number;
  progress_pct: number;
  start_date: string;
  category: string;
  status: 'ACTIVE' | 'COMPLETED';
  created_at: string;
  updated_at: string | null;
}

export interface InstallmentCreateData {
  account_id?: number | null;
  description: string;
  total_amount: number;
  installment_amount?: number;
  total_installments: number;
  paid_installments?: number;
  start_date?: string;
  category?: string;
}

export interface InstallmentSummary {
  total_active_debt: number;
  total_paid_debt: number;
  monthly_commitment: number;
  active_count: number;
  completed_count: number;
}
