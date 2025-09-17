import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

type Request = {
  id: number;
  type: string;
  date: string;
  status: string;
  items?: { name: string; quantity: number }[]; // <-- add this
  details?: {
    purpose?: string;
    items?: { name: string; quantity: number }[]; // optional, if still needed elsewhere
  };
};

type Props = {
  request: Request | null;
  onClose: () => void;
};

export default function RequestDetailsModal({ request, onClose }: Props) {
  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-gray-200"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 text-gray-400 hover:text-red-500 transition"
              aria-label="Close"
            >
              <FaTimes />
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-red-600 mb-6">
              Request Details
            </h2>

            {/* Request summary */}
            <div className="space-y-4 text-gray-700">
              <p>
                <span className="font-semibold">Type:</span> {request.type}
              </p>
              <p>
                <span className="font-semibold">Date & Time:</span>{" "}
                {new Date(request.date).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {request.status}
              </p>

              {/* Purpose (if available) */}
              {request.details?.purpose && (
                <p>
                  <span className="font-semibold">Purpose:</span>{" "}
                  {request.details.purpose}
                </p>
              )}

              {/* Equipment Request Items */}
              {request.type === "Equipment Request" &&
                request.items &&
                request.items.length > 0 && (
                  <div>
                    <span className="font-semibold">Requested Items:</span>
                    <ul className="list-disc list-inside ml-4 mt-2">
                      {request.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name} — Qty:{" "}
                          <span className="font-semibold">{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
