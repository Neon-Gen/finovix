import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Mail, AlertCircle, CheckCircle, Key, ArrowLeft, Shield, Clock, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmailFormData {
  email: string
}

interface VerificationFormData {
  code: string
}

interface ResetPasswordFormData {
  newPassword: string
  confirmPassword: string
}

const ForgotPasswordForm: React.FC = () => {
  const [step, setStep] = useState<'email' | 'verification' | 'reset'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const navigate = useNavigate()

  const emailForm = useForm<EmailFormData>()
  const verificationForm = useForm<VerificationFormData>()
  const resetForm = useForm<ResetPasswordFormData>()

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

  // Generate a 7-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString()
  }

  // Simulate sending verification code via email
  const sendVerificationCode = async (email: string) => {
    try {
      const code = generateVerificationCode()
      const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      
      setGeneratedCode(code)
      setCodeExpiry(expiry)
      setTimeLeft(600) // 10 minutes in seconds
      
      // In a real application, you would send this code via email
      console.log(`Verification code for ${email}: ${code}`)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true, code }
    } catch (error) {
      console.error('Error generating verification code:', error)
      return { success: false, error: 'Failed to generate verification code' }
    }
  }

  // Start countdown timer
  React.useEffect(() => {
    if (timeLeft > 0 && step === 'verification') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, step])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await sendVerificationCode(data.email)
      
      if (result.success) {
        setEmail(data.email)
        setStep('verification')
        
        // For demo purposes, show the code in an alert
        alert(`Demo: Your verification code is ${result.code}`)
      } else {
        setError(result.error || 'Failed to send verification code. Please try again.')
      }
    } catch (err) {
      console.error('Email submit error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onVerificationSubmit = async (data: VerificationFormData) => {
    try {
      setIsLoading(true)
      setError('')
      
      // Check if code has expired
      if (codeExpiry && new Date() > codeExpiry) {
        setError('Verification code has expired. Please request a new one.')
        return
      }
      
      // Verify the code
      if (data.code !== generatedCode) {
        setError('Invalid verification code. Please check and try again.')
        return
      }
      
      setVerificationCode(data.code)
      setStep('reset')
    } catch (err) {
      console.error('Verification submit error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true)
      setError('')
      
      if (data.newPassword !== data.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      
      if (data.newPassword.length < 8) {
        setError('Password must be at least 8 characters long.')
        return
      }
      
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Show success and redirect to login
      alert('Password reset successfully! Please login with your new password.')
      navigate('/login')
      
    } catch (err) {
      console.error('Reset submit error:', err)
      setError('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    if (timeLeft > 0) return
    
    try {
      setIsLoading(true)
      setError('')
      
      const result = await sendVerificationCode(email)
      
      if (result.success) {
        alert(`Demo: Your new verification code is ${result.code}`)
        verificationForm.reset()
      } else {
        setError('Failed to resend verification code. Please try again.')
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (step === 'verification') {
      setStep('email')
      setError('')
    } else if (step === 'reset') {
      setStep('verification')
      setError('')
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
              type: "tween",
              duration: 0.5,
              ease: "easeOut"
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
            {step === 'email' && 'Reset your password'}
            {step === 'verification' && 'Verify your email'}
            {step === 'reset' && 'Create new password'}
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {step === 'email' && 'Enter your email to receive a verification code'}
            {step === 'verification' && 'We sent a 7-digit code to your email'}
            {step === 'reset' && 'Choose a strong password for your account'}
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
              <h4 className="text-sm font-medium text-gray-800">Secure Password Reset</h4>
              <p className="text-xs text-gray-600 mt-1">
                Your account security is our priority. All password resets are encrypted.
              </p>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${step === 'email' ? 'text-gray-800' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                step === 'email' ? 'bg-gray-800 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {step === 'email' ? '1' : <CheckCircle className="h-5 w-5" />}
                </div>
                <span className="ml-2 text-sm font-medium">Email</span>
              </div>
              
              <div className={`flex items-center ${
                step === 'verification' ? 'text-gray-800' : 
                step === 'reset' ? 'text-gray-400' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === 'verification' ? 'bg-gray-800 text-white' : 
                  step === 'reset' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step === 'reset' ? <CheckCircle className="h-5 w-5" /> : '2'}
                </div>
                <span className="ml-2 text-sm font-medium">Verify</span>
              </div>
              
              <div className={`flex items-center ${step === 'reset' ? 'text-gray-800' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === 'reset' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Reset</span>
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-gray-800 h-2 rounded-full"
                initial={{ width: '0%' }}
                animate={{ 
                  width: step === 'email' ? '33%' : step === 'verification' ? '66%' : '100%' 
                }}
                transition={{ duration: 0.5 }}
              />
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

          {/* Step 1: Email Form */}
          {step === 'email' && (
            <form className="space-y-5" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      type: "tween",
                      duration: 0.5,
                      ease: "easeOut"
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
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
                    {...emailForm.register('email', {
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
                {emailForm.formState.errors.email && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {emailForm.formState.errors.email.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.button
                type="submit"
                disabled={isLoading}
                variants={{
                  rest: { scale: 1 },
                  hover: { scale: 1.02 },
                  tap: { scale: 0.98 }
                }}
                animate="rest"
                initial="rest"
                whileHover="hover"
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
                      <span className="animate-pulse">Sending code...</span>
                    </div>
                  ) : (
                    <span>Send verification code</span>
                  )}
                </motion.div>
              </motion.button>
            </form>
          )}

          {/* Step 2: Verification Code Form */}
          {step === 'verification' && (
            <form className="space-y-5" onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      type: "tween",
                      duration: 0.5,
                      ease: "easeOut"
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                <motion.label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Verification Code
                </motion.label>
                <motion.div 
                  className="relative flex justify-center space-x-2"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  {[0,1,2,3,4,5,6].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      pattern="\d"
                      className="w-12 h-12 text-center text-xl font-mono border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value && /^\d$/.test(value)) {
                          const form = e.target.form;
                          const inputs = Array.from(form?.elements || []) as HTMLInputElement[];
                          const currentIndex = inputs.indexOf(e.target);
                          if (currentIndex < 6) {
                            inputs[currentIndex + 1]?.focus();
                          }
                          
                          // Combine all digits and update form value
                          const code = inputs
                            .slice(0, 7)
                            .map(input => input.value)
                            .join('');
                          verificationForm.setValue('code', code);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !e.currentTarget.value) {
                          const form = e.currentTarget.form;
                          const inputs = Array.from(form?.elements || []) as HTMLInputElement[];
                          const currentIndex = inputs.indexOf(e.currentTarget);
                          if (currentIndex > 0) {
                            inputs[currentIndex - 1]?.focus();
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData('text');
                        const digits = pastedData.match(/\d/g)?.slice(0, 7) || [];
                        
                        const form = e.currentTarget.form;
                        const inputs = Array.from(form?.elements || []) as HTMLInputElement[];
                        
                        digits.forEach((digit, idx) => {
                          if (inputs[idx]) {
                            inputs[idx].value = digit;
                          }
                        });
                        
                        if (digits.length === 7) {
                          verificationForm.setValue('code', digits.join(''));
                        }
                        
                        // Focus the next empty input or the last input
                        const nextEmptyInput = inputs.find((input, idx) => !input.value && idx < 7);
                        if (nextEmptyInput) {
                          nextEmptyInput.focus();
                        } else {
                          inputs[6]?.focus();
                        }
                      }}
                    />
                  ))}
                </motion.div>
                {verificationForm.formState.errors.code && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600 text-center"
                  >
                    {verificationForm.formState.errors.code.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Timer and Resend */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <motion.div 
                    className="flex items-center justify-center text-sm text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Code expires in {formatTime(timeLeft)}
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={resendCode}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-sm text-gray-800 hover:text-gray-600 font-medium disabled:opacity-50 transition-colors"
                  >
                    Resend verification code
                  </motion.button>
                )}
              </div>

              <div className="flex space-x-3">
                <motion.button
                  type="button"
                  onClick={goBack}
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
                  whileHover="hover"
                  whileTap="tap"
                  className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isLoading}
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
                  whileHover="hover"
                  whileTap="tap"
                  className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-black to-gray-800 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
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
                        <span className="animate-pulse">Verifying...</span>
                      </div>
                    ) : (
                      <span>Verify code</span>
                    )}
                  </motion.div>
                </motion.button>
              </div>
            </form>
          )}

          {/* Step 3: Reset Password Form */}
          {step === 'reset' && (
            <form className="space-y-5" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-200 border border-gray-400 rounded-3xl flex items-center mb-4"
              >
                <CheckCircle className="h-5 w-5 text-gray-600 mr-2" />
                <span className="text-sm text-gray-700">Email verified successfully!</span>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      type: "tween",
                      duration: 0.5,
                      ease: "easeOut"
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                <motion.label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  New Password
                </motion.label>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...resetForm.register('newPassword', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain uppercase, lowercase, number and special character',
                      },
                    })}
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password"
                  />
                </motion.div>
                {resetForm.formState.errors.newPassword && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {resetForm.formState.errors.newPassword.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      type: "tween",
                      duration: 0.5,
                      ease: "easeOut"
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                <motion.label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  variants={labelVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  Confirm New Password
                </motion.label>
                <motion.div 
                  className="relative"
                  variants={inputContainerVariants}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="focus"
                >
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...resetForm.register('confirmPassword', {
                      required: 'Please confirm your password',
                    })}
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                  />
                </motion.div>
                {resetForm.formState.errors.confirmPassword && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-1 text-sm text-gray-600"
                  >
                    {resetForm.formState.errors.confirmPassword.message}
                  </motion.p>
                )}
              </motion.div>

              <div className="flex space-x-3">
                <motion.button
                  type="button"
                  onClick={goBack}
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
                  whileHover="hover"
                  whileTap="tap"
                  className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isLoading}
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
                  whileHover="hover"
                  whileTap="tap"
                  className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-black to-gray-800 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
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
                        <span className="animate-pulse">Resetting...</span>
                      </div>
                    ) : (
                      <span>Reset password</span>
                    )}
                  </motion.div>
                </motion.button>
              </div>
            </form>
          )}

          {/* Back to Login Link */}
          <motion.div 
            className="text-center mt-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link 
              to="/login" 
              className="font-medium text-gray-800 hover:text-gray-600"
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
                ← Back to Sign In
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default ForgotPasswordForm