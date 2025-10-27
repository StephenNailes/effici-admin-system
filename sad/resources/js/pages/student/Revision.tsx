import MainLayout from '@/layouts/mainlayout'
import { motion } from 'framer-motion'
import { Link, router } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, MessageSquare } from "lucide-react"
import { FaSearch, FaFilter } from "react-icons/fa"
import { useState } from 'react'
import FilterSelect from '@/components/FilterSelect'

// Define the type of each revision
interface Revision {
  id: number
  title: string
  comment: string
  status: string
  request_type: string // 'activity_plan' or 'equipment' or 'budget_request'
  comment_count: number
  has_multiple_comments: boolean
}

// Define props for the component
interface RevisionProps {
  revisions: Revision[]
}

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    Revision: 'bg-blue-100 text-blue-700 border-blue-300',
    under_revision: 'bg-orange-100 text-orange-700 border-orange-300',
  }
  
  // Normalize status display
  const displayStatus = status === 'under_revision' ? 'Under Revision' : status
  
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold border ${
        colors[status] || 'bg-red-100 text-red-700 border-red-300'
      }`}
    >
      {displayStatus}
    </span>
  )
}

const getRequestTypeLabel = (requestType: string) => {
  const labels: Record<string, string> = {
    activity_plan: 'Activity Plan',
    budget_request: 'Budget Request',
    equipment: 'Equipment Request',
  }
  return labels[requestType] || requestType
}

export default function Revision({ revisions = [] }: RevisionProps) {
  // Search and filter states
  const [search, setSearch] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterType, setFilterType] = useState("")

  // Filter logic
  const filteredRevisions = (revisions ?? []).filter((req) => {
    // Show requests that need revision (status is under_revision)
    const isRevision = req.status === "under_revision"
    // Search filter
    const matchesSearch =
      req.title.toLowerCase().includes(search.toLowerCase()) ||
      req.comment.toLowerCase().includes(search.toLowerCase()) ||
      req.status.toLowerCase().includes(search.toLowerCase())
    // Status filter
    const matchesStatus = filterStatus ? req.status === filterStatus : true
    // Type filter
    const matchesType = filterType ? req.request_type === filterType : true

    return isRevision && matchesSearch && matchesStatus && matchesType
  })

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 8 // Show 8 revisions per page
  const totalPages = Math.ceil(filteredRevisions.length / logsPerPage)
  const paginatedRevisions = filteredRevisions.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  )

  return (
    <MainLayout>
      <div className="p-8 font-poppins min-h-screen text-black bg-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-1"
        >
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">
            Revision Requests
          </h1>
          <p className="text-gray-600 text-base">
            These requests need your attention
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-4 mb-8"
        >
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search request..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-black bg-white shadow-sm"
            />
            <FaSearch className="absolute left-4 top-3.5 text-gray-400 text-lg" />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl px-5 py-3 text-red-600 font-semibold shadow-sm transition"
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <FaFilter /> Filter
          </motion.button>
        </motion.div>

        {/* Filter Panel */}
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col sm:flex-row gap-4"
          >
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'under_revision', label: 'Under Revision', colorClass: 'bg-orange-100 text-orange-700' },
              ]}
            />
            <FilterSelect
              label="Request Type"
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'activity_plan', label: 'Activity Plan', colorClass: 'bg-blue-100 text-blue-700' },
                { value: 'budget_request', label: 'Budget Request', colorClass: 'bg-indigo-100 text-indigo-700' },
                { value: 'equipment', label: 'Equipment Request', colorClass: 'bg-purple-100 text-purple-700' },
              ]}
            />
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl shadow-xl bg-white border border-gray-200 flex flex-col"
          style={{ width: "100%", maxWidth: "1600px", margin: "0 auto", height: "700px" }}
        >
          <table className="w-full table-fixed border-separate border-spacing-0 flex-1">
            <thead>
              <tr>
                <th className="w-1/4 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                  Request Type
                </th>
                <th className="w-1/3 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                  Reviewer Comment
                </th>
                <th className="w-1/6 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
                  Status
                </th>
                <th className="w-1/6 px-8 py-4 font-semibold text-base text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRevisions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-8 text-center text-gray-400">
                    No revision requests at the moment.
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedRevisions.map((req, idx) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * idx }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-black"
                    >
                      <td className="w-1/4 px-8 py-4 align-middle text-left">
                        <span className="font-semibold text-gray-900">
                          {getRequestTypeLabel(req.request_type)}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          {req.title}
                        </div>
                      </td>
                      <td className="w-1/3 px-8 py-4 align-middle text-left">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            {req.comment}
                          </div>
                          {req.has_multiple_comments && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 border border-blue-300 rounded-full text-xs font-semibold">
                              <MessageSquare className="w-3 h-3" />
                              {req.comment_count} comments
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="w-1/6 px-8 py-4 align-middle text-left">
                        {getStatusBadge(req.status || 'Revision')}
                      </td>
                      <td className="w-1/6 px-8 py-4 align-middle text-center">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-block bg-red-500 text-white px-4 py-2 rounded-xl text-sm shadow transition hover:bg-red-600"
                          onClick={() => {
                            if (req.request_type === 'activity_plan') {
                              router.get(`/student/requests/activity-plan/${req.id}`)
                            } else if (req.request_type === 'budget_request') {
                              router.get(`/student/requests/budget-request/${req.id}`)
                            } else {
                              router.get(route('student.revision.edit', { id: req.id, type: req.request_type }))
                            }
                          }}
                        >
                          {req.has_multiple_comments ? 'View & Revise' : 'Revise'}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                  {/* Filler rows to keep table height consistent */}
                  {Array.from({ length: logsPerPage - paginatedRevisions.length }).map((_, idx) => (
                    <tr key={`filler-${idx}`} className="border-b border-gray-100">
                      <td colSpan={4} className="px-8 py-4 text-transparent">-</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          {/* Pagination bar here */}
          <div className="flex justify-end items-center gap-2 p-6 text-black border-t border-gray-200 bg-white rounded-b-2xl">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-100 transition flex items-center justify-center"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              aria-label="Previous Page"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i + 1}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold shadow ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-100 transition flex items-center justify-center"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              aria-label="Next Page"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
