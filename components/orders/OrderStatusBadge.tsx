'use client';

import { 
  Clock, User, Truck, CheckCircle, XCircle, Ban 
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, type OrderStatus } from '@/types/orders';

type Props = {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
};

const ICONS = {
  Clock, User, Truck, CheckCircle, XCircle, Ban
};

export function OrderStatusBadge({ status, size = 'md', showIcon = true }: Props) {
  const config = ORDER_STATUS_CONFIG[status];
  const Icon = ICONS[config.icon as keyof typeof ICONS];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.color} ${sizeClasses[size]}
      `}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
