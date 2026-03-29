import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Camera, Upload, Scan } from 'lucide-react';

const CATEGORIES = [
  'Meals & Entertainment',
  'Transportation',
  'Accommodation',
  'Office Supplies',
  'Travel',
  'Miscellaneous',
];

interface CurrencyRates {
  [key: string]: number;
}

export const SubmitExpense: React.FC = () => {
  const { user } = useAuth();
  const { addExpense, users, approvalRules } = useData();
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>({});
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']);

  const baseCurrency = user?.baseCurrency || 'USD';

  // Fetch real-time currency rates
  useEffect(() => {
    const fetchCurrencyRates = async () => {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        const data = await response.json();
        setCurrencyRates(data.rates);
        // Get available currencies from API
        if (data.rates) {
          setAvailableCurrencies(Object.keys(data.rates).sort());
        }
      } catch (error) {
        console.error('Failed to fetch currency rates:', error);
        // Fallback to mock rates
        setCurrencyRates({
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 149.50,
          AUD: 1.53,
          CAD: 1.35,
          CHF: 0.89,
          CNY: 7.24,
          INR: 83.12,
        });
      }
    };

    fetchCurrencyRates();
  }, [baseCurrency]);

  const convertedAmount = amount && currencyRates[currency] 
    ? (parseFloat(amount) / currencyRates[currency]).toFixed(2) 
    : '0.00';

  const handleScan = () => {
    setScanning(true);
    
    // Simulate OCR scanning with realistic data
    setTimeout(() => {
      // Mock OCR data - simulating receipt scanning
      const mockReceipts = [
        {
          amount: '85.50',
          currency: 'EUR',
          date: '2026-03-27',
          category: 'Meals & Entertainment',
          description: 'Dinner at La Piazza Restaurant - Business Meeting with Client',
        },
        {
          amount: '42.30',
          currency: 'USD',
          date: '2026-03-28',
          category: 'Transportation',
          description: 'Uber to Airport - Business Trip',
        },
        {
          amount: '125.00',
          currency: 'GBP',
          date: '2026-03-26',
          category: 'Accommodation',
          description: 'Hotel Stay - Hilton London',
        },
      ];

      const randomReceipt = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
      
      setAmount(randomReceipt.amount);
      setCurrency(randomReceipt.currency);
      setDate(randomReceipt.date);
      setCategory(randomReceipt.category);
      setDescription(randomReceipt.description);
      setScanning(false);
      toast.success('Receipt scanned successfully! OCR extracted all fields.');
    }, 2000);
  };

  const handleSubmit = (status: 'draft' | 'submitted') => {
    if (!amount || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) return;

    // Find approval rule for this category
    const rule = approvalRules.find(r => r.category === category);

    let approvals: any[] = [];

    if (status === 'submitted' && rule) {
      // Build approval chain based on rule
      let order = 1;

      // 1. Add manager as first approver if rule specifies
      if (rule.isManagerApprover && user.assignedManagerId) {
        const manager = users.find(u => u.id === user.assignedManagerId);
        if (manager) {
          approvals.push({
            approverId: manager.id,
            approverName: manager.name,
            status: 'pending' as const,
            order: order++,
          });
        }
      }

      // 2. Add sequential approvers from rule
      if (rule.approvers && rule.approvers.length > 0) {
        rule.approvers.forEach(approver => {
          approvals.push({
            approverId: approver.id,
            approverName: approver.name,
            status: 'pending' as const,
            order: order++,
          });
        });
      }
    } else if (status === 'submitted') {
      // Fallback: just use assigned manager if no rule
      const assignedManager = users.find(u => u.id === user.assignedManagerId);
      if (assignedManager) {
        approvals = [{
          approverId: assignedManager.id,
          approverName: assignedManager.name,
          status: 'pending' as const,
          order: 1,
        }];
      }
    }

    addExpense({
      employeeId: user.id,
      employeeName: user.name,
      amount: parseFloat(amount),
      currency,
      convertedAmount: parseFloat(convertedAmount),
      baseCurrency,
      category,
      description,
      date,
      status,
      approvals,
    });

    toast.success(status === 'draft' ? 'Expense saved as draft' : 'Expense submitted for approval!');
    
    // Reset form
    setAmount('');
    setCurrency('USD');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('');
    setDescription('');

    if (status === 'submitted') {
      navigate('/employee/history');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Submit Expense</h1>
          <p className="text-gray-600">Scan receipt or enter details manually</p>
        </div>

        {/* OCR Scanner */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  className="flex-1 h-24"
                  variant="outline"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8" />
                    <span>{scanning ? 'Scanning...' : 'Scan Receipt'}</span>
                  </div>
                </Button>
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  className="flex-1 h-24"
                  variant="outline"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8" />
                    <span>Upload Image</span>
                  </div>
                </Button>
              </div>

              {scanning && (
                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center gap-3">
                  <Scan className="h-6 w-6 text-blue-600 animate-pulse" />
                  <span className="text-blue-700">Scanning receipt...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map(curr => (
                      <SelectItem key={curr} value={curr}>
                        {curr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Currency Conversion Display */}
            {amount && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Amount in {currency}</p>
                    <p className="text-xl">
                      {currency}{amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Converted to {baseCurrency}</p>
                    <p className="text-xl">
                      {baseCurrency}{convertedAmount}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="E.g., Dinner at La Piazza Restaurant"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => handleSubmit('draft')}
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSubmit('submitted')}
                className="flex-1"
              >
                Submit for Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};