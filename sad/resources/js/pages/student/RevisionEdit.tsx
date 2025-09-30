import MainLayout from '@/layouts/mainlayout'
import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { getCsrfToken, getXsrfCookieToken, refreshCsrfToken } from '@/lib/csrf'
// Note: Flash success/error messages are handled globally by FlashToaster via Inertia shared props.

// Define revision type for activity plan
interface ActivityRevision {
  id: number
  activity_name: string
  activity_purpose: string
  category: 'minor' | 'normal' | 'urgent'
  start_datetime: string
  end_datetime: string
  objectives?: string
  participants?: string
  methodology?: string
  expected_outcome?: string
  activity_location?: string
  comment: string
  request_type: 'activity_plan'
}

// Define revision type for equipment request
interface EquipmentItem {
  item_id: number
  equipment_id: number
  quantity: number
  equipment_name: string
  equipment_description: string
  equipment_category: string
}

interface EquipmentRevision {
  id: number
  purpose: string
  category?: string
  start_datetime: string
  end_datetime: string
  comment: string
  request_type: 'equipment'
  items: EquipmentItem[]
}

// Define props
interface RevisionEditProps {
  revision: ActivityRevision | EquipmentRevision
  // In backend the expected values are 'activity_plan' or 'equipment'
  requestType: 'activity_plan' | 'equipment'
}

export default function RevisionEdit({ revision, requestType }: RevisionEditProps) {
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([])
  const [isLoadingAvailableEquipment, setIsLoadingAvailableEquipment] = useState(false)
  const [availableEquipmentError, setAvailableEquipmentError] = useState<string | null>(null)

  // Helper function to fetch equipment with proper error handling
  const fetchEquipment = () => {
    setIsLoadingAvailableEquipment(true)
    setAvailableEquipmentError(null)
    
    axios.get('/api/equipment/availableForStudent')
      .then(response => {
        setAvailableEquipment(response.data)
        setAvailableEquipmentError(null)
      })
      .catch(error => {
        console.error('Error fetching equipment:', error)
        setAvailableEquipmentError('Failed to load available equipment. Please refresh the page to try again.')
        setAvailableEquipment([])
      })
      .finally(() => {
        setIsLoadingAvailableEquipment(false)
      })
  }
  
  const [formData, setFormData] = useState(() => {
  if (requestType === 'activity_plan') {
      const activityRevision = revision as ActivityRevision
      return {
        activity_name: activityRevision.activity_name || '',
        activity_purpose: activityRevision.activity_purpose || '',
        category: activityRevision.category || 'normal',
        start_datetime: activityRevision.start_datetime || '',
        end_datetime: activityRevision.end_datetime || '',
        objectives: activityRevision.objectives || '',
        participants: activityRevision.participants || '',
        methodology: activityRevision.methodology || '',
        expected_outcome: activityRevision.expected_outcome || '',
        activity_location: activityRevision.activity_location || '',
      }
    } else {
      const equipmentRevision = revision as EquipmentRevision
      return {
        purpose: equipmentRevision.purpose || '',
        equipment_category: equipmentRevision.category || '',
        start_datetime: equipmentRevision.start_datetime || '',
        end_datetime: equipmentRevision.end_datetime || '',
        equipment_items: equipmentRevision.items?.map(item => ({
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          equipment_name: item.equipment_name,
          equipment_description: item.equipment_description,
          equipment_category: item.equipment_category
        })) || [],
      }
    }
  })

  // Fetch available equipment for equipment requests
  useEffect(() => {
    if (requestType === 'equipment') {
      fetchEquipment()
    }
    // Proactively ensure CSRF meta/cookie are fresh when entering the edit page
    refreshCsrfToken().catch(() => { /* noop */ })
  }, [requestType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Refresh CSRF before submit to avoid 419 if token rotated
    await refreshCsrfToken()
    const csrfToken = getCsrfToken()
    const xsrfToken = getXsrfCookieToken()
    router.post(route('student.revision.update', { id: revision.id, type: requestType }), {
      ...formData,
      _token: csrfToken,
    }, {
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        'X-Requested-With': 'XMLHttpRequest',
      },
      preserveState: true,
      preserveScroll: true,
    })
  }

  const addEquipmentItem = () => {
    const currentItems = (formData as any).equipment_items || []
    setFormData({
      ...formData,
      equipment_items: [
        ...currentItems,
        { equipment_id: '', quantity: 1, equipment_name: '', equipment_description: '', equipment_category: '' }
      ]
    } as any)
  }

  const removeEquipmentItem = (index: number) => {
    const currentItems = (formData as any).equipment_items || []
    const updatedItems = currentItems.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, equipment_items: updatedItems } as any)
  }

  const updateEquipmentItem = (index: number, field: string, value: any) => {
    const currentItems = (formData as any).equipment_items || []
    const updatedItems = [...currentItems]
    
    if (field === 'equipment_id') {
      const selectedEquipment = availableEquipment.find(eq => eq.id === parseInt(value))
      if (selectedEquipment) {
        updatedItems[index] = {
          ...updatedItems[index],
          equipment_id: value,
          equipment_name: selectedEquipment.name,
          equipment_description: selectedEquipment.description || '',
          equipment_category: selectedEquipment.category || 'Uncategorized',
          available_quantity: selectedEquipment.available || selectedEquipment.total_quantity || 0,
          total_quantity: selectedEquipment.total_quantity || 0
        }
        // Reset quantity to 1 when selecting new equipment
        updatedItems[index].quantity = Math.min(1, selectedEquipment.available || selectedEquipment.total_quantity || 0)
      }
    } else {
      updatedItems[index][field] = value
    }
    
    setFormData({ ...formData, equipment_items: updatedItems } as any)
  }

  return (
    <MainLayout>
      <div className="p-8 font-poppins min-h-screen text-black bg-gradient-to-br from-red-50 via-white to-red-100">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-red-600 tracking-tight mb-2">
            Revise {requestType === 'activity_plan' ? 'Activity Plan' : 'Equipment Request'}
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-semibold">Reviewer Comment:</p>
            <p className="text-yellow-700">{revision.comment}</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {requestType === 'activity_plan' ? (
              // Activity Plan Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Activity Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={(formData as any).activity_name}
                      onChange={(e) =>
                        setFormData({ ...formData, activity_name: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={(formData as any).category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    >
                      <option value="minor">Minor</option>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Activity Purpose *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={(formData as any).activity_purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, activity_purpose: e.target.value } as any)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={(formData as any).start_datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, start_datetime: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={(formData as any).end_datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, end_datetime: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Objectives
                    </label>
                    <textarea
                      rows={3}
                      value={(formData as any).objectives}
                      onChange={(e) =>
                        setFormData({ ...formData, objectives: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Activity Location
                    </label>
                    <input
                      type="text"
                      value={(formData as any).activity_location}
                      onChange={(e) =>
                        setFormData({ ...formData, activity_location: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Participants
                    </label>
                    <textarea
                      rows={3}
                      value={(formData as any).participants}
                      onChange={(e) =>
                        setFormData({ ...formData, participants: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Methodology
                    </label>
                    <textarea
                      rows={3}
                      value={(formData as any).methodology}
                      onChange={(e) =>
                        setFormData({ ...formData, methodology: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected Outcome
                  </label>
                  <textarea
                    rows={3}
                    value={(formData as any).expected_outcome}
                    onChange={(e) =>
                      setFormData({ ...formData, expected_outcome: e.target.value } as any)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                  />
                </div>
              </>
            ) : (
              // Equipment Request Form
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purpose *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={(formData as any).purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, purpose: e.target.value } as any)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={(formData as any).start_datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, start_datetime: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={(formData as any).end_datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, end_datetime: e.target.value } as any)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                    />
                  </div>
                </div>

                {/* Equipment Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Equipment Items *
                    </label>
                    <motion.button
                      type="button"
                      onClick={addEquipmentItem}
                      disabled={isLoadingAvailableEquipment || !!availableEquipmentError}
                      className={`px-4 py-2 rounded-lg text-sm transition ${
                        isLoadingAvailableEquipment || availableEquipmentError
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      whileHover={{ scale: isLoadingAvailableEquipment || availableEquipmentError ? 1 : 1.02 }}
                      whileTap={{ scale: isLoadingAvailableEquipment || availableEquipmentError ? 1 : 0.98 }}
                    >
                      {isLoadingAvailableEquipment ? 'Loading...' : 'Add Equipment'}
                    </motion.button>
                  </div>

                  {((formData as any).equipment_items || []).map((item: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Equipment
                          </label>
                          {isLoadingAvailableEquipment ? (
                            <div className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-center">
                              Loading equipment...
                            </div>
                          ) : availableEquipmentError ? (
                            <div className="w-full">
                              <div className="p-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm mb-2 flex items-center justify-between">
                                <span>{availableEquipmentError}</span>
                                <button
                                  type="button"
                                  onClick={fetchEquipment}
                                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                                >
                                  Retry
                                </button>
                              </div>
                              <select
                                disabled
                                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                              >
                                <option>Equipment unavailable</option>
                              </select>
                            </div>
                          ) : (
                            <select
                              value={item.equipment_id}
                              onChange={(e) => updateEquipmentItem(index, 'equipment_id', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                              required
                            >
                              <option value="">Select Equipment</option>
                              {availableEquipment.map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                  {eq.name} - {eq.description} (Available: {eq.available || eq.total_quantity})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Category
                          </label>
                          <div className="p-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
                            {item.equipment_category || 'Select equipment first'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Quantity
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                min="1"
                                max={item.available_quantity || item.total_quantity || 1}
                                value={item.quantity}
                                onChange={(e) => updateEquipmentItem(index, 'quantity', parseInt(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 outline-none"
                                required
                              />
                              {item.available_quantity !== undefined && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Max: {item.available_quantity}
                                </div>
                              )}
                            </div>
                            <motion.button
                              type="button"
                              onClick={() => removeEquipmentItem(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              Remove
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      {item.equipment_name && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Selected:</strong> {item.equipment_name} 
                          {item.equipment_description && ` - ${item.equipment_description}`}
                          {item.equipment_category && ` | Category: ${item.equipment_category}`}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {((formData as any).equipment_items || []).length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      {isLoadingAvailableEquipment ? (
                        <div className="text-blue-500 border-blue-300">
                          <div className="animate-pulse">Loading available equipment...</div>
                        </div>
                      ) : availableEquipmentError ? (
                        <div className="text-red-500 border-red-300">
                          <div className="mb-2">Unable to load equipment options</div>
                          <div className="text-sm text-red-400 mb-3">{availableEquipmentError}</div>
                          <button
                            type="button"
                            onClick={fetchEquipment}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500 border-gray-300">
                          No equipment items added. Click "Add Equipment" to get started.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <motion.a
                href={route('student.revision')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.a>
              <motion.button
                type="submit"
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Revision
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </MainLayout>
  )
}
