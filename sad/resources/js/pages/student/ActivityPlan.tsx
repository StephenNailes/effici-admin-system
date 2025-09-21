import React, { useState } from "react";
import MainLayout from "@/layouts/mainlayout";
import { motion } from "framer-motion";
import { useForm } from "@inertiajs/react";
import {
  Activity,
  Calendar,
  Users,
  MapPin,
  ListChecks,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-theme.css"; // Import your custom theme

type Category = "minor" | "normal" | "urgent";

// Hoisted minimalist input components to avoid remounting on each render
const InputWithIcon: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }
> = ({ icon, ...props }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">{icon}</span>
    <input
      {...props}
      className="w-full pl-10 p-3 rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black"
      style={{ boxShadow: "none" }}
    />
  </div>
);

const TextareaWithIcon: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { icon: React.ReactNode }
> = ({ icon, ...props }) => (
  <div className="relative">
    <span className="absolute left-3 top-3 text-red-400">{icon}</span>
    <textarea
      {...props}
      className="w-full pl-10 p-3 rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black"
      style={{ boxShadow: "none" }}
    />
  </div>
);

const DatePickerWithIcon: React.FC<{
  icon: React.ReactNode;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  required?: boolean;
}> = ({ icon, selected, onChange, placeholder, required }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none">{icon}</span>
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="yyyy-MM-dd HH:mm"
      placeholderText={placeholder}
      className="w-full pl-10 p-3 rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black"
      required={required}
    />
  </div>
);

const InputNoIcon: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => (
  <input
    {...props}
    className="w-full p-3 rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black"
    style={{ boxShadow: "none" }}
  />
);

const TextareaNoIcon: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => (
  <textarea
    {...props}
    className="w-full p-3 rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black"
    style={{ boxShadow: "none" }}
  />
);

const DatePickerNoIcon: React.FC<{
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  required?: boolean;
}> = ({ selected, onChange, placeholder, required }) => (
  <DatePicker
    selected={selected}
    onChange={onChange}
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={15}
    dateFormat="yyyy-MM-dd HH:mm"
    placeholderText={placeholder}
    className="w-full p-3 rounded-xl bg-gray-50 border border-black/20 hover:border-black/40 focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all duration-200 placeholder:text-gray-400 text-black"
    required={required}
  />
);

export default function ActivityPlan() {
  const { data, setData, post, processing, errors } = useForm({
    activity_name: "",
    activity_purpose: "",
    category: "normal" as Category,
    start_datetime: "",
    end_datetime: "",
    objectives: "",
    participants: "",
    methodology: "",
    expected_outcome: "",
    activity_location: "",
  });

  // Local state for date pickers
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/activity-plans", { preserveScroll: true });
  };


  return (
    <MainLayout>
      <div className="p-6 font-poppins min-h-screen text-black bg-white">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">
            Activity Plan
          </h1>
          <p className="text-gray-600 text-base">Students can submit requests for activity plans.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6"
        >
          <InputNoIcon
            type="text"
            placeholder="Activity Name *"
            value={data.activity_name}
            onChange={(e) => setData("activity_name", e.target.value)}
            required
          />

          <TextareaNoIcon
            placeholder="Activity Purpose *"
            value={data.activity_purpose}
            onChange={(e) => setData("activity_purpose", e.target.value)}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerNoIcon
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  setData("start_datetime", date ? date.toISOString() : "");
                }}
                placeholder="Select start date & time"
                required
              />
            </div>

            <div>
              <DatePickerNoIcon
                selected={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setData("end_datetime", date ? date.toISOString() : "");
                }}
                placeholder="Select end date & time"
                required
              />
            </div>
          </div>

          {/* Optional Details */}
          <TextareaNoIcon
            placeholder="Objectives"
            value={data.objectives}
            onChange={(e) => setData("objectives", e.target.value)}
            rows={2}
          />

          <InputNoIcon
            type="text"
            placeholder="Expected Participants"
            value={data.participants}
            onChange={(e) => setData("participants", e.target.value)}
          />

          <InputNoIcon
            type="text"
            placeholder="Activity Location"
            value={data.activity_location}
            onChange={(e) => setData("activity_location", e.target.value)}
          />

          <TextareaNoIcon
            placeholder="Methodology"
            value={data.methodology}
            onChange={(e) => setData("methodology", e.target.value)}
            rows={3}
          />

          <TextareaNoIcon
            placeholder="Expected Outcome"
            value={data.expected_outcome}
            onChange={(e) => setData("expected_outcome", e.target.value)}
            rows={2}
          />

          {/* Error messages */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
              <AlertCircle className="w-6 h-6 text-red-700 mt-1" />
              <div>
                <h4 className="text-red-800 font-semibold mb-2">Errors:</h4>
                <ul className="text-red-600 text-sm space-y-1">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>• {message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Submit & Preview Buttons */}
          <div className="flex justify-end gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="px-6 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              onClick={() => {
                // Add your preview logic here
                alert("Preview document feature coming soon!");
              }}
            >
              Preview Document
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={processing}
              className={`px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 ${
                processing ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {processing ? "Submitting..." : "Submit Activity Plan"}
            </motion.button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
