import React from "react";

export default function FilterModal({
  open,
  onClose,
  filters,
  setFilters,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: { status: string; priority: string };
  setFilters: (f: { status: string; priority: string }) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg w-80 p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Requests</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-gray-700"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="revision_requested">Under Revision</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-gray-700"
            value={filters.priority}
            onChange={e => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="minor">Minor</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onClear}
          >
            Clear
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}