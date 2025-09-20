import MainLayout from '@/layouts/mainlayout';
import { usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
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
  X,
  ChevronDown,
  Camera,
  Trash2
} from 'lucide-react';

export default function Profile() {
  const { auth } = usePage().props as any;
  const user = auth?.user ?? {};

  // Helper function to get correct profile picture URL
  const getProfilePictureUrl = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    
    // If it already starts with /storage/, use as is
    if (profilePicture.startsWith('/storage/')) {
      return profilePicture;
    }
    
    // Otherwise, add /storage/ prefix
    return `/storage/${profilePicture}`;
  };

  // Form states 
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingProfilePicture, setEditingProfilePicture] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [middleName, setMiddleName] = useState(user.middle_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(user.profile_picture || null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profilePictureError, setProfilePictureError] = useState('');
  const [nameError, setNameError] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileDropdown && !target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Handlers
  const handleEmailSave = () => {
    setEmailError('');
    if (!email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }
    
    router.put('/profile/update-email', {
      email: email
    }, {
      onSuccess: () => {
        setEditingEmail(false);
        toast.success('Email updated successfully!');
      },
      onError: (errors) => {
        const errorMessage = errors.email || 'Failed to update email.';
        setEmailError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handlePasswordSave = () => {
    setPasswordError('');
    if (!password || password.length < 6) {
      const errorMessage = 'Password must be at least 6 characters.';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match.';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    router.put('/profile/update-password', {
      password: password,
      password_confirmation: confirmPassword
    }, {
      onSuccess: () => {
        setEditingPassword(false);
        setPassword('');
        setConfirmPassword('');
        toast.success('Password updated successfully!');
      },
      onError: (errors) => {
        const errorMessage = errors.password || 'Failed to update password.';
        setPasswordError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProfilePictureError('');
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMessage = 'Please select a valid image file.';
      setProfilePictureError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const errorMessage = 'Image size must be less than 5MB.';
      setProfilePictureError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    // Create preview URL and store file
    const previewUrl = URL.createObjectURL(file);
    setProfilePicturePreview(previewUrl);
    setProfilePictureFile(file);
    setEditingProfilePicture(true);
  };

  const handleProfilePictureSave = () => {
    if (!profilePictureFile) return;
    
    const formData = new FormData();
    formData.append('profile_picture', profilePictureFile);
    
    router.post('/profile/update-picture', formData, {
      onSuccess: () => {
        setProfilePicture(profilePicturePreview);
        setEditingProfilePicture(false);
        setProfilePictureFile(null);
        toast.success('Profile picture updated successfully!');
      },
      onError: (errors) => {
        const errorMessage = errors.profile_picture || 'Failed to update profile picture.';
        setProfilePictureError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleProfilePictureCancel = () => {
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
    }
    setProfilePicturePreview(null);
    setProfilePictureFile(null);
    setEditingProfilePicture(false);
    setProfilePictureError('');
  };

  const handleProfilePictureRemove = () => {
    setProfilePictureError('');
    
    router.delete('/profile/remove-picture', {
      onSuccess: () => {
        setProfilePicture(null);
        toast.success('Profile picture removed successfully!');
      },
      onError: (errors) => {
        const errorMessage = errors.profile_picture || 'Failed to remove profile picture.';
        setProfilePictureError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleNameSave = () => {
    setNameError('');
    
    if (!firstName.trim() || !lastName.trim()) {
      const errorMessage = 'First name and last name are required.';
      setNameError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    router.put('/profile/update-name', {
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim()
    }, {
      onSuccess: () => {
        setEditingName(false);
        toast.success('Name updated successfully!');
      },
      onError: (errors) => {
        const errorMessage = errors.first_name || errors.last_name || 'Failed to update name.';
        setNameError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <MainLayout>
      <div className="p-8 font-poppins h-screen overflow-hidden text-black">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-red-600 tracking-tight">
            Profile
          </h1>
          <p className="text-gray-600 text-base">
            View and edit your profile information.
          </p>
        </div>

        <div className="grid gap-6">
            {/* Card 1: Basic Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-100">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-4 lg:col-span-1">
                  <div className="relative profile-dropdown-container">
                    <div 
                      className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 shadow-lg cursor-pointer hover:border-[#e6232a]/50 transition-colors"
                      onClick={() => !editingProfilePicture && setShowProfileDropdown(!showProfileDropdown)}
                    >
                      {(profilePicturePreview || profilePicture) ? (
                        <img
                          src={profilePicturePreview || getProfilePictureUrl(profilePicture) || ''}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <User2 className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Dropdown Menu */}
                    {showProfileDropdown && !editingProfilePicture && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <label className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                handleProfilePictureChange(e);
                                setShowProfileDropdown(false);
                              }}
                              className="hidden"
                            />
                            <Camera className="w-4 h-4 text-[#e6232a]" />
                            <span>Change Photo</span>
                          </label>
                          {profilePicture && (
                            <button
                              onClick={() => {
                                handleProfilePictureRemove();
                                setShowProfileDropdown(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove Photo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!editingProfilePicture ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">Profile Picture</span>
                      <span className="text-xs text-gray-500">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-semibold text-gray-700 text-sm">Profile Picture</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleProfilePictureSave}
                          className="bg-[#e6232a] hover:bg-[#d01e24] text-white px-3 py-1 rounded-lg flex items-center gap-1 text-xs transition-colors"
                        >
                          <Save className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={handleProfilePictureCancel}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {profilePictureError && <div className="text-red-500 text-xs text-center">{profilePictureError}</div>}
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {/* Name and Date of Birth Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="flex items-start gap-4">
                      <User2 className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0 mt-1" />
                      <div className="flex flex-col flex-grow">
                        <span className="font-semibold text-gray-700 text-sm mb-1">Name</span>
                        {!editingName ? (
                          <div className="flex items-center gap-3">
                            <span className="text-gray-900">
                              {firstName} {middleName ? middleName + ' ' : ''} {lastName}
                            </span>
                            <button
                              className="text-xs text-[#e6232a] hover:text-[#d01e24] hover:underline transition-colors flex items-center gap-1"
                              onClick={() => setEditingName(true)}
                            >
                              <Pencil className="w-3 h-3" /> Change
                            </button>
                          </div>
                        ) : (
                          <motion.form
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex flex-col gap-3"
                            onSubmit={e => { e.preventDefault(); handleNameSave(); }}
                          >
                            <div className="grid grid-cols-1 gap-2">
                              <input
                                type="text"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:border-[#e6232a] focus:ring-2 focus:ring-[#e6232a]/20 transition-colors"
                                placeholder="First Name"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:border-[#e6232a] focus:ring-2 focus:ring-[#e6232a]/20 transition-colors"
                                placeholder="Middle Name (Optional)"
                                value={middleName}
                                onChange={e => setMiddleName(e.target.value)}
                              />
                              <input
                                type="text"
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:border-[#e6232a] focus:ring-2 focus:ring-[#e6232a]/20 transition-colors"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="bg-[#e6232a] hover:bg-[#d01e24] text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
                              >
                                <Save className="w-3 h-3" /> Save
                              </button>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                onClick={() => { 
                                  setEditingName(false); 
                                  setFirstName(user.first_name || '');
                                  setMiddleName(user.middle_name || '');
                                  setLastName(user.last_name || '');
                                  setNameError(''); 
                                }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {nameError && <div className="text-red-500 text-xs">{nameError}</div>}
                          </motion.form>
                        )}
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="flex items-center gap-4">
                      <Calendar className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 text-sm">Date of Birth</span>
                        <span className="text-gray-900">{user.date_of_birth || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* School ID Row - Only show for students */}
                  {user.role === 'student' && (
                    <div className="flex items-center gap-4">
                      <Landmark className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 text-sm">School ID</span>
                        <span className="text-gray-900">{user.school_id_number || '-'}</span>
                      </div>
                    </div>
                  )}

                  {/* Email Row - Only editable for admin_assistant and dean */}
                  <div className="flex items-start gap-4">
                    <Mail className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0 mt-1" />
                    <div className="flex flex-col flex-grow">
                      <span className="font-semibold text-gray-700 text-sm mb-1">Email</span>
                      {!editingEmail || user.role === 'student' ? (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900">{email}</span>
                          {user.role !== 'student' && (
                            <button
                              className="text-xs text-[#e6232a] hover:text-[#d01e24] hover:underline transition-colors flex items-center gap-1"
                              onClick={() => setEditingEmail(true)}
                            >
                              <Pencil className="w-3 h-3" /> Change
                            </button>
                          )}
                        </div>
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
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:border-[#e6232a] focus:ring-2 focus:ring-[#e6232a]/20 transition-colors"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="bg-[#e6232a] hover:bg-[#d01e24] text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
                          >
                            <Save className="w-3 h-3" /> Save
                          </button>
                          <button
                            type="button"
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={() => { setEditingEmail(false); setEmail(user.email); setEmailError(''); }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.form>
                      )}
                      {emailError && <div className="text-red-500 text-xs mt-1">{emailError}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Other Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 pb-3 border-b border-gray-100">
                Other Information
              </h2>
              
              <div className="space-y-6">
                {/* Password */}
                <div className="flex items-center gap-4">
                  <KeyRound className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                  <div className="flex flex-col flex-grow">
                    <span className="font-semibold text-gray-700 text-sm">Password</span>
                    {!editingPassword ? (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900">••••••••</span>
                        <button
                          className="text-xs text-[#e6232a] hover:text-[#d01e24] hover:underline transition-colors flex items-center gap-1"
                          onClick={() => setEditingPassword(true)}
                        >
                          <Pencil className="w-3 h-3" /> Reset Password
                        </button>
                      </div>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex flex-col gap-3"
                        onSubmit={e => { e.preventDefault(); handlePasswordSave(); }}
                      >
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:border-[#e6232a] focus:ring-2 focus:ring-[#e6232a]/20 transition-colors"
                            placeholder="New password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                          />
                          <input
                            type="password"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:border-[#e6232a] focus:ring-2 focus:ring-[#e6232a]/20 transition-colors"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="bg-[#e6232a] hover:bg-[#d01e24] text-white px-3 py-2 rounded-lg flex items-center gap-1 text-sm transition-colors"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                              type="button"
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              onClick={() => { setEditingPassword(false); setPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {passwordError && <div className="text-red-500 text-xs">{passwordError}</div>}
                      </motion.form>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Address */}
                  <div className="flex items-center gap-4 lg:col-span-2">
                    <MapPin className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700 text-sm">Address</span>
                      <span className="text-gray-900">{user.address || '-'}</span>
                    </div>
                  </div>

                  {/* City */}
                  <div className="flex items-center gap-4">
                    <Building2 className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700 text-sm">City</span>
                      <span className="text-gray-900">{user.city || '-'}</span>
                    </div>
                  </div>

                  {/* Province */}
                  <div className="flex items-center gap-4">
                    <Locate className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700 text-sm">Province</span>
                      <span className="text-gray-900">{user.province || '-'}</span>
                    </div>
                  </div>

                  {/* Region */}
                  <div className="flex items-center gap-4">
                    <Landmark className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700 text-sm">Region</span>
                      <span className="text-gray-900">{user.region || '-'}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-4">
                    <Phone className="text-[#e6232a]/80 w-5 h-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700 text-sm">Contact Number</span>
                      <span className="text-gray-900">{user.contact_number || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </MainLayout>
  );
}
