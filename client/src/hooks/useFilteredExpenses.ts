import { useMemo } from 'react';
import { useExpenseStore } from '../store/expenseStore';
import type { Expense } from '../types';

export function useFilteredExpenses(): Expense[] {
  const expenses = useExpenseStore(s => s.expenses);
  const filter = useExpenseStore(s => s.filter);

  return useMemo(() => {
    let result = [...expenses];

    if (filter.categoryId) {
      result = result.filter(e => e.category_id === filter.categoryId);
    }

    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      result = result.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.category?.name.toLowerCase().includes(q)
      );
    }

    if (filter.startDate) {
      result = result.filter(e => e.date >= filter.startDate!);
    }

    if (filter.endDate) {
      result = result.filter(e => e.date <= filter.endDate!);
    }

    if (filter.paymentMethod) {
      result = result.filter(e => e.payment_method === filter.paymentMethod);
    }

    return result;
  }, [expenses, filter]);
}
