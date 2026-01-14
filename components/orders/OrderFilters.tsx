'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formInputBase } from '@/lib/utils/formStyles';
import type { OrderFilters, OrderStatus } from '@/types/orders';
import { ORDER_STATUS_CONFIG } from '@/types/orders';

type Props = {
  filters: OrderFilters;
  onFilterChange: (filters: Partial<OrderFilters>) => void;
};

export function OrderFilters({ filters, onFilterChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  
  const statuses: (OrderStatus | 'all')[] = ['all', 'pending', 'assigned', 'en_route', 'delivered', 'failed', 'canceled'];
  
  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Buscar por código, dirección..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className={`${formInputBase} pl-10`}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        
        {(filters.status !== 'all' || filters.courier_id !== 'all' || filters.date_from || filters.date_to) && (
          <Button
            variant="ghost"
            onClick={() => onFilterChange({ status: 'all', courier_id: 'all', date_from: undefined, date_to: undefined })}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar
          </Button>
        )}
      </div>
      
      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => onFilterChange({ status })}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${filters.status === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }
                  `}
                >
                  {status === 'all' ? 'Todos' : ORDER_STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Filtro por fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => onFilterChange({ date_from: e.target.value || undefined })}
                className={formInputBase}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => onFilterChange({ date_to: e.target.value || undefined })}
                className={formInputBase}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
