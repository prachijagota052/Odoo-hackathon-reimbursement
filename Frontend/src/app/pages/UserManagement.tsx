import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Mail, Plus, UserPlus, ArrowLeft } from 'lucide-react';
import { UserRole } from '../types';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { users, addUser } = useData();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as UserRole,
    assignedManagerId: '',
    department: '',
  });

  const managers = users.filter(u => u.role === 'manager');

  const handleSendPassword = (email: string) => {
    // Mock sending password reset email
    toast.success(`Password reset link sent to ${email}`);
  };

  const handleAddUser = () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    addUser({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      assignedManagerId: formData.assignedManagerId || undefined,
      department: formData.department,
      baseCurrency: 'USD',
    });

    toast.success(`User ${formData.name} added successfully!`);
    setNewUserOpen(false);
    setFormData({ name: '', email: '', role: 'employee', assignedManagerId: '', department: '' });
  };
  const filteredUsers =
    selectedDepartment && selectedDepartment !== "all"
      ? users.filter((u) => u.department === selectedDepartment)
      : users;

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl mb-2">User Management</h1>
          <p className="text-gray-600">Manage users and their roles</p>
        </div>

        <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) =>
      setFormData({ ...formData, department: value })
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select Department" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Finance">Finance</SelectItem>
      <SelectItem value="HR">HR</SelectItem>
      <SelectItem value="IT">IT</SelectItem>
      <SelectItem value="Operations">Operations</SelectItem>
    </SelectContent>
  </Select>
</div>
              {formData.role === 'employee' && (
                <div className="space-y-2">
                  <Label htmlFor="new-manager">Assigned Manager</Label>
                  <Select value={formData.assignedManagerId} onValueChange={(value) => setFormData({ ...formData, assignedManagerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager..." />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleAddUser} className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* ✅ ADD FILTER DROPDOWN HERE */}
    <div className="mb-4">
      <Select
        value={selectedDepartment}
        onValueChange={(value) => setSelectedDepartment(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="HR">HR</SelectItem>
          <SelectItem value="IT">IT</SelectItem>
          <SelectItem value="Operations">Operations</SelectItem>
        </SelectContent>
      </Select>
    </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Manager</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="capitalize px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.assignedManagerId 
                        ? users.find(u => u.id === user.assignedManagerId)?.name || '-'
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendPassword(user.email)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {users.map(user => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p>{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className="capitalize px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {user.role}
                  </span>
                </div>
                {user.assignedManagerId && (
                  <div className="text-sm">
                    <span className="text-gray-600">Manager: </span>
                    {users.find(u => u.id === user.assignedManagerId)?.name}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleSendPassword(user.email)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Password
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};