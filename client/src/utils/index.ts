import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { Expense, Category } from '../types';

export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateHeader(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  } catch {
    return dateStr;
  }
}

export function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce<Record<string, Expense[]>>((groups, expense) => {
    const date = expense.date.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});
}

export function getMonthRange(date = new Date()): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getCategoryTotal(
  expenses: Expense[],
  categoryId: string
): number {
  return expenses
    .filter(e => e.category_id === categoryId)
    .reduce((sum, e) => sum + Number(e.amount), 0);
}

export function calculateBreakdown(
  expenses: Expense[],
  categories: Category[]
) {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  return categories
    .map(cat => {
      const catExpenses = expenses.filter(e => e.category_id === cat.id);
      const amount = catExpenses.reduce((s, e) => s + Number(e.amount), 0);
      return {
        category: cat,
        amount,
        count: catExpenses.length,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    })
    .filter(b => b.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes'];
  const rows = expenses.map(e => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    `"${e.category?.name ?? 'Unknown'}"`,
    e.amount,
    e.payment_method,
    `"${(e.notes ?? '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vexpense_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Country data
export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', flag: '🇧🇩' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', flag: '🇨🇲' },
  { code: 'AO', name: 'Angola', currency: 'AOA', flag: '🇦🇴' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', flag: '🇲🇦' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', flag: '🇿🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN', flag: '🇲🇿' },
  { code: 'OTHER', name: 'Other', currency: 'USD', flag: '🌍' },
];
