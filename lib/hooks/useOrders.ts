'use client';

import { useState, useEffect, useCallback } from 'react';
import type { OrderWithRelations, OrderFilters } from '@/types/orders';

type UseOrdersReturn = {
  orders: OrderWithRelations[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: OrderFilters;
  setFilters: (filters: Partial<OrderFilters>) => void;
  refetch: () => Promise<void>;
  createOrder: (data: any) => Promise<{ order?: any; error?: string }>;
};

export function useOrders(initialFilters?: Partial<OrderFilters>): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<OrderFilters>({
    status: 'all',
    courier_id: 'all',
    ...initialFilters,
  });
  
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.courier_id && filters.courier_id !== 'all') params.set('courier_id', filters.courier_id);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      if (filters.search) params.set('search', filters.search);
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      
      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);
  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const setFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset page on filter change
  }, []);
  
  const createOrder = useCallback(async (data: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { error: result.error || 'Error al crear pedido' };
      }
      
      // Refetch para actualizar lista
      await fetchOrders();
      return { order: result.order };
    } catch (err: any) {
      return { error: err.message };
    }
  }, [fetchOrders]);
  
  return {
    orders,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch: fetchOrders,
    createOrder,
  };
}
