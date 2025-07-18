import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Building, AlertCircle, CheckCircle, Shield, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface SignupFormData {
  fullName: string
  companyName: string
  email: string
  password: string
  confirmPassword: string
}

const SignupForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    feedback: string[]
    isValid: boolean
  }>({ score: 0, feedback: [], isValid: false })
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>()

  const password = watch('password')

  // Enhanced password validation
  const validatePasswordStrength = (password: string) => {
    const feedback: string[] = []
    let score = 0

    if (!password) {
      return { score: 0, feedback: ['Password is required'], isValid: false }
    }

    // Length check
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('At least 8 characters required')
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Include at least one uppercase letter')
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Include at least one lowercase letter')
    }

    // Number check
    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Include at least one number')
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('Include at least one special character')
    }

    // Common password patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ]

    if (commonPatterns.some(pattern => pattern.test(password))) {
      feedback.push('Avoid common password patterns')
      score = Math.max(0, score - 1)
    }

    const isValid = score >= 4 && feedback.length === 0

    if (isValid) {
      feedback.push('Strong password!')
    }

    return { score, feedback, isValid }
  }

  React.useEffect(() => {
    if (password) {
      setPasswordStrength(validatePasswordStrength(password))
    } else {
      setPasswordStrength({ score: 0, feedback: [], isValid: false })
    }
  }, [password])

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-gray-400'
    if (score <= 2) return 'bg-gray-500'
    if (score <= 3) return 'bg-gray-600'
    if (score <= 4) return 'bg-gray-700'
    return 'bg-black'
  }

  const getPasswordStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak'
    if (score <= 2) return 'Weak'
    if (score <= 3) return 'Fair'
    if (score <= 4) return 'Good'
    return 'Strong'
  }

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true)
      setError('')

      // Additional client-side password validation
      if (!passwordStrength.isValid) {
        setError('Please create a stronger password that meets all requirements.')
        return
      }

      const { error } = await signUp(data.email, data.password, data.fullName, data.companyName)
      if (error) {
        if (error.message.includes('password')) {
          setError('Password does not meet security requirements. Please choose a different password.')
        } else if (error.message.includes('leaked') || error.message.includes('compromised')) {
          setError('This password has been found in data breaches. Please choose a different password for your security.')
        } else {
          setError(error.message)
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
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

  if (success) {
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
                ease: "easeOut" as const
              }
            }
          }}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div 
            className="bg-white py-8 px-6 shadow-xl rounded-3xl text-center border border-gray-200"
            whileHover={{ scale: 1.01 }}
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-gradient-to-r from-black to-gray-800 p-3 rounded-full">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold text-gray-900 mb-2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Account Created Successfully!
            </motion.h2>
            <motion.p 
              className="text-gray-600 mb-6"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Please check your email to verify your account. You'll be redirected to login shortly.
            </motion.p>
            <motion.div 
              className="animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="h-2 bg-gray-200 rounded-full">
                <motion.div 
                  className="h-2 bg-black rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center p-10 justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8"
    >
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: 0.5,
              ease: "easeOut" as const
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
            className="flex justify-center mb-6"
          >
            <div className="bg-gradient-to-r from-black to-gray-800 p-2 rounded-3xl shadow-md">
              <img 
                src="../../public/logo-round.png" 
                alt="Logo" 
                className="h-16 w-16 text-white invert"
              />
            </div>
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold text-gray-900 mb-2"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Create your account
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Start managing your PVC pipe manufacturing business
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
              <h4 className="text-sm font-medium text-gray-800">Enhanced Security</h4>
              <p className="text-xs text-gray-600 mt-1">
                We check passwords against known data breaches to keep your account secure.
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
                    ease: "easeOut" as const
                  }
                }
              }}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {/* Full Name Field */}
              <motion.div>
                <motion.label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Full Name
                </motion.label>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('fullName', {
                      required: 'Full name is required',
                      minLength: {
                        value: 2,
                        message: 'Full name must be at least 2 characters',
                      },
                    })}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </motion.div>
                {errors.fullName && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {errors.fullName.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Company Name Field */}
              <motion.div>
                <motion.label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Company Name
                </motion.label>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('companyName', {
                      required: 'Company name is required',
                      minLength: {
                        value: 2,
                        message: 'Company name must be at least 2 characters',
                      },
                    })}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    placeholder="Enter your company name"
                  />
                </motion.div>
                {errors.companyName && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {errors.companyName.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Email Field */}
              <motion.div>
                <motion.label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Email address
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
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
                <motion.label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Password
                </motion.label>
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
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      validate: () => passwordStrength.isValid || 'Password does not meet security requirements'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    placeholder="Create a strong password"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <motion.div 
                    className="mt-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength.score).replace('bg-', 'text-')}`}>
                        {getPasswordStrengthText(passwordStrength.score)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div 
                        className={`h-2 rounded-full ${getPasswordStrengthColor(passwordStrength.score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        transition={{ duration: 0.5, type: "spring" }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="mt-2 text-xs space-y-1 text-gray-600">
                        {passwordStrength.feedback.map((feedback, index) => (
                          <motion.li 
                            key={index} 
                            className={`flex items-center ${
                              feedback === 'Strong password!' ? 'text-black' : ''
                            }`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            {feedback === 'Strong password!' ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <span className="w-3 h-3 mr-1 text-center">•</span>
                            )}
                            {feedback}
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
                
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

              {/* Confirm Password Field */}
              <motion.div>
                <motion.label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Confirm Password
                </motion.label>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-200" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
                {errors.confirmPassword && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>

            {/* Create Account Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !passwordStrength.isValid}
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
              whileHover={!isLoading && !passwordStrength.isValid ? "hover" : {}}
              whileTap="tap"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-black to-gray-800 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
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
                    <span className="animate-pulse">Creating account...</span>
                  </div>
                ) : (
                  <span>Create account</span>
                )}
              </motion.div>
            </motion.button>

            {/* Sign In Link */}
            <motion.div 
              className="text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Already have an account?{' '}
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link 
                  to="/login" 
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
                    Sign in
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

export default SignupForm