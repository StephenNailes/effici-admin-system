import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { router } from '@inertiajs/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    router.post('/login', { email, password, remember }, {
      onError: (errors: any) => {
        if (errors.password) {
          setError(errors.password)
        } else if (errors.email) {
          setError(errors.email)
        } else {
          setError('Login failed. Please check your credentials.')
        }
      }
    })
  }

    // Example: Show logout success toast (call this after logout)
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('logout') === 'success') {
        toast.success('Logout successful!', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'colored',
        })
        // Remove the query param so it only shows once
        urlParams.delete('logout')
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '')
        window.history.replaceState({}, '', newUrl)
      }
    }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-950 text-white [font-family:'Poppins',sans-serif]">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 bg-[url('/images/uic-bg.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/70" />

      {/* Login container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col md:flex-row bg-white text-black rounded-4xl shadow-2xl overflow-hidden transition-all duration-500 w-full max-w-4xl min-h-[600px]"
      >
        {/* Login Form Section */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col justify-center p-12 md:p-16 w-full md:w-[480px] min-h-[600px]"
        >
          <h2 className="text-4xl font-extrabold text-center text-red-600 mb-8 tracking-tight">Login</h2>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 text-center text-base text-red-600 bg-red-100 rounded-lg px-4 py-3 border border-red-300 shadow"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-7">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-base font-semibold mb-2">Email</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-5 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-lg"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-base font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-5 py-3 pr-12 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-lg"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between text-base">
              <label htmlFor="remember" className="flex items-center gap-2 text-gray-700">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-red-600 scale-110"
                />
                Remember me
              </label>
              <a href="/forgot-password" className="text-red-500 hover:underline font-semibold">Forgot password?</a>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 rounded-lg bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition duration-150 shadow"
            >
              Login
            </motion.button>

            {/* Link to Register */}
            <div className="text-center text-base text-gray-700 mt-3">
              Don't have an account?{' '}
              <a href="/register" className="text-red-500 font-semibold hover:underline">Register</a>
            </div>
          </form>
        </motion.div>

        {/* Right Panel with Logo */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-400 text-white p-19 w-full md:w-[500px] min-h-[600px] gap-8"
        >
          <div className="text-4xl font-serif font-extrabold tracking-wide mb-2 drop-shadow-lg">EFFICIADMIN</div>
          <img src="/images/logo.png" alt="Logo" className="w-36 h-auto drop-shadow-xl" />
          <div className="text-lg font-medium text-white/90 text-center mt-4">
            Welcome to Effici-Admin! <br /> Manage efficiently.
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
