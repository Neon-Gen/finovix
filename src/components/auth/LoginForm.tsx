import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, Eye, EyeOff, Mail, Lock, AlertCircle, Shield, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface LoginFormData {
  email: string
  password: string
}

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError('')
      const { error } = await signIn(data.email, data.password)
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else if (error.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a few minutes before trying again.')
        } else {
          setError(error.message)
        }
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants for consistent effects
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const inputContainerVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.01 },
    focus: { scale: 1.02 }
  }

  const labelVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.02 }
  }

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.98,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8"
    >
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.5,
              ease: ["easeOut"] as const
            }
          }
        }}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <motion.div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex justify-center mb-6 -mt-20"
          >
            <div className="border-gradient-to-r from-black to-gray-900 rounded-lg p-2">
              <img 
                src="../../public/8d.png" 
                alt="Logo"
                className="h-[156px] w-[156px] text-white [filter:drop-shadow(0_2px_2px_rgba(0,0,0,1))]"
              />
            </div>
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold text-gray-900 mb-2 -mt-10"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Sign in to access your premium account
          </motion.p>
        </motion.div>

        <motion.div 
          className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Security Notice */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="mb-6 p-4 bg-gray-200 border border-gray-400 rounded-3xl flex items-start"
          >
            <Shield className="h-5 w-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-800">Secure Login</h4>
              <p className="text-xs text-gray-600 mt-1">
                Your account is protected with enhanced security features.
              </p>
            </div>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 p-3 bg-gray-200 border border-gray-400 rounded-3xl flex items-center"
            >
              <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">{error}</span>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: ["easeOut"] as const
                  }
                }
              }}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {/* Email Field */}
              <motion.div>
                <motion.label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Email
                </motion.label>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                    placeholder="you@example.com"
                  />
                </motion.div>
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div>
                <motion.div className="flex justify-between items-center mb-1">
                  <motion.label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                    variants={labelVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    Password
                  </motion.label>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to="/forgot-password"
                      className="text-xs text-gray-800 hover:text-gray-600 font-medium"
                    >
                      <motion.span
                        initial={{ backgroundSize: '0% 2px' }}
                        whileHover={{ 
                          backgroundSize: '100% 2px',
                          transition: { duration: 0.3 }
                        }}
                        style={{
                          backgroundImage: 'linear-gradient(currentColor, currentColor)',
                          backgroundPosition: '0 100%',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        Forgot password?
                      </motion.span>
                    </Link>
                  </motion.div>
                </motion.div>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 17
                      }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>

            {/* Sign In Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-black to-gray-800 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              variants={{
                rest: { scale: 1 },
                hover: { 
                  scale: 1.02,
                  transition: {
                    type: "spring" as const,
                    stiffness: 400,
                    damping: 10
                  }
                },
                tap: { 
                  scale: 0.98,
                  transition: {
                    type: "spring" as const,
                    stiffness: 400,
                    damping: 15
                  }
                }
              }}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="relative z-10 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span className="animate-pulse">Signing in...</span>
                  </div>
                ) : (
                  <span>Sign in</span>
                )}
              </motion.div>
            </motion.button>

            {/* Sign Up Link */}
            <motion.div 
              className="text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Don't have an account?{' '}
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link 
                  to="/signup" 
                  className="font-medium text-gray-800 hover:text-gray-900"
                >
                  <motion.span
                    initial={{ backgroundSize: '0% 2px' }}
                    whileHover={{ 
                      backgroundSize: '100% 2px',
                      transition: { duration: 0.3 }
                    }}
                    style={{
                      backgroundImage: 'linear-gradient(currentColor, currentColor)',
                      backgroundPosition: '0 100%',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    Sign up
                  </motion.span>
                </Link>
              </motion.span>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default LoginForm