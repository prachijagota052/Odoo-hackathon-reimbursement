import React from 'react';
import { Badge } from './ui/badge';
import { ExpenseStatus } from '../types';

interface StatusBadgeProps {
  status: ExpenseStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariantAndText = () => {
    switch (status) {
      case 'draft':
        return { variant: 'secondary' as const, text: 'Draft', className: 'bg-gray-500 text-white' };
      case 'submitted':
      case 'pending':
        return { variant: 'default' as const, text: 'Submitted', className: 'bg-blue-500 text-white' };
      case 'approved':
        return { variant: 'default' as const, text: 'Approved', className: 'bg-green-500 text-white' };
      case 'rejected':
        return { variant: 'destructive' as const, text: 'Rejected', className: 'bg-red-500 text-white' };
      default:
        return { variant: 'secondary' as const, text: status, className: '' };
    }
  };

  const { text, className } = getVariantAndText();

  return (
    <Badge className={className}>
      {text}
    </Badge>
  );
};
