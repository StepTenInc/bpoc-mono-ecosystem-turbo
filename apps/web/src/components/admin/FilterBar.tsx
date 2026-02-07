'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions
}: FilterBarProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3
            bg-white/5 backdrop-blur-sm
            border border-white/10
            rounded-lg
            text-white placeholder:text-white/50
            focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
            transition-all duration-200
          "
        />
      </div>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="
          px-4 py-3
          bg-white/5 backdrop-blur-sm
          border border-white/10
          rounded-lg
          text-white
          focus:bg-white/10 focus:border-cyan-500/30 focus:outline-none
          transition-all duration-200
          cursor-pointer
        "
      >
        {statusOptions.map(option => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#1A1A2E]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

