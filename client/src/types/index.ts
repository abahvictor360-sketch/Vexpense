export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type MessageRole = 'user' | 'assistant';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_color: string;
  country_code: string;
  country_name: string;
  currency: string;
  monthly_income: number;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  notes: string | null;
  date: string;
  payment_method: PaymentMethod;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  amount: number;
  created_at: string;
  category?: Category | null;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
}

export interface AiMessage {
  id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface EconomyData {
  countryCode: string;
  inflationRate: number | null;
  year: number | null;
  source: string;
}

export interface CountryOption {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

export interface BudgetWarning {
  category: Category;
  budget: number;
  spent: number;
  percentage: number;
}

export interface CategoryBreakdown {
  category: Category;
  amount: number;
  count: number;
  percentage: number;
}
