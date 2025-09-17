import MainLayout from '@/layouts/mainlayout';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User2,
  Mail,
  KeyRound,
  Calendar,
  MapPin,
  Phone,
  Landmark,
  Locate,
  Building2,
  Pencil,
  Save,
  X
} from 'lucide-react';

export default function Profile() {
  const { auth } = usePage().props as any;
  const user = auth?.user ?? {};

  // Form states 
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handlers
  const handleEmailSave = () => {
    setEmailError('');
    setSuccessMsg('');
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    // TODO: Send email update request to backend
    setEditingEmail(false);
    setSuccessMsg('Email updated successfully!');
  };

  const handlePasswordSave = () => {
    setPasswordError('');
    setSuccessMsg('');
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    // TODO: Send password update request to backend
    setEditingPassword(false);
    setPassword('');
    setConfirmPassword('');
    setSuccessMsg('Password reset successfully!');
  };

  return (
    <MainLayout>
      <div className="p-12 font-poppins min-h-screen ">
        <div className="max-w-8xl min-h-[700px] mx-auto bg-white/90 rounded-2xl shadow-2xl p-12">
          <div className="flex items-center gap-6 mb-10">
            <div className="bg-[#e6232a] rounded-full p-4 shadow-lg">
              <User2 className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-[#e6232a]">Profile</h1>
              <p className="text-black text-lg">View and edit your profile information.</p>
            </div>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 px-4 py-2 bg-green-100 text-green-800 rounded flex items-center gap-2"
              >
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg('')}>
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-14">
            {/* Name */}
            <div className="flex items-center gap-4">
              <User2 className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Name:</span>
              <span className="text-black">
                {user.first_name} {user.middle_name ? user.middle_name + ' ' : ''} {user.last_name}
              </span>
            </div>
            {/* School ID */}
            <div className="flex items-center gap-4">
              <Landmark className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">School ID:</span>
              <span className="text-black">{user.school_id_number || '-'}</span>
            </div>
            {/* Date of Birth */}
            <div className="flex items-center gap-4">
              <Calendar className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Date of Birth:</span>
              <span className="text-black">{user.date_of_birth || '-'}</span>
            </div>
            {/* Email */}
            <div className="flex items-center gap-4">
              <Mail className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Email:</span>
              {!editingEmail ? (
                <>
                  <span className="text-black">{email}</span>
                  <button
                    className="ml-2 text-xs text-[#e6232a] hover:underline flex items-center gap-1"
                    onClick={() => setEditingEmail(true)}
                  >
                    <Pencil className="w-4 h-4" /> Change
                  </button>
                </>
              ) : (
                <motion.form
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2"
                  onSubmit={e => { e.preventDefault(); handleEmailSave(); }}
                >
                  <input
                    type="email"
                    className="border rounded px-2 py-1 text-sm text-black"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-[#e6232a] text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => { setEditingEmail(false); setEmail(user.email); setEmailError(''); }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.form>
              )}
            </div>
            {emailError && <div className="text-red-500 text-xs ml-16">{emailError}</div>}

            {/* Password */}
            <div className="flex items-center gap-4">
              <KeyRound className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Password:</span>
              {!editingPassword ? (
                <button
                  className="ml-2 text-xs text-[#e6232a] hover:underline flex items-center gap-1"
                  onClick={() => setEditingPassword(true)}
                >
                  <Pencil className="w-4 h-4" /> Reset Password
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col gap-2"
                  onSubmit={e => { e.preventDefault(); handlePasswordSave(); }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      className="border rounded px-2 py-1 text-sm text-black"
                      placeholder="New password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      className="border rounded px-2 py-1 text-sm text-black"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#e6232a] text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => { setEditingPassword(false); setPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {passwordError && <div className="text-red-500 text-xs">{passwordError}</div>}
                </motion.form>
              )}
            </div>

            {/* Address Info */}
            <div className="flex items-center gap-4">
              <MapPin className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Address:</span>
              <span className="text-black">{user.address || '-'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Building2 className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">City:</span>
              <span className="text-black">{user.city || '-'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Locate className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Province:</span>
              <span className="text-black">{user.province || '-'}</span>
            </div>
            <div className="flex items-center gap-4">
              <Landmark className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Region:</span>
              <span className="text-black">{user.region || '-'}</span>
            </div>
            {/* Contact */}
            <div className="flex items-center gap-4">
              <Phone className="text-[#e6232a] w-6 h-6" />
              <span className="font-semibold w-48 text-black">Contact Number:</span>
              <span className="text-black">{user.contact_number || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
