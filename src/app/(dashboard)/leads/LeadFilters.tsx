'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, Calendar } from 'lucide-react';
import { STATUS_CONFIG, type LeadStatus } from '@/lib/types';

interface Props {
  statusCounts: Record<LeadStatus, number>;
}

export function LeadFilters({ statusCounts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status');
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentDateFrom = searchParams.get('from') || '';
  const currentDateTo = searchParams.get('to') || '';

  const [search, setSearch] = useState(currentSearch);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(pathname + '?' + params.toString());
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: search || null });
  };

  const handleDateFilter = () => {
    updateParams({
      from: dateFrom || null,
      to: dateTo || null
    });
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    router.push(pathname);
  };

  const hasActiveFilters = currentStatus || currentSearch || currentDateFrom || currentDateTo || currentSort !== 'newest';

  const statuses = Object.keys(STATUS_CONFIG) as LeadStatus[];
  const colors: Record<LeadStatus, { bg: string; ring: string; short: string }> = {
    red: { bg: 'bg-red-500', ring: 'ring-red-500', short: 'No posible' },
    yellow: { bg: 'bg-yellow-400', ring: 'ring-yellow-400', short: 'No contesta' },
    orange: { bg: 'bg-orange-500', ring: 'ring-orange-500', short: 'Mas adelante' },
    blue: { bg: 'bg-blue-500', ring: 'ring-blue-500', short: 'Programado' },
    green: { bg: 'bg-green-500', ring: 'ring-green-500', short: 'Cerrado' },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParams({ status: null })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !currentStatus ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
        </button>
        {statuses.map((status) => {
          const isSelected = currentStatus === status;
          return (
            <button
              key={status}
              onClick={() => updateParams({ status: isSelected ? null : status })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-gray-200 text-gray-900 ring-2 ' + colors[status].ring
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={STATUS_CONFIG[status].label}
            >
              <span className={`w-3 h-3 rounded-full ${colors[status].bg}`} />
              <span className="hidden sm:inline">{colors[status].short}</span>
              <span className="text-gray-500">({statusCounts[status]})</span>
            </button>
          );
        })}
      </div>

      {/* Search and controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex-1 min-w-[250px] flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o telefono..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
          >
            Buscar
          </button>
        </form>

        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
            className="appearance-none pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none bg-white cursor-pointer"
          >
            <option value="newest">Mas recientes</option>
            <option value="oldest">Mas antiguos</option>
            <option value="name_asc">Nombre A-Z</option>
            <option value="name_desc">Nombre Z-A</option>
            <option value="contact_date">Fecha contacto</option>
          </select>
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
            showAdvanced || currentDateFrom || currentDateTo
              ? 'bg-brand-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filtros</span>
        </button>

        {/* Clear filters - only show when active */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            title="Limpiar filtros"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Fecha desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Fecha hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
            >
              Aplicar fechas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
