import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { ApprovalRules } from './pages/ApprovalRules';
import { SubmitExpense } from './pages/SubmitExpense';
import { ExpenseHistory } from './pages/ExpenseHistory';
import { ManagerInbox } from './pages/ManagerInbox';
import { AppLayout } from './components/AppLayout';
import { DataProvider } from './contexts/DataContext';
import { Toaster } from './components/ui/sonner';

const AuthWrapper = () => (
  <>
    <Outlet />
    <Toaster position="top-right" />
  </>
);

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthWrapper />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { index: true, element: <Navigate to="/auth/login" replace /> },
    ],
  },
  {
    path: '/',
    element: (
      <DataProvider>
        <AppLayout />
        <Toaster position="top-right" />
      </DataProvider>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      // Admin routes
      { path: 'admin/users', element: <UserManagement /> },
      { path: 'admin/approval-rules', element: <ApprovalRules /> },
      // Manager routes
      { path: 'manager/inbox', element: <ManagerInbox /> },
      // Employee routes
      { path: 'employee/submit', element: <SubmitExpense /> },
      { path: 'employee/history', element: <ExpenseHistory /> },
    ],
  },
]);