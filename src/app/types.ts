export type UserRole = 'employee' | 'manager' | 'admin';

export type ExpenseStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  assignedManagerId?: string;
  country?: string;
  baseCurrency?: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  baseCurrency: string;
  category: string;
  description: string;
  date: string;
  status: ExpenseStatus;
  receiptUrl?: string;
  approvals: ApprovalStep[];
  rejectionReason?: string;
  createdAt: string;
}

export interface ApprovalStep {
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comments?: string;
  order: number;
}

export interface ApprovalRule {
  id: string;
  category: string;
  isManagerApprover: boolean;
  approvers: { id: string; name: string; order: number }[];
  percentageRequired?: number;
  specificApprover?: string;
}

export interface Country {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
}
