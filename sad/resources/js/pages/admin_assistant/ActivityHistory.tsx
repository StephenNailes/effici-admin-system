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
              {/* Row 1 */}
              <tr className="hover:bg-gray-50 transition">
                <td className="py-4 px-6 font-medium">#ACT001</td>
                <td className="py-4 px-6 flex items-center gap-3">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Sarah Johnson"
                    className="w-10 h-10 rounded-full border border-gray-200"
                  />
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-xs text-gray-500">ID: STU001</p>
                  </div>
                </td>
                <td className="py-4 px-6">Return</td>
                <td className="py-4 px-6">May 1, 2025</td>
                <td className="py-4 px-6">May 5, 2025</td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                </td>
                <td className="py-4 px-6 flex gap-2">
                  <button className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition">
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition">
                    <X className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-gray-50 transition">
                <td className="py-4 px-6 font-medium">#ACT002</td>
                <td className="py-4 px-6 flex items-center gap-3">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Michael Chen"
                    className="w-10 h-10 rounded-full border border-gray-200"
                  />
                  <div>
                    <p className="font-semibold">Michael Chen</p>
                    <p className="text-xs text-gray-500">ID: STU002</p>
                  </div>
                </td>
                <td className="py-4 px-6">Borrow</td>
                <td className="py-4 px-6">May 2, 2025</td>
                <td className="py-4 px-6">May 6, 2025</td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    Approved
                  </span>
                </td>
                <td className="py-4 px-6 flex gap-2">
                  <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
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
