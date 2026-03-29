import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { GripVertical, ArrowDown, Plus, Trash2 } from 'lucide-react';

interface DraggableApproverProps {
  approver: { id: string; name: string; order: number };
  index: number;
  moveApprover: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (id: string) => void;
}

const DraggableApprover: React.FC<DraggableApproverProps> = ({ approver, index, moveApprover, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'approver',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'approver',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveApprover(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${isDragging ? 'opacity-50' : ''}`}
    >
      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
          {index + 1}
        </div>
        <span>{approver.name}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(approver.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
};

export const ApprovalRules: React.FC = () => {
  const { approvalRules, updateApprovalRule, users } = useData();
  const [selectedRule, setSelectedRule] = useState(approvalRules[0] || null);
  const [isManagerApprover, setIsManagerApprover] = useState(selectedRule?.isManagerApprover || false);
  const [approvers, setApprovers] = useState(selectedRule?.approvers || []);
  const [percentageRequired, setPercentageRequired] = useState(selectedRule?.percentageRequired || 50);
  const [specificApproverId, setSpecificApproverId] = useState(selectedRule?.specificApprover || '');

  const managers = users.filter(u => u.role === 'manager' || u.role === 'admin');
  const availableApprovers = managers.filter(m => !approvers.find(a => a.id === m.id));

  React.useEffect(() => {
    if (approvalRules.length > 0 && !selectedRule) {
      const rule = approvalRules[0];
      setSelectedRule(rule);
      setIsManagerApprover(rule.isManagerApprover);
      setApprovers(rule.approvers);
      setPercentageRequired(rule.percentageRequired || 50);
      setSpecificApproverId(rule.specificApprover || '');
    }
  }, [approvalRules, selectedRule]);

  const moveApprover = (dragIndex: number, hoverIndex: number) => {
    const updatedApprovers = [...approvers];
    const [movedItem] = updatedApprovers.splice(dragIndex, 1);
    updatedApprovers.splice(hoverIndex, 0, movedItem);
    
    // Update order numbers
    const reorderedApprovers = updatedApprovers.map((approver, idx) => ({
      ...approver,
      order: idx + 1,
    }));
    
    setApprovers(reorderedApprovers);
  };

  const addApprover = (userId: string) => {
    const user = managers.find(u => u.id === userId);
    if (!user) return;

    const newApprover = {
      id: user.id,
      name: user.name,
      order: approvers.length + 1,
    };

    setApprovers([...approvers, newApprover]);
  };

  const removeApprover = (id: string) => {
    const filtered = approvers.filter(a => a.id !== id);
    const reordered = filtered.map((approver, idx) => ({ ...approver, order: idx + 1 }));
    setApprovers(reordered);
  };

  const handleSave = () => {
    if (!selectedRule) return;

    updateApprovalRule(selectedRule.id, {
      isManagerApprover,
      approvers,
      percentageRequired,
      specificApprover: specificApproverId,
    });

    toast.success('Approval rules updated successfully!');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Approval Rule Builder</h1>
          <p className="text-gray-600">Configure multi-level approval workflows</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Miscellaneous Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Manager as Approver Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="manager-approver">Is Manager an Approver?</Label>
                  <p className="text-sm text-gray-500">Direct manager automatically added to approval chain</p>
                </div>
                <Switch
                  id="manager-approver"
                  checked={isManagerApprover}
                  onCheckedChange={setIsManagerApprover}
                />
              </div>

              {/* Add Approver */}
              <div className="space-y-2">
                <Label>Add Approver</Label>
                <Select onValueChange={addApprover}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableApprovers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Approver Sequence */}
              <div className="space-y-2">
                <Label>Approval Sequence (Drag to Reorder)</Label>
                <div className="space-y-2">
                  {approvers.map((approver, index) => (
                    <DraggableApprover
                      key={approver.id}
                      approver={approver}
                      index={index}
                      moveApprover={moveApprover}
                      onRemove={removeApprover}
                    />
                  ))}
                  {approvers.length === 0 && (
                    <div className="p-4 text-center text-gray-400 border-2 border-dashed rounded-lg">
                      No approvers added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Percentage Rule */}
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage Required for Approval</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={percentageRequired}
                    onChange={(e) => setPercentageRequired(Number(e.target.value))}
                    className="w-24"
                  />
                  <span>%</span>
                </div>
                <p className="text-sm text-gray-500">
                  E.g., 60% means at least 60% of approvers must approve
                </p>
              </div>

              {/* Specific Approver Rule */}
              <div className="space-y-2">
                <Label htmlFor="specific-approver">Specific Approver (Auto-approve)</Label>
                <Select value={specificApproverId} onValueChange={setSpecificApproverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  E.g., CFO can auto-approve regardless of other rules
                </p>
              </div>

              <Button onClick={handleSave} className="w-full">
                Save Rules
              </Button>
            </CardContent>
          </Card>

          {/* Visual Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Flow Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm">📝 Expense Submitted</p>
                </div>

                {isManagerApprover && (
                  <>
                    <div className="flex justify-center">
                      <ArrowDown className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">👤 Assigned Manager Review</p>
                    </div>
                  </>
                )}

                {approvers.map((approver, index) => (
                  <React.Fragment key={approver.id}>
                    <div className="flex justify-center">
                      <ArrowDown className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm">
                        {index + 1}. {approver.name}
                      </p>
                    </div>
                  </React.Fragment>
                ))}

                {approvers.length > 0 && (
                  <>
                    <div className="flex justify-center">
                      <ArrowDown className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm">
                        ✓ {percentageRequired}% approval required
                      </p>
                    </div>
                  </>
                )}

                {specificApproverId && (
                  <>
                    <div className="flex justify-center">
                      <ArrowDown className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm">
                        ⚡ {managers.find(u => u.id === specificApproverId)?.name} (Auto-approve)
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-center">
                  <ArrowDown className="h-6 w-6 text-gray-400" />
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm">✅ Approved / ❌ Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DndProvider>
  );
};