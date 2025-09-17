import { useState } from 'react'
import { router } from '@inertiajs/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('') // <-- add this
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const togglePasswordVisibility = () => setShowPassword(prev => !prev)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(prev => !prev)

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      setTimeout(() => setError(''), 3000)
      return
    }

    router.post('/register', {
      first_name: firstName,
      middle_name: middleName, // <-- add this
      last_name: lastName,
      email,
      password,
      password_confirmation: confirmPassword,
    }, {
      onError: (errors: any) => {
        setError(errors.email || errors.password || "Registration failed.")
        setTimeout(() => setError(''), 3000)
      }
    })
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-950 text-white [font-family:'Poppins',sans-serif]">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 bg-[url('/images/uic-bg.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/70" />

      {/* Main container with motion */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col md:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl min-h-[200px] text-black"
      >
        {/* Register Form Section */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col justify-center p-4 md:p-6 w-full md:w-[470px] min-h-[200px]"
        >
          <h2 className="text-2xl font-extrabold text-center text-red-600 mb-5 tracking-tight">Register</h2>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 text-center text-sm text-red-600 bg-red-100 rounded-lg px-3 py-2 border border-red-300 shadow"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name Fields: Now vertically stacked */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold mb-1">First Name</label>
              <input
                id="firstName"
                type="text"
                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-base"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="middleName" className="block text-sm font-semibold mb-1">Middle Name/Initial</label>
              <input
                id="middleName"
                type="text"
                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-base"
                placeholder="Santos"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold mb-1">Last Name</label>
              <input
                id="lastName"
                type="text"
                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-base"
                placeholder="Dela Cruz"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1">Email</label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-base"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 rounded-md border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-base"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-lg"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 rounded-md border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-base"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-lg"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-2 rounded-md bg-red-500 text-white font-bold text-base hover:bg-red-600 transition duration-150 shadow"
            >
              Register
            </motion.button>

            <div className="text-center text-sm text-gray-700 mt-2">
              Already have an account?{' '}
              <a href="/login" className="text-red-500 font-semibold hover:underline">Login</a>
            </div>
          </form>
        </motion.div>

        {/* Branding Side with motion */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-400 text-white p-4 md:p-6 w-full md:w-[450px] min-h-[200px] gap-4"
        >
          <div className="text-2xl font-serif font-extrabold tracking-wide mb-1 drop-shadow-lg">EFFICIADMIN</div>
          <img src="/images/logo.png" alt="EFFICIADMIN Logo" className="w-20 h-auto drop-shadow-xl" />
          <div className="text-base font-medium text-white/90 text-center mt-2">
            Welcome! <br /> Create your account.
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
