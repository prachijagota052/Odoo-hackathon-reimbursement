import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Calendar, DollarSign, Tag } from 'lucide-react';

export const ExpenseHistory: React.FC = () => {
  const { user } = useAuth();
  const { expenses } = useData();
  const navigate = useNavigate();

  const userExpenses = useMemo(() => {
    return expenses.filter(exp => exp.employeeId === user?.id);
  }, [expenses, user?.id]);

  const draftExpenses = userExpenses.filter(exp => exp.status === 'draft');
  const pendingExpenses = userExpenses.filter(exp => exp.status === 'pending' || exp.status === 'submitted');
  const completedExpenses = userExpenses.filter(exp => exp.status === 'approved' || exp.status === 'rejected');

  const ExpenseCard = ({ expense }: { expense: typeof userExpenses[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-gray-500" />
              <span>{expense.category}</span>
            </div>
            <p className="text-sm text-gray-600">{expense.description}</p>
          </div>
          <StatusBadge status={expense.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Amount</p>
              <p>
                {expense.currency} {expense.amount.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-600">Date</p>
              <p>{new Date(expense.date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {expense.currency !== expense.baseCurrency && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
            <span className="text-gray-600">Converted: </span>
            <span>{expense.baseCurrency} {expense.convertedAmount.toFixed(2)}</span>
          </div>
        )}

        {expense.status === 'pending' && expense.approvals.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-600 mb-2">Approval Status:</p>
            <div className="space-y-1">
              {expense.approvals.map((approval, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    approval.status === 'approved' ? 'bg-green-500' :
                    approval.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-gray-600">{approval.approverName}</span>
                  <span className="capitalize text-gray-500">({approval.status})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expense.status === 'approved' && expense.approvals.some(a => a.timestamp) && (
          <div className="mt-3 pt-3 border-t text-sm text-green-600">
            Approved by {expense.approvals.find(a => a.status === 'approved')?.approverName} at{' '}
            {new Date(expense.approvals.find(a => a.timestamp)?.timestamp || '').toLocaleString()}
          </div>
        )}

        {expense.status === 'rejected' && expense.rejectionReason && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-red-600">
              <strong>Rejection Reason:</strong> {expense.rejectionReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl mb-2">My Expenses</h1>
            <p className="text-gray-600">Track and manage your expense submissions</p>
          </div>
          <Button onClick={() => navigate('/employee/submit')}>
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Waiting Approval ({pendingExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              To Submit ({draftExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedExpenses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingExpenses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  No expenses waiting for approval
                </CardContent>
              </Card>
            ) : (
              pendingExpenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            {draftExpenses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  No draft expenses
                </CardContent>
              </Card>
            ) : (
              draftExpenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedExpenses.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  No completed expenses
                </CardContent>
              </Card>
            ) : (
              completedExpenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
