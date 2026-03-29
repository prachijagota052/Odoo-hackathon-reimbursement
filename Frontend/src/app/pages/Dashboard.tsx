import React from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, 
  Settings, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  DollarSign 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { expenses, users } = useData();
  const navigate = useNavigate();

  const userExpenses = expenses.filter(exp => exp.employeeId === user?.id);
  const pendingApprovals = expenses.filter(exp => {
    const pendingApproval = exp.approvals.find(
      a => a.approverId === user?.id && a.status === 'pending'
    );
    return pendingApproval && (exp.status === 'pending' || exp.status === 'submitted');
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">
            {user.role === 'admin' ? 'Manage your reimbursement system' :
             user.role === 'manager' ? 'Review pending expense approvals' :
             'Track and submit your expenses'}
          </p>
        </div>

        {/* Admin Dashboard */}
        {user.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl mb-2">{users.length}</p>
                <p className="text-gray-600">Total Users</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/approval-rules')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Approval Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl mb-2">Configure</p>
                <p className="text-gray-600">Workflow Settings</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl mb-2">{expenses.length}</p>
                <p className="text-gray-600">All Submissions</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manager Dashboard */}
        {user.role === 'manager' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                  <div>
                    <p className="text-2xl">{pendingApprovals.length}</p>
                    <p className="text-sm text-gray-600">Pending</p>
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
                      {expenses.filter(e => e.approvals.find(a => a.approverId === user.id && a.status === 'approved')).length}
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
                      {expenses.filter(e => e.approvals.find(a => a.approverId === user.id && a.status === 'rejected')).length}
                    </p>
                    <p className="text-sm text-gray-600">Rejected</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl">
                      {expenses.filter(e => e.approvals.some(a => a.approverId === user.id)).length}
                    </p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/manager/inbox')} className="flex-1">
                  <Clock className="mr-2 h-4 w-4" />
                  Review Pending ({pendingApprovals.length})
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employee Dashboard */}
        {user.role === 'employee' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <p className="text-2xl">{userExpenses.filter(e => e.status === 'draft').length}</p>
                    <p className="text-sm text-gray-600">Drafts</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                  <div>
                    <p className="text-2xl">{userExpenses.filter(e => e.status === 'pending' || e.status === 'submitted').length}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl">{userExpenses.filter(e => e.status === 'approved').length}</p>
                    <p className="text-sm text-gray-600">Approved</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl">{userExpenses.length}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => navigate('/employee/submit')} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit New Expense
                </Button>
                <Button onClick={() => navigate('/employee/history')} variant="outline" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
