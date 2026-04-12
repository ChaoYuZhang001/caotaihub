'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  filters?: React.ReactNode;
}

export function SearchBar({ 
  value, 
  onChange, 
  onSearch,
  placeholder = '搜索...',
  showFilters = false,
  filters 
}: SearchBarProps) {
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {showFilters && (
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <button 
          onClick={onSearch}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          搜索
        </button>
      </div>
      {showFilters && showFilterPanel && filters && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          {filters}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
