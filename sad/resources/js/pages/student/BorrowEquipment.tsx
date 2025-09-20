import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/layouts/mainlayout";
import { useForm, usePage, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { FaInfoCircle, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-theme.css";

type Equipment = {
  id: number;
  name: string;
  description: string | null;
  total_quantity: number;
  category: string | null;
};

type ActivityPlan = {
  id: number;
  activity_name: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
};

type PageProps = {
  equipment: Equipment[];
  activityPlans: ActivityPlan[]; // ✅ passed from backend
  flash?: { success?: string; error?: string };
};

export default function BorrowEquipment() {
  const { props } = usePage<PageProps>();
  const equipmentList = props.equipment || [];
  const activityPlans = props.activityPlans || [];

  const [availability, setAvailability] = useState<Record<number, number>>({});
  const [checking, setChecking] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const [notification, setNotification] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const { data, setData, processing, reset } = useForm<{
    activity_plan_id?: number | null;
    purpose: string;
    start_datetime: string;
    end_datetime: string;
    items: { equipment_id: number; quantity: number }[];
    category: "minor" | "normal" | "urgent"; // <-- Add this line
  }>({
    activity_plan_id: undefined,
    purpose: "",
    start_datetime: "",
    end_datetime: "",
    items: [{ equipment_id: equipmentList[0]?.id ?? 0, quantity: 1 }],
    category: "normal", // <-- Default value
  });

  // Functions to handle multiple equipment items
  const addEquipmentItem = () => {
    // Find the first equipment that's not already selected
    const selectedIds = data.items.map(item => item.equipment_id);
    const availableEquipment = equipmentList.find(eq => !selectedIds.includes(eq.id));
    const equipmentId = availableEquipment?.id ?? equipmentList[0]?.id ?? 0;
    
    const newItem = { equipment_id: equipmentId, quantity: 1 };
    setData("items", [...data.items, newItem]);
  };

  const removeEquipmentItem = (index: number) => {
    if (data.items.length > 1) {
      const newItems = data.items.filter((_, i) => i !== index);
      setData("items", newItems);
    }
  };

  const updateEquipmentItem = (index: number, field: "equipment_id" | "quantity", value: number) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData("items", newItems);
  };

  const canCheck = useMemo(
    () => data.start_datetime && data.end_datetime,
    [data.start_datetime, data.end_datetime]
  );

  async function fetchAvailability() {
    if (!canCheck) return;
    setChecking(true);
    try {
      const res = await fetch("/equipment/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          start: data.start_datetime,
          end: data.end_datetime,
        }),
      });
      const rows: Array<{ id: number; available: number }> = await res.json();
      const map: Record<number, number> = {};
      rows.forEach((r) => (map[r.id] = r.available));
      setAvailability(map);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.start_datetime, data.end_datetime]);

  useEffect(() => {
    if (props.flash?.success) {
      triggerNotification("success", props.flash.success);
    }
    if (props.flash?.error) {
      triggerNotification("error", props.flash.error);
    }
  }, [props.flash]);

  function triggerNotification(type: "error" | "success", message: string) {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setShowConfirmModal(true);
  }

  function confirmAndSubmit() {
    if (!confirmChecked) return;
    setShowConfirmModal(false);
    router.post("/equipment-requests", data, {
      onSuccess: () => {
        reset();
        setConfirmChecked(false);
      },
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(", ");
        triggerNotification("error", errorMessage || "Failed to submit request.");
      },
    });
  }

  // DatePickers
  const [startDateTime, setStartDateTime] = useState<Date | null>(
    data.start_datetime ? new Date(data.start_datetime) : null
  );
  const [endDateTime, setEndDateTime] = useState<Date | null>(
    data.end_datetime ? new Date(data.end_datetime) : null
  );

  useEffect(() => {
    setData("start_datetime", startDateTime ? startDateTime.toISOString().slice(0, 19).replace("T", " ") : "");
    setData("end_datetime", endDateTime ? endDateTime.toISOString().slice(0, 19).replace("T", " ") : "");
    // eslint-disable-next-line
  }, [startDateTime, endDateTime]);

  return (
    <MainLayout>
      {/* Toast */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg transition-all duration-500 transform ${
            showNotification ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          } ${notification.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-3 text-white font-bold"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="p-6 font-poppins min-h-screen text-black bg-gradient-to-br from-red-50 via-white to-red-100">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">Equipment Request</h1>
          <p className="text-gray-600 text-base">Students can submit requests for equipment.</p>
        </div>

        {/* Equipment Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-10"
        >
          <h2 className="font-semibold text-xl text-red-600 mb-6">Available Equipment</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-red-50 to-red-100 text-left border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-700">Equipment</th>
                  <th className="p-4 font-semibold text-gray-700">Description</th>
                  <th className="p-4 font-semibold text-gray-700">Category</th>
                  <th className="p-4 font-semibold text-gray-700 text-center">
                    {canCheck ? (checking ? "Checking…" : "Available (Selected Window)") : "Total Stock"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      No equipment available.
                    </td>
                  </tr>
                ) : (
                  equipmentList.map((eq, idx) => (
                    <motion.tr
                      key={eq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-red-50 transition-colors border-b border-gray-100"
                    >
                      <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                        <motion.span
                          whileHover={{ scale: 1.08, color: "#ef4444" }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="cursor-pointer"
                        >
                          {eq.name}
                        </motion.span>
                      </td>
                      <td className="p-4 text-gray-600">{eq.description ?? "—"}</td>
                      <td className="p-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                          {eq.category ?? "Uncategorized"}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-green-600">
                        {canCheck ? (availability[eq.id] ?? eq.total_quantity) : eq.total_quantity}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Request Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
        >
          <h2 className="font-semibold text-xl text-red-600 mb-6">Book Equipment</h2>
          <form onSubmit={submit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purpose */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Purpose</label>
                <input
                  type="text"
                  placeholder="Purpose"
                  value={data.purpose}
                  onChange={(e) => setData("purpose", e.target.value)}
                  className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black"
                />
              </div>

              {/* Activity Plan Selector */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Link to Activity Plan (optional)</label>
                <select
                  className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black"
                  value={data.activity_plan_id ?? ""}
                  onChange={(e) =>
                    setData("activity_plan_id", e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">— None —</option>
                  {activityPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.activity_name} ({plan.start_datetime} → {plan.end_datetime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Request Category</label>
                <select
                  className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black"
                  value={data.category}
                  onChange={(e) => setData("category", e.target.value as "minor" | "normal" | "urgent")}
                >
                  <option value="minor">Minor</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Dates & Equipment Inputs (same as before) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Start Date & Time</label>
                  <DatePicker
                    selected={startDateTime}
                    onChange={(date) => setStartDateTime(date)}
                    showTimeSelect
                    timeIntervals={30}
                    dateFormat="Pp"
                    placeholderText="Select start date & time"
                    className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black transition-all duration-150"
                  />
                </div>
                <div className="flex-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">End Date & Time</label>
                  <DatePicker
                    selected={endDateTime}
                    onChange={(date) => setEndDateTime(date)}
                    showTimeSelect
                    timeIntervals={30}
                    dateFormat="Pp"
                    minDate={startDateTime ?? undefined}
                    placeholderText="Select end date & time"
                    className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black transition-all duration-150"
                  />
                </div>
              </div>
            </div>

            {/* Equipment Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Equipment Items</h3>
                <motion.button
                  type="button"
                  onClick={addEquipmentItem}
                  whileHover={{ scale: data.items.length < equipmentList.length ? 1.05 : 1 }}
                  whileTap={{ scale: data.items.length < equipmentList.length ? 0.95 : 1 }}
                  disabled={data.items.length >= equipmentList.length}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                    data.items.length < equipmentList.length
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <FaPlus className="text-sm" />
                  Add Equipment
                  {data.items.length >= equipmentList.length && " (All Selected)"}
                </motion.button>
              </div>

              {data.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Equipment Selection */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Equipment</label>
                      <select
                        className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black transition-all duration-150"
                        value={item.equipment_id}
                        onChange={(e) => updateEquipmentItem(index, "equipment_id", Number(e.target.value))}
                      >
                        {equipmentList.map((eq) => {
                          // Check if this equipment is already selected in another item
                          const isSelected = data.items.some((otherItem, otherIndex) => 
                            otherIndex !== index && otherItem.equipment_id === eq.id
                          );
                          return (
                            <option key={eq.id} value={eq.id} disabled={isSelected}>
                              {eq.name} {isSelected ? "(Already selected)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Quantity</label>
                      {(() => {
                        const selectedId = item.equipment_id;
                        const eq = equipmentList.find((e) => e.id === selectedId);
                        const maxQty = canCheck
                          ? availability[selectedId] ?? eq?.total_quantity ?? 1
                          : eq?.total_quantity ?? 1;
                        return (
                          <div>
                            <input
                              type="number"
                              min={1}
                              max={maxQty}
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => {
                                let val = Number(e.target.value);
                                if (val > maxQty) val = maxQty;
                                if (val < 1) val = 1;
                                updateEquipmentItem(index, "quantity", val);
                              }}
                              className="w-full border border-red-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none text-black transition-all duration-150"
                            />
                            <span className="text-xs text-gray-500 mt-1 block">
                              Max: {maxQty}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-end">
                      {data.items.length > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => removeEquipmentItem(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200"
                          title="Remove this equipment"
                        >
                          <FaTrash />
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Equipment Info - At same level as Max text */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-1">
                    <div className="md:col-span-2">
                      {(() => {
                        const eq = equipmentList.find((e) => e.id === item.equipment_id);
                        return eq ? (
                          <div className="text-xs text-gray-600">
                            <strong>Selected:</strong> {eq.name}
                            {eq.description && ` - ${eq.description}`}
                            {eq.category && ` | Category: ${eq.category}`}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Request Summary */}
            {data.items.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <h4 className="font-semibold text-blue-800 mb-2">Request Summary</h4>
                <p className="text-blue-700 text-sm">
                  You are requesting <span className="font-bold">{data.items.length}</span> different equipment items:
                </p>
                <ul className="mt-2 space-y-1">
                  {data.items.map((item, index) => {
                    const eq = equipmentList.find((e) => e.id === item.equipment_id);
                    return (
                      <li key={index} className="text-sm text-blue-600">
                        • {eq?.name} (Qty: {item.quantity})
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}

            <div className="flex justify-end mt-8">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-7 py-2.5 
                  rounded-lg shadow-md hover:shadow-xl transition-all duration-200 font-semibold flex items-center gap-2"
                type="submit"
                disabled={processing}
              >
                {processing ? "Submitting…" : `Book ${data.items.length > 1 ? `${data.items.length} Equipment Items` : "Equipment"}`}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Confirmation Modal (unchanged) */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-red-100"
          >
            {/* Close (X) */}
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-red-500 transition"
              aria-label="Close"
            >
              <FaTimes />
            </button>

            {/* Header */}
            <div className="flex items-center mb-4">
              <FaInfoCircle className="text-red-500 text-2xl mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">
                Confirm Submission
              </h3>
            </div>

            {/* Body text */}
            <p className="text-gray-600 text-base leading-6 mb-5">
              Are you sure you want to submit the equipment request? Please review your details before proceeding.
            </p>

            {/* Checkbox */}
            <label className="flex items-start space-x-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-red-500"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
              />
              <span className="text-sm text-gray-800">
                I confirm that I have reviewed all the details and they are correct
              </span>
            </label>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndSubmit}
                disabled={!confirmChecked || processing}
                className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
                  confirmChecked && !processing
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-red-300 cursor-not-allowed"
                }`}
              >
                {processing ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
