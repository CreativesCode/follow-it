'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { OrderWithRelations, OrderFilters } from '@/types/orders';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Order } from '@/types/orders';

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

type UseOrdersOptions = Partial<OrderFilters> & {
  businessId?: string; // Para habilitar Realtime
  enableRealtime?: boolean; // Por defecto true si businessId está presente
};

export function useOrders(initialFilters?: UseOrdersOptions): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Extraer businessId y enableRealtime de los filtros
  const { businessId, enableRealtime = true, ...filters } = initialFilters || {};
  const shouldEnableRealtime = businessId && enableRealtime;
  
  const [filtersState, setFiltersState] = useState<OrderFilters>({
    status: 'all',
    courier_id: 'all',
    ...filters,
  });
  
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filtersState.status && filtersState.status !== 'all') params.set('status', filtersState.status);
      if (filtersState.courier_id && filtersState.courier_id !== 'all') params.set('courier_id', filtersState.courier_id);
      if (filtersState.date_from) params.set('date_from', filtersState.date_from);
      if (filtersState.date_to) params.set('date_to', filtersState.date_to);
      if (filtersState.search) params.set('search', filtersState.search);
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
  }, [filtersState, pagination.page, pagination.limit]);
  
  // Set up Realtime subscription
  useEffect(() => {
    if (!shouldEnableRealtime || !businessId) return;
    
    let mounted = true;
    const supabase = createClient();
    
    const setupRealtime = () => {
      console.log(`Setting up orders realtime for business: ${businessId}`);
      
      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Set up realtime subscription for orders
      const channel = supabase
        .channel(`orders:${businessId}`)
        .on<Order>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`,
          },
          (payload: RealtimePostgresChangesPayload<Order>) => {
            if (!mounted) return;
            console.log('New order received via realtime:', payload.new);
            
            // Actualizar lista - hacer refetch completo para respetar filtros y paginación
            fetchOrders();
          }
        )
        .on<Order>(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`,
          },
          (payload: RealtimePostgresChangesPayload<Order>) => {
            if (!mounted) return;
            if (!payload.new) return;
            const updatedOrderData = payload.new as Order;
            console.log('Order updated via realtime:', updatedOrderData);
            
            // Actualizar orden específica en el estado local
            setOrders((prev) => {
              const index = prev.findIndex((o) => o.id === updatedOrderData.id);
              
              // Si la orden no está en la lista actual (puede ser por paginación/filtros)
              if (index === -1) {
                // Hacer refetch para verificar si ahora debe aparecer
                fetchOrders();
                return prev;
              }
              
              // Verificar si la orden actualizada sigue cumpliendo los filtros
              const updatedOrder = { ...prev[index], ...updatedOrderData } as OrderWithRelations;
              
              // Si los filtros excluyen esta orden, removerla de la lista
              if (filtersState.status && filtersState.status !== 'all' && updatedOrder.status !== filtersState.status) {
                return prev.filter((o) => o.id !== updatedOrder.id);
              }
              
              // Actualizar la orden en su posición
              const newOrders = [...prev];
              newOrders[index] = updatedOrder;
              return newOrders;
            });
          }
        )
        .on<Order>(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'orders',
            filter: `business_id=eq.${businessId}`,
          },
          (payload: RealtimePostgresChangesPayload<Order>) => {
            if (!mounted) return;
            if (!payload.old) return;
            const deletedOrder = payload.old as Order;
            console.log('Order deleted via realtime:', deletedOrder);
            
            // Remover orden de la lista
            setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id));
          }
        )
        .subscribe((status) => {
          if (!mounted) return;
          console.log(`Orders realtime subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to orders realtime');
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error subscribing to orders realtime');
            setError('Error al conectar con actualizaciones en tiempo real');
          } else if (status === 'TIMED_OUT') {
            console.warn('⏱️ Timeout subscribing to orders realtime');
            setError('Timeout al conectar con actualizaciones en tiempo real');
          }
        });

      if (mounted) {
        channelRef.current = channel;
      } else {
        supabase.removeChannel(channel);
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channelRef.current) {
        console.log('Cleaning up orders channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, shouldEnableRealtime]);
  
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
      
      // Si Realtime está habilitado, no necesitamos refetch manual
      // Pero lo hacemos por si acaso (mejor tener los datos actualizados)
      if (!shouldEnableRealtime) {
        await fetchOrders();
      }
      return { order: result.order };
    } catch (err: any) {
      return { error: err.message };
    }
  }, [fetchOrders, shouldEnableRealtime]);
  
  return {
    orders,
    loading,
    error,
    pagination,
    filters: filtersState,
    setFilters,
    refetch: fetchOrders,
    createOrder,
  };
}
