import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { useExpenseStore } from '../../store/expenseStore';
import { useBudgetStore } from '../../store/budgetStore';
import { useCategoryStore } from '../../store/categoryStore';

export function AppLayout() {
  const { user } = useAuthStore();
  const fetchExpenses   = useExpenseStore(s => s.fetchExpenses);
  const fetchBudgets    = useBudgetStore(s => s.fetchBudgets);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);

  useEffect(() => {
    if (user?.id) {
      fetchExpenses(user.id);
      fetchBudgets(user.id);
      fetchCategories(user.id);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '10px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#534AB7', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
