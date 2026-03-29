import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { StatusBadge } from '../components/StatusBadge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, DollarSign, Tag, Calendar, User } from 'lucide-react';
import { Expense } from '../types';

export const ManagerInbox: React.FC = () => {
  const { user } = useAuth();
  const { expenses, updateExpense, approvalRules } = useData();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const pendingApproval = exp.approvals.find(
        a => a.approverId === user?.id && a.status === 'pending'
      );
      
      // Check if this is the current approver in sequence
      const sortedApprovals = [...exp.approvals].sort((a, b) => a.order - b.order);
      const firstPending = sortedApprovals.find(a => a.status === 'pending');
      
      return pendingApproval && firstPending?.approverId === user?.id && (exp.status === 'pending' || exp.status === 'submitted');
    });
  }, [expenses, user?.id]);

  const reviewedExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const myApproval = exp.approvals.find(a => a.approverId === user?.id);
      return myApproval && (myApproval.status === 'approved' || myApproval.status === 'rejected');
    });
  }, [expenses, user?.id]);

  const handleApprove = (expense: Expense) => {
    // Find the approval rule for this expense category
    const rule = approvalRules.find(r => r.category === expense.category);
    
    const updatedApprovals = expense.approvals.map(approval => {
      if (approval.approverId === user?.id) {
        return {
          ...approval,
          status: 'approved' as const,
          timestamp: new Date().toISOString(),
        };
      }
      return approval;
    });

    // Check for specific approver auto-approve rule
    if (rule?.specificApprover && rule.specificApprover !== 'none' && user?.id === rule.specificApprover) {
      // Auto-approve all remaining approvals
      updatedApprovals.forEach(approval => {
        if (approval.status === 'pending') {
          approval.status = 'approved';
          approval.timestamp = new Date().toISOString();
        }
      });
      
      updateExpense(expense.id, {
        approvals: updatedApprovals,
        status: 'approved',
      });
      
      toast.success('Expense auto-approved! (Specific Approver Rule)');
      return;
    }

    // Calculate approval percentage
    const totalApprovers = updatedApprovals.length;
    const approvedCount = updatedApprovals.filter(a => a.status === 'approved').length;
    const approvalPercentage = (approvedCount / totalApprovers) * 100;

    // Check percentage rule
    const percentageRequired = rule?.percentageRequired || 100;
    let finalStatus: 'pending' | 'approved' | 'rejected' = 'pending';

    if (approvalPercentage >= percentageRequired) {
      finalStatus = 'approved';
      toast.success(`Expense approved! (${approvalPercentage.toFixed(0)}% approval reached)`);
    } else {
      // Check if all approvals are completed
      const allApproved = updatedApprovals.every(a => a.status === 'approved');
      const anyRejected = updatedApprovals.some(a => a.status === 'rejected');

      if (allApproved) {
        finalStatus = 'approved';
        toast.success('Expense approved successfully!');
      } else if (anyRejected) {
        finalStatus = 'rejected';
      } else {
        toast.success('Approval recorded. Waiting for next approver in sequence.');
      }
    }

    updateExpense(expense.id, {
      approvals: updatedApprovals,
      status: finalStatus,
    });
  };

  const handleReject = (expense: Expense) => {
    setSelectedExpense(expense);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!selectedExpense || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const updatedApprovals = selectedExpense.approvals.map(approval => {
      if (approval.approverId === user?.id) {
        return {
          ...approval,
          status: 'rejected' as const,
          timestamp: new Date().toISOString(),
          comments: rejectionReason,
        };
      }
      return approval;
    });

    updateExpense(selectedExpense.id, {
      approvals: updatedApprovals,
      status: 'rejected',
      rejectionReason,
    });

    toast.success('Expense rejected');
    setRejectDialogOpen(false);
    setRejectionReason('');
    setSelectedExpense(null);
  };

  const ExpenseReviewCard = ({ expense, isPending }: { expense: Expense; isPending: boolean }) => {
    const myApproval = expense.approvals.find(a => a.approverId === user?.id);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{expense.category}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
            </div>
            <StatusBadge status={expense.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expense Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Requestor</p>
                <p className="font-medium">{expense.employeeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium">
                  {expense.baseCurrency} {expense.convertedAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{new Date(expense.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{expense.category}</p>
              </div>
            </div>
          </div>

          {/* Original Amount if converted */}
          {expense.currency !== expense.baseCurrency && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <span className="text-gray-600">Original Amount: </span>
              <span className="font-medium">
                {expense.currency} {expense.amount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Approval Chain */}
          {expense.approvals.length > 1 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">Approval Chain:</p>
              <div className="space-y-2">
                {expense.approvals.map((approval, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        approval.status === 'approved' ? 'bg-green-500' :
                        approval.status === 'rejected' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`} />
                      <span>{approval.approverName}</span>
                    </div>
                    <span className={`capitalize ${
                      approval.status === 'approved' ? 'text-green-600' :
                      approval.status === 'rejected' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {approval.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons or Status */}
          {isPending ? (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => handleApprove(expense)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(expense)}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          ) : (
            <div className={`p-3 rounded-lg text-sm ${
              myApproval?.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <p className="font-medium">
                {myApproval?.status === 'approved' ? '✓ Approved' : '✗ Rejected'} by you
                {myApproval?.timestamp && ` at ${new Date(myApproval.timestamp).toLocaleString()}`}
              </p>
              {myApproval?.comments && (
                <p className="mt-1 text-sm">Reason: {myApproval.comments}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Approval Inbox</h1>
          <p className="text-gray-600">Review and approve expense requests</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-2xl">{pendingExpenses.length}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl">
                  {reviewedExpenses.filter(e => e.approvals.find(a => a.approverId === user?.id)?.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-700" />
              </div>
              <div>
                <p className="text-2xl">
                  {reviewedExpenses.filter(e => e.approvals.find(a => a.approverId === user?.id)?.status === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Reviews */}
        <div className="mb-8">
          <h2 className="text-xl mb-4">Pending Reviews</h2>
          {pendingExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No expenses pending your review
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingExpenses.map(expense => (
                <ExpenseReviewCard key={expense.id} expense={expense} isPending={true} />
              ))}
            </div>
          )}
        </div>

        {/* Reviewed Expenses */}
        <div>
          <h2 className="text-xl mb-4">Recently Reviewed</h2>
          {reviewedExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No reviewed expenses
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reviewedExpenses.slice(0, 6).map(expense => (
                <ExpenseReviewCard key={expense.id} expense={expense} isPending={false} />
              ))}
            </div>
          )}
        </div>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Rejection Reason *
                </label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmReject} className="flex-1">
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};