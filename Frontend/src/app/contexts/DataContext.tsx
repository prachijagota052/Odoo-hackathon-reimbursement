import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense, ApprovalRule, User } from '../types';

interface DataContextType {
  expenses: Expense[];
  approvalRules: ApprovalRule[];
  users: User[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  addApprovalRule: (rule: Omit<ApprovalRule, 'id'>) => void;
  updateApprovalRule: (id: string, updates: Partial<ApprovalRule>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const MOCK_USERS: User[] = [
  { id: '1', name: 'John Smith', email: 'john@company.com', role: 'manager', baseCurrency: 'USD' },
  { id: '2', name: 'Mitchell Brown', email: 'mitchell@company.com', role: 'manager', baseCurrency: 'USD' },
  { id: '3', name: 'Andreas Weber', email: 'andreas@company.com', role: 'admin', baseCurrency: 'EUR' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'manager', baseCurrency: 'USD' },
  { id: '5', name: 'Emily Chen', email: 'emily@company.com', role: 'employee', assignedManagerId: '1', baseCurrency: 'USD' },
  { id: '6', name: 'Michael Lee', email: 'michael@company.com', role: 'employee', assignedManagerId: '1', baseCurrency: 'USD' },
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: '1',
    employeeId: '5',
    employeeName: 'Emily Chen',
    amount: 85.50,
    currency: 'EUR',
    convertedAmount: 92.00,
    baseCurrency: 'USD',
    category: 'Meals & Entertainment',
    description: 'Dinner at La Piazza Restaurant',
    date: '2026-03-27',
    status: 'pending',
    approvals: [
      { approverId: '1', approverName: 'John Smith', status: 'pending', order: 1 },
      { approverId: '2', approverName: 'Mitchell Brown', status: 'pending', order: 2 },
    ],
    createdAt: '2026-03-27T14:30:00Z',
  },
  {
    id: '2',
    employeeId: '6',
    employeeName: 'Michael Lee',
    amount: 150.00,
    currency: 'USD',
    convertedAmount: 150.00,
    baseCurrency: 'USD',
    category: 'Transportation',
    description: 'Taxi to client meeting',
    date: '2026-03-28',
    status: 'approved',
    approvals: [
      { approverId: '1', approverName: 'John Smith', status: 'approved', order: 1, timestamp: '2026-03-28T10:15:00Z' },
    ],
    createdAt: '2026-03-28T09:00:00Z',
  },
  {
    id: '3',
    employeeId: '5',
    employeeName: 'Emily Chen',
    amount: 45.00,
    currency: 'USD',
    convertedAmount: 45.00,
    baseCurrency: 'USD',
    category: 'Office Supplies',
    description: 'Notebooks and pens',
    date: '2026-03-26',
    status: 'draft',
    approvals: [],
    createdAt: '2026-03-26T16:00:00Z',
  },
];

const MOCK_APPROVAL_RULES: ApprovalRule[] = [
  {
    id: '1',
    category: 'Miscellaneous Expenses',
    isManagerApprover: true,
    approvers: [
      { id: '1', name: 'John Smith', order: 1 },
      { id: '2', name: 'Mitchell Brown', order: 2 },
      { id: '3', name: 'Andreas Weber', order: 3 },
    ],
    percentageRequired: 60,
  },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Initialize with mock data
    const storedExpenses = localStorage.getItem('expenses');
    const storedRules = localStorage.getItem('approvalRules');
    const storedUsers = localStorage.getItem('allUsers');
    const authUsers = localStorage.getItem('users');

    setExpenses(storedExpenses ? JSON.parse(storedExpenses) : MOCK_EXPENSES);
    setApprovalRules(storedRules ? JSON.parse(storedRules) : MOCK_APPROVAL_RULES);
    setUsers(storedUsers ? JSON.parse(storedUsers) : MOCK_USERS);
    
    // Initialize auth users if not present
    if (!authUsers) {
      localStorage.setItem('users', JSON.stringify(MOCK_USERS));
    }
  }, []);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(exp => exp.id === id ? { ...exp, ...updates } : exp);
    setExpenses(updated);
    localStorage.setItem('expenses', JSON.stringify(updated));
  };

  const addApprovalRule = (rule: Omit<ApprovalRule, 'id'>) => {
    const newRule = { ...rule, id: Date.now().toString() };
    const updated = [...approvalRules, newRule];
    setApprovalRules(updated);
    localStorage.setItem('approvalRules', JSON.stringify(updated));
  };

  const updateApprovalRule = (id: string, updates: Partial<ApprovalRule>) => {
    const updated = approvalRules.map(rule => rule.id === id ? { ...rule, ...updates } : rule);
    setApprovalRules(updated);
    localStorage.setItem('approvalRules', JSON.stringify(updated));
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Date.now().toString() };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('allUsers', JSON.stringify(updated));
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const updated = users.map(user => user.id === id ? { ...user, ...updates } : user);
    setUsers(updated);
    localStorage.setItem('allUsers', JSON.stringify(updated));
  };

  return (
    <DataContext.Provider value={{
      expenses,
      approvalRules,
      users,
      addExpense,
      updateExpense,
      addApprovalRule,
      updateApprovalRule,
      addUser,
      updateUser,
    }}>
      {children}
    </DataContext.Provider>
  );
};