import { useMemo } from 'react';
import { useExpenseStore } from '../store/expenseStore';
import { useBudgetStore } from '../store/budgetStore';
import type { BudgetWarning } from '../types';
import { getMonthRange } from '../utils';

export function useBudgetWarnings(threshold = 0.75): BudgetWarning[] {
  const expenses = useExpenseStore(s => s.expenses);
  const budgets = useBudgetStore(s => s.budgets);

  return useMemo(() => {
    const { start, end } = getMonthRange();
    const monthExpenses = expenses.filter(e => e.date >= start && e.date <= end);

    const categoryTotals: Record<string, number> = {};
    monthExpenses.forEach(e => {
      if (e.category_id) {
        categoryTotals[e.category_id] = (categoryTotals[e.category_id] ?? 0) + Number(e.amount);
      }
    });

    return budgets
      .filter(b => {
        const spent = categoryTotals[b.category_id] ?? 0;
        return b.amount > 0 && spent / b.amount >= threshold;
      })
      .map(b => ({
        category: b.category!,
        budget: Number(b.amount),
        spent: categoryTotals[b.category_id] ?? 0,
        percentage: ((categoryTotals[b.category_id] ?? 0) / Number(b.amount)) * 100,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [expenses, budgets, threshold]);
}
