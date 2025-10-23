import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useForm } from '@inertiajs/react'
import { FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi'
import { motion } from 'framer-motion'

type LoginForm = {
  username: string;
  password: string;
  remember: boolean;
};

export default function Login() {
  const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
    username: '',
    password: '',
    remember: false,
  })

  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('login'), {
      onFinish: () => reset('password'),
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

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-950 text-white [font-family:'Poppins',sans-serif]">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 bg-[url('/images/uic-bg.png')] bg-cover bg-center blur-sm" />
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
          <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8 tracking-tight">Login</h2>

          {/* Error Message */}
          {errors.username && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 text-center text-base text-red-600 bg-red-100 rounded-lg px-4 py-3 border border-red-300 shadow"
            >
              {errors.username}
            </motion.div>
          )}
          {errors.password && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 text-center text-base text-red-600 bg-red-100 rounded-lg px-4 py-3 border border-red-300 shadow"
            >
              {errors.password}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-7">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-base font-semibold mb-2">Username</label>
              <input
                id="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                className="w-full px-5 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-lg"
                placeholder="Enter your username"
                value={data.username}
                onChange={(e) => setData('username', e.target.value)}
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
                  autoComplete="current-password"
                  className="w-full px-5 py-3 pr-12 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-lg"
                  placeholder="Enter your password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
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
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="remember" className="flex items-center gap-2 text-gray-600">
                <input
                  id="remember"
                  type="checkbox"
                  checked={data.remember}
                  onChange={(e) => setData('remember', e.target.checked)}
                  className="accent-red-600 scale-110"
                />
                Remember me
              </label>
              <a href="/forgot-password" className="text-red-500 hover:underline font-medium">Forgot password?</a>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={processing}
              className="w-full py-3 rounded-lg bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition duration-150 shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <FiLogIn className="text-xl" />
                  Login
                </>
              )}
            </motion.button>

            {/* Link to Register */}
            <div className="text-center text-sm text-gray-700 mt-3">
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
          className="flex flex-col items-center justify-center bg-red-500 text-white p-19 w-full md:w-[500px] min-h-[600px] gap-8"
        >
          <div className="text-4xl font-bold tracking-wide mb-2 drop-shadow-lg">EFFICIADMIN</div>
          <img src="/images/logo.png" alt="Logo" className="w-36 h-auto drop-shadow-xl" />
          <div className="text-lg font-medium text-white/90 text-center mt-4">
            Welcome to Effici-Admin! <br /> Manage efficiently.
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
