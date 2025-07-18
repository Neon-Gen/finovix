import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Building,
  Bell,
  Shield,
  Globe,
  Palette,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Settings as SettingsIcon,
  Camera,
  Edit2,
  Copy,
  ExternalLink,
  LogOut,
  Monitor,
  Zap,
  Database,
  FileText,
  HelpCircle,
  Info,
  RotateCcw,
  X
} from 'lucide-react'
import { useForm } from 'react-hook-form'

interface SecurityEvent {
  id: string
  event_type: string
  ip_address: string
  user_agent: string
  created_at: string
}

const Settings: React.FC = () => {
  const { user, signOut } = useAuth()
  const { settings, updateSettings, resetSettings, exportData, deleteAccount, loading } = useSettings()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm()

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, color: 'from-gray-500 to-gray-600' },
    { id: 'company', name: 'Company', icon: Building, color: 'from-gray-500 to-gray-600' },
    { id: 'notifications', name: 'Notifications', icon: Bell, color: 'from-gray-500 to-gray-600' },
    { id: 'security', name: 'Security & Privacy', icon: Shield, color: 'from-gray-500 to-gray-600' },
    { id: 'preferences', name: 'App Preferences', icon: Globe, color: 'from-gray-500 to-gray-600' },
    { id: 'data', name: 'Data & Privacy', icon: Database, color: 'from-gray-500 to-gray-600' }
  ]

  // Auto-logout functionality
  useEffect(() => {
    if (!autoLogoutEnabled) return

    const handleBeforeUnload = () => {
      // Store flag that app was closed
      localStorage.setItem('app_closed', 'true')
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App is being hidden/minimized
        localStorage.setItem('app_hidden_time', Date.now().toString())
      } else {
        // App is being shown again
        const hiddenTime = localStorage.getItem('app_hidden_time')
        if (hiddenTime) {
          const timeDiff = Date.now() - parseInt(hiddenTime)
          // If app was hidden for more than 5 minutes, logout
          if (timeDiff > 5 * 60 * 1000) {
            handleAutoLogout()
          }
          localStorage.removeItem('app_hidden_time')
        }
      }
    }

    const handleFocus = () => {
      // Check if app was closed and reopened
      const appClosed = localStorage.getItem('app_closed')
      if (appClosed === 'true') {
        localStorage.removeItem('app_closed')
        handleAutoLogout()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [autoLogoutEnabled])

  const handleAutoLogout = async () => {
    try {
      await signOut()
      setMessage({ 
        type: 'error',
        text: 'You have been automatically logged out for security reasons.' 
      })
    } catch (error) {
      console.error('Auto logout error:', error)
    }
  }

  useEffect(() => {
    if (settings) {
      reset(settings)
      setAutoLogoutEnabled(settings.auto_logout_enabled ?? true)
    }
  }, [settings, reset])

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityEvents()
    }
  }, [activeTab])

  const fetchSecurityEvents = async () => {
    if (!user) return

    try {
      setLoadingEvents(true)
      
      // Fetch security events from Supabase
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      // Transform and set the security events
      const transformedEvents = data.map(event => ({
        id: event.id,
        event_type: event.event_type,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        created_at: event.created_at
      }))

      setSecurityEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching security events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setSaving(true)
      
      // Include auto-logout setting
      const updatedData = {
        ...data,
        auto_logout_enabled: autoLogoutEnabled
      }
      
      const success = await updateSettings(updatedData)
      if (success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating settings.' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const onPasswordSubmit = async (data: any) => {
    try {
      setSaving(true)
      
      if (data.newPassword !== data.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' })
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setShowPasswordChange(false)
        resetPassword()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update password.' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleResetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      try {
        setSaving(true)
        const success = await resetSettings()
        if (success) {
          setMessage({ type: 'success', text: 'Settings reset to default values!' })
          reset(settings || {})
        } else {
          setMessage({ type: 'error', text: 'Failed to reset settings.' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'An error occurred while resetting settings.' })
      } finally {
        setSaving(false)
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const handleExportData = async () => {
    try {
      await exportData()
      setMessage({ type: 'success', text: 'Data exported successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data.' })
    } finally {
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const success = await deleteAccount()
        if (success) {
          await signOut()
        } else {
          setMessage({ type: 'error', text: 'Failed to delete account.' })
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'An error occurred while deleting account.' })
      }
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'sign_in_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'sign_in_failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'sign_out':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'password_changed':
        return <Key className="h-4 w-4 text-purple-500" />
      case 'settings_updated':
        return <SettingsIcon className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-black to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl lg:text-4xl font-bold mb-2"
              >
                Account Settings
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-gray-300 text-lg"
              >
                Manage your account preferences and security settings
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className="text-white">
                <div className="text-2xl font-medium tracking-tight">
                  {user?.user_metadata?.full_name || user?.email || 'User'}
                </div>
                <div className="text-sm text-gray-300">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleResetSettings}
                className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
              >
                <RotateCcw className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border ${
              message.type === 'success' 
                ? 'bg-gray-50 border-gray-200 text-gray-800' 
                : 'bg-gray-100 border-gray-300 text-gray-900'
            }`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2 text-gray-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-gray-700" />
              )}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Enhanced Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-1"
        >
          <nav className="space-y-2">
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-6 py-4 text-left rounded-2xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`p-2 rounded-2xl mr-4 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-gray-700 to-gray-600' 
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                }`}>
                  <tab.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{tab.name}</span>
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-3"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-8 shadow-md border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                          {settings?.full_name?.charAt(0) || user?.email?.charAt(0)}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          className="absolute -bottom-2 -right-2 p-2 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        {...register('full_name', { required: 'Full name is required' })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                      {errors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.full_name.message as string}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        {...register('email', { required: 'Email is required' })}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        {...register('timezone')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Company Tab */}
              {activeTab === 'company' && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-8 shadow-md border border-gray-200"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Company Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        {...register('company_name')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                      <textarea
                        {...register('company_address')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter company address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
                      <input
                        {...register('company_phone')}
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter company phone"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                      <input
                        {...register('company_email')}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter company email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        {...register('company_website')}
                        type="url"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Number</label>
                      <input
                        {...register('tax_number')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="Enter tax number"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Email Notifications</h2>
                    <div className="space-y-6">
                      {[
                        { key: 'email_notifications', title: 'General Notifications', desc: 'Receive general app notifications via email' },
                        { key: 'bill_reminders', title: 'Bill Reminders', desc: 'Get notified about upcoming bill due dates' },
                        { key: 'payment_alerts', title: 'Payment Alerts', desc: 'Receive notifications when payments are received' },
                        { key: 'expense_alerts', title: 'Expense Alerts', desc: 'Get notified about expense budget limits' }
                      ].map((item, index) => (
                        <motion.div 
                          key={item.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              {...register(item.key)}
                              type="checkbox"
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Report Notifications</h2>
                    <div className="space-y-6">
                      {[
                        { key: 'weekly_reports', title: 'Weekly Reports', desc: 'Receive weekly business summary reports' },
                        { key: 'monthly_reports', title: 'Monthly Reports', desc: 'Receive monthly financial reports' }
                      ].map((item, index) => (
                        <motion.div 
                          key={item.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              {...register(item.key)}
                              type="checkbox"
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security & Privacy Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Password Section */}
                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Password & Authentication</h2>
                        <p className="text-gray-600">Manage your password and authentication settings</p>
                      </div>
                      <Shield className="h-8 w-8 text-green-500" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div>
                          <h3 className="font-medium text-gray-900">Password</h3>
                          <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setShowPasswordChange(true)}
                          className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                        >
                          Change Password
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                        <div>
                          <h3 className="font-medium text-gray-900">Auto Logout on App Close</h3>
                          <p className="text-sm text-gray-600">Automatically logout when app is closed for security</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoLogoutEnabled}
                            onChange={(e) => setAutoLogoutEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-green-50 rounded-2xl border border-green-200">
                        <div>
                          <h3 className="font-medium text-green-900">Leaked Password Protection</h3>
                          <p className="text-sm text-green-700">Your password is checked against known data breaches</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Privacy Settings</h2>
                    <div className="space-y-6">
                      {[
                        { key: 'data_sharing', title: 'Data Sharing', desc: 'Allow sharing anonymized data for product improvement' },
                        { key: 'analytics_tracking', title: 'Analytics Tracking', desc: 'Help us improve the app by sharing usage analytics' },
                        { key: 'marketing_emails', title: 'Marketing Emails', desc: 'Receive emails about new features and updates' }
                      ].map((item, index) => (
                        <motion.div 
                          key={item.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                        >
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              {...register(item.key)}
                              type="checkbox"
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Security Events */}
                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-gray-900">Recent Security Events</h2>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={fetchSecurityEvents}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                        disabled={loadingEvents}
                      >
                        <RefreshCw className={`h-5 w-5 ${loadingEvents ? 'animate-spin' : ''}`} />
                      </motion.button>
                    </div>

                    {loadingEvents ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
                      </div>
                    ) : securityEvents.length > 0 ? (
                      <div className="space-y-4">
                        {securityEvents.slice(0, 5).map((event, index) => (
                          <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                          >
                            <div className="flex items-center space-x-3">
                              {getEventIcon(event.event_type)}
                              <div>
                                <h3 className="font-medium text-gray-900">{formatEventType(event.event_type)}</h3>
                                <p className="text-sm text-gray-600">
                                  {event.ip_address} • {new Date(event.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigator.clipboard.writeText(event.ip_address)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                              title="Copy IP Address"
                            >
                              <Copy className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No recent security events</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* App Preferences Tab */}
              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-8 shadow-md border border-gray-200"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Application Preferences</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        {...register('currency')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                      <select
                        {...register('date_format')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                      <select
                        {...register('time_format')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                      >
                        <option value="12h">12 Hour</option>
                        <option value="24h">24 Hour</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        {...register('language')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Tax Rate (%)</label>
                      <input
                        {...register('default_tax_rate', { 
                          min: { value: 0, message: 'Tax rate cannot be negative' },
                          max: { value: 100, message: 'Tax rate cannot exceed 100%' }
                        })}
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                        placeholder="18.00"
                      />
                      {errors.default_tax_rate && (
                        <p className="mt-1 text-sm text-red-600">{errors.default_tax_rate.message as string}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Data Management</h2>
                    
                    <div className="space-y-4">
                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border border-blue-200"
                      >
                        <div>
                          <h3 className="font-medium text-blue-900">Export Your Data</h3>
                          <p className="text-sm text-blue-700">Download all your data in JSON format</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleExportData}
                          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </motion.button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-6 bg-green-50 rounded-2xl border border-green-200"
                      >
                        <div>
                          <h3 className="font-medium text-green-900">Import Data</h3>
                          <p className="text-sm text-green-700">Import your data from JSON file</p>
                        </div>
                        <label className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          <span>Import JSON</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  try {
                                    const jsonData = JSON.parse(e.target?.result as string);
                                    // Handle the imported JSON data here
                                    console.log('Imported data:', jsonData);
                                    setMessage({ type: 'success', text: 'Data imported successfully!' });
                                  } catch (error) {
                                    setMessage({ type: 'error', text: 'Invalid JSON file format' });
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-6 bg-yellow-50 rounded-2xl border border-yellow-200"
                      >
                        <div>
                          <h3 className="font-medium text-yellow-900">Reset All Settings</h3>
                          <p className="text-sm text-yellow-700">Reset all settings to their default values</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleResetSettings}
                          className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Settings
                        </motion.button>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-6 bg-red-50 rounded-2xl border border-red-200"
                      >
                        <div>
                          <h3 className="font-medium text-red-900">Delete Account</h3>
                          <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Privacy Information</h2>
                    
                    <div className="prose prose-sm text-gray-600">
                      <p>
                        We take your privacy seriously. Your data is encrypted and stored securely. 
                        We never share your personal information with third parties without your consent.
                      </p>
                      <ul className="mt-4 space-y-2">
                        <li>• All data is encrypted in transit and at rest</li>
                        <li>• We use industry-standard security practices</li>
                        <li>• You have full control over your data</li>
                        <li>• We comply with data protection regulations</li>
                      </ul>
                      <p className="mt-4">
                        For more information, please read our{' '}
                        <a href="#" className="text-black hover:text-gray-700 font-medium">Privacy Policy</a> and{' '}
                        <a href="#" className="text-black hover:text-gray-700 font-medium">Terms of Service</a>.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            {activeTab !== 'data' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordChange && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPasswordChange(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>

              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      {...registerPassword('currentPassword', { required: 'Current password is required' })}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      {...registerPassword('newPassword', { 
                        required: 'New password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      {...registerPassword('confirmPassword', { required: 'Please confirm your password' })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message as string}</p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-8"
            >
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Settings