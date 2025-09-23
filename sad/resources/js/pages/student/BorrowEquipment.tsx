import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/layouts/mainlayout";
import { useForm, usePage, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { FaInfoCircle, FaTimes, FaPlus, FaTrash, FaPaperPlane, FaChevronDown, FaCheck } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-theme.css";

// Themed minimal Select component (keyboard + mouse)
type SelectOption<V extends string | number | null = string | number | null> = {
  value: V;
  label: string;
  disabled?: boolean;
};

type MinimalSelectProps<V extends string | number | null = string | number | null> = {
  value: V;
  onChange: (value: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
};

function MinimalSelect<V extends string | number | null = string | number | null>(props: MinimalSelectProps<V>) {
  const { value, onChange, options, placeholder = "Select…", className = "", menuClassName = "" } = props;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(() => Math.max(0, options.findIndex(o => o.value === value)));
  const ref = React.useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Ensure highlight is on a non-disabled option
    let idx = options.findIndex((o) => o.value === value && !o.disabled);
    if (idx === -1) {
      idx = options.findIndex((o) => !o.disabled);
    }
    setHighlight(Math.max(0, idx));
  }, [open]);

  function move(delta: number) {
    if (!options.length) return;
    let idx = highlight;
    for (let i = 0; i < options.length; i++) {
      idx = (idx + delta + options.length) % options.length;
      if (!options[idx]?.disabled) break;
    }
    setHighlight(idx);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      else move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      const first = options.findIndex((o) => !o.disabled);
      if (first >= 0) setHighlight(first);
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setHighlight(i);
          break;
        }
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (options[highlight] && !options[highlight].disabled) {
        onChange(options[highlight].value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 text-left text-black px-4 py-3 shadow-sm flex items-center justify-between"
      >
        <span className={selected ? "text-black" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <FaChevronDown className={`ml-2 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
      </button>

      {open && (
        <motion.ul
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          role="listbox"
          className={`absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl ${menuClassName}`}
        >
          {options.map((opt, idx) => {
            const isSelected = selected?.value === opt.value;
            const isDisabled = !!opt.disabled;
            return (
              <li key={String(opt.value) + idx} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                    isDisabled
                      ? "text-gray-400 cursor-not-allowed"
                      : idx === highlight
                      ? "bg-red-50 text-black"
                      : "text-gray-700 hover:bg-red-50"
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-4 ${isSelected ? "text-red-600" : "text-transparent"}`}>
                    <FaCheck className="w-3 h-3" />
                  </span>
                  <span className="flex-1">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}

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
      // Get CSRF token from meta tag
      const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
      
      const res = await fetch("/equipment/availability", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": token
        },
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
        // Errors will be handled by React Toastify
        console.error("Equipment request submission failed:", errors);
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
      <div className="p-6 font-poppins min-h-screen text-black bg-white">
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
                <tr className="bg-white text-left border-b border-gray-200">
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
                      <td className="p-4 text-center">
                        {(() => {
                          const availableQty = canCheck ? (availability[eq.id] ?? eq.total_quantity) : eq.total_quantity;
                          const isUnavailable = canCheck && availableQty === 0;
                          
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-bold ${isUnavailable ? "text-red-500" : "text-green-600"}`}>
                                {availableQty}
                              </span>
                              {isUnavailable && (
                                <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                                  Unavailable
                                </span>
                              )}
                            </div>
                          );
                        })()}
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
                  className="w-full rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black px-4 py-3"
                />
              </div>

              {/* Activity Plan Selector */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Link to Activity Plan (optional)</label>
                <MinimalSelect<number | null>
                  value={data.activity_plan_id ?? null}
                  onChange={(val) => setData("activity_plan_id", val)}
                  options={[
                    { value: null, label: "— None —" },
                    ...activityPlans.map((plan) => ({
                      value: plan.id,
                      label: `${plan.activity_name} (${plan.start_datetime} → ${plan.end_datetime})`,
                    })),
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Request Category</label>
                <MinimalSelect<"minor" | "normal" | "urgent">
                  value={data.category}
                  onChange={(val) => setData("category", val)}
                  options={[
                    { value: "minor", label: "Minor" },
                    { value: "normal", label: "Normal" },
                    { value: "urgent", label: "Urgent" },
                  ]}
                  className="w-full"
                />
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
                    className="w-full rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black px-4 py-3"
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
                    className="w-full rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black px-4 py-3"
                  />
                </div>
              </div>
            </div>

            {/* Availability Warning */}
            {canCheck && Object.values(availability).some(avail => avail === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3"
              >
                <div className="text-yellow-600 text-lg mt-0.5">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">Equipment Unavailable</h4>
                  <p className="text-yellow-700 text-sm">
                    Some equipment is not available during your selected time window because it's already booked or checked out by other students.
                  </p>
                </div>
              </motion.div>
            )}

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
                      <MinimalSelect<number>
                        value={item.equipment_id}
                        onChange={(val) => updateEquipmentItem(index, "equipment_id", Number(val))}
                        options={equipmentList.map((eq) => {
                          const isSelectedElsewhere = data.items.some((otherItem, otherIndex) =>
                            otherIndex !== index && otherItem.equipment_id === eq.id
                          );
                          return {
                            value: eq.id,
                            label: `${eq.name}${isSelectedElsewhere ? " (Already selected)" : ""}`,
                            disabled: isSelectedElsewhere,
                          } as SelectOption<number>;
                        })}
                        className="w-full"
                      />
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
                              className={`w-full rounded-xl border focus:ring-2 outline-none transition-all duration-200 placeholder:text-gray-400 px-4 py-3 ${
                                maxQty === 0 
                                  ? "bg-red-50 border-red-200 text-red-600 cursor-not-allowed" 
                                  : "bg-gray-50 border-black/20 hover:border-black/40 focus:border-black focus:ring-black/10 text-black"
                              }`}
                              disabled={maxQty === 0}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs ${maxQty === 0 ? "text-red-500" : "text-gray-500"}`}>
                                Max: {maxQty}
                              </span>
                              {maxQty === 0 && (
                                <span className="text-xs text-red-600 font-medium">
                                  Not available during selected time
                                </span>
                              )}
                            </div>
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
                <FaPaperPlane className="w-4 h-4" />
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
