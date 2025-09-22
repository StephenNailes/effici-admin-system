import React from "react";
import MainLayout from "@/layouts/mainlayout";
import { Search, Eye, Check, X } from "lucide-react";

export default function ActivityHistory() {
  return (
    <MainLayout>
      <div className="p-6 font-poppins space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activity History</h1>
          <p className="text-gray-500">
            Track and manage all processed activities.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col sm:flex-row gap-4 border border-gray-100">
          <select className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-red-400 focus:outline-none">
            <option>All Types</option>
            <option>Borrow</option>
            <option>Return</option>
          </select>

          <input
            type="date"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
          />

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search student name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
            />
          </div>

          <select className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-red-400 focus:outline-none">
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="py-3 px-6">Activity ID</th>
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Date Submitted</th>
                <th className="py-3 px-6">Date of Activity</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm divide-y divide-gray-100">
                {/* No data rows. Replace with dynamic rows in future. */}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 border-t border-gray-100 text-sm text-gray-600">
            <p>Showing 1-10 of 50 entries</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg border hover:bg-gray-100 transition">
                Previous
              </button>
              <button className="px-3 py-1 rounded-lg bg-red-500 text-white shadow">
                1
              </button>
              <button className="px-3 py-1 rounded-lg border hover:bg-gray-100 transition">
                2
              </button>
              <button className="px-3 py-1 rounded-lg border hover:bg-gray-100 transition">
                3
              </button>
              <button className="px-3 py-1 rounded-lg border hover:bg-gray-100 transition">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
