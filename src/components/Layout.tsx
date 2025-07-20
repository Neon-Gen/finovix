import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Building2,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  User,
  HelpCircle,
  Shield,
  NotebookText,
  Plus,
  TrendingUp,
  TrendingDown,
  Check,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Target,
  Goal
} from 'lucide-react'
import { useForm } from 'react-hook-form'

interface LayoutProps {
  children: React.ReactNode
}

interface CashbookFormData {
  type: 'income' | 'expense'
  date: string
  description: string
  amount: number
}

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const { showCreateSuccess, showError } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showCashbook, setShowCashbook] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showGoals, setShowGoals] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [goals, setGoals] = useState({
    monthlyRevenue: 500000,
    monthlyExpenses: 200000,
    newCustomers: 10,
    billsToCollect: 5
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CashbookFormData>({
    defaultValues: {
      type: 'income',
      date: new Date().toISOString().split('T')[0]
    }
  })

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bills', href: '/bills', icon: FileText },
    { name: 'Expenses', href: '/expenses', icon: CreditCard },
    { name: 'Purchase', href: '/purchase', icon: ShoppingCart },
    { name: 'Assets & Liabilities', href: '/assets', icon: Building2 },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Calendar },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (showUserMenu && !target.closest('.user-dropdown') && !target.closest('.user-button')) {
        setShowUserMenu(false)
      }
      
      if (showCashbook && !target.closest('.cashbook-modal') && !target.closest('.cashbook-button')) {
        setShowCashbook(false)
      }
      
      if (showNotifications && !target.closest('.notifications-dropdown') && !target.closest('.notifications-button')) {
        setShowNotifications(false)
      }
      
      if (showGoals && !target.closest('.goals-modal') && !target.closest('.goals-button')) {
        setShowGoals(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu, showCashbook, showNotifications])


  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const onCashbookSubmit = async (data: CashbookFormData) => {
    if (!user) return

    try {
      if (data.type === 'income') {
        // Create a bill entry for income
        const billNumber = `CASH-${Date.now()}`
        const { error } = await supabase.from('bills').insert({
          user_id: user.id,
          bill_number: billNumber,
          customer_name: 'Cash Entry',
          customer_email: '',
          customer_phone: '',
          items: [{ description: data.description, quantity: 1, rate: data.amount, amount: data.amount }],
          subtotal: data.amount,
          tax_amount: 0,
          total_amount: data.amount,
          status: 'paid',
          due_date: data.date,
          created_at: new Date(data.date).toISOString()
        })
        
        if (error) {
          showError('Cashbook Entry Failed', 'Failed to create income entry. Please try again.')
          throw error
        }
      } else {
        // Create an expense entry
        const { error } = await supabase.from('expenses').insert({
          user_id: user.id,
          description: data.description,
          amount: data.amount,
          category: 'Other Expenses',
          date: data.date
        })
        
        if (error) {
          showError('Cashbook Entry Failed', 'Failed to create expense entry. Please try again.')
          throw error
        }
      }

      setShowCashbook(false)
      reset()
      
      showCreateSuccess('Cashbook Entry', `${data.type === 'income' ? 'Income' : 'Expense'} of ₹${data.amount}`, { 
        category: data.type === 'income' ? 'bill' : 'expense' 
      })
    } catch (error) {
      console.error('Error saving cashbook entry:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return timestamp.toLocaleDateString()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans antialiased">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-500 ease-in-out ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Enhanced Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-black text-white shadow-xl transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:h-full ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between bg-none h-16 px-6 border-b border-white/20">
            <div className="flex items-center gap-2">
              <img src="/8d.png" alt='Finora' className="h-36 w-38 contrast-200 invert grayscale mt-1 opacity-90 hover:opacity-100 transition-opacity duration-300"/>
            </div>
            <button 
              className="lg:hidden p-2 rounded-full hover:bg-white/10 transition-all duration-300 hover:rotate-90"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <motion.a
                  key={item.name}
                  href={item.href}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-black shadow-lg'
                      : 'text-white hover:bg-white/20'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(item.href)
                    setSidebarOpen(false)
                  }}
                >
                  <div className="mr-3 transition-transform duration-300">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span>{item.name}</span>
                </motion.a>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/20">
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-white hover:bg-white/20 rounded-full transition-all duration-300"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sign out</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-black/10 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-black hover:bg-black/5 lg:hidden rounded-full transition-all duration-300"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </motion.button>

                <div className="hidden lg:block relative flex-1 max-w-xl group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-hover:scale-110 transition-transform duration-300">
                    <Search className="h-4 w-4 text-black/80 transition-all duration-300" />
                  </div>
                  <input
                    type="text"
                    placeholder="Quick search"
                    className="w-full pl-10 pr-12 py-2.5 text-sm border-2 border-black/30 rounded-full bg-white/50 
                    text-black font-medium placeholder-black/60 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5
                    transition-all duration-300 transform hover:scale-[1.02] hover:border-black/80 hover:shadow-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Cashbook Button */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="cashbook-button relative group p-2.5 text-black hover:bg-black/5 rounded-full transition-all duration-300"
                    onClick={() => setShowCashbook(!showCashbook)}
                    title="Open Cashbook"
                  >
                    <NotebookText className="h-5 w-5" />
                  </motion.button>

                  {/* Cashbook Modal */}
                  <AnimatePresence>
                    {showCashbook && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="cashbook-modal absolute right-0 mt-3.5 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 z-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-black">Quick Cashbook Entry</h3>
                          <button
                            onClick={() => setShowCashbook(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <form onSubmit={handleSubmit(onCashbookSubmit)} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex items-center p-3 border border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                  {...register('type')}
                                  type="radio"
                                  value="income"
                                  className="mr-2"
                                />
                                <TrendingUp className="h-4 w-4 text-black mr-2" />
                                <span className="text-sm font-medium">Income</span>
                              </label>
                              <label className="flex items-center p-3 border border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                  {...register('type')}
                                  type="radio"
                                  value="expense"
                                  className="mr-2"
                                />
                                <TrendingDown className="h-4 w-4 text-black mr-2" />
                                <span className="text-sm font-medium">Expense</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Date</label>
                            <input
                              {...register('date', { required: 'Date is required' })}
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Description</label>
                            <input
                              {...register('description', { required: 'Description is required' })}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="Enter description"
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Amount</label>
                            <input
                              {...register('amount', { 
                                required: 'Amount is required',
                                min: { value: 0.01, message: 'Amount must be greater than 0' }
                              })}
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="0.00"
                            />
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowCashbook(false)}
                              className="flex-1 px-4 py-2 text-black bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                            >
                              Add Entry
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {/* Goals Button */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="goals-button relative group p-2.5 text-black hover:bg-black/5 rounded-full transition-all duration-300"
                    onClick={() => setShowGoals(!showGoals)}
                    title="Set Goals & Targets"
                  >
                    <Target className="h-5 w-5" />
                  </motion.button>

                  {/* Goals Modal */}
                  <AnimatePresence>
                    {showGoals && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="goals-modal absolute right-0 mt-3.5 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 z-50"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-black">Monthly Goals</h3>
                          <button
                            onClick={() => setShowGoals(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Revenue Target</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={goals.monthlyRevenue}
                                onChange={(e) => setGoals(prev => ({ ...prev, monthlyRevenue: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="500000"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₹</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Expense Limit</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={goals.monthlyExpenses}
                                onChange={(e) => setGoals(prev => ({ ...prev, monthlyExpenses: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="200000"
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₹</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-black mb-2">New Customers</label>
                            <input
                              type="number"
                              value={goals.newCustomers}
                              onChange={(e) => setGoals(prev => ({ ...prev, newCustomers: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="10"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-black mb-2">Bills to Collect</label>
                            <input
                              type="number"
                              value={goals.billsToCollect}
                              onChange={(e) => setGoals(prev => ({ ...prev, billsToCollect: Number(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder="5"
                            />
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <button
                              onClick={() => setShowGoals(false)}
                              className="flex-1 px-4 py-2 text-black bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                setShowGoals(false)
                                addNotification({
                                  title: 'Goals Updated',
                                  message: 'Your monthly goals have been saved successfully',
                                  type: 'success'
                                })
                              }}
                              className="flex-1 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                            >
                              Save Goals
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notifications */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="notifications-button relative group p-2.5 text-black hover:bg-black/5 rounded-full transition-all duration-300"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5 relative z-10" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-black ring-2 ring-white animate-pulse shadow-sm" />
                    )}
                  </motion.button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="notifications-dropdown absolute right-0 mt-3.5 w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-black">Notifications</h3>
                            <div className="flex items-center space-x-2">
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="text-xs px-3 py-1 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                                >
                                  Mark all read
                                </button>
                              )}
                              <button
                                onClick={() => setShowNotifications(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                          </p>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                              {notifications.slice(0, 10).map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`p-4 hover:bg-gray-50 transition-colors ${
                                    !notification.read ? 'bg-blue-50' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className={`text-sm font-semibold ${
                                          !notification.read ? 'text-black' : 'text-gray-700'
                                        }`}>
                                          {notification.title}
                                        </h4>
                                        {!notification.read && (
                                          <div className="w-2 h-2 bg-black rounded-full"></div>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                      <p className="text-xs text-gray-500">{formatTimestamp(notification.timestamp)}</p>
                                    </div>
                                    <div className="flex items-center space-x-1 ml-2">
                                      {!notification.read && (
                                        <button
                                          onClick={() => markAsRead(notification.id)}
                                          className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                                          title="Mark as read"
                                        >
                                          <Check className="h-3 w-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-600">No notifications yet</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="user-button flex items-center gap-3 p-2 font-bold rounded-full hover:bg-black/[0.05] transition-all duration-300 overflow-hidden group"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="relative h-9 w-9 group-hover:animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-br font-bold from-black to-black/80 rounded-full"></div>
                      <div className="absolute inset-0.5 bg-gradient-to-br from-black to-black flex items-center justify-center text-white font-medium rounded-full ring-2 ring-black/5 transition-transform duration-300 group-hover:scale-110">
                        {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="hidden lg:block text-left relative z-10">
                      <p className="text-sm font-medium text-black font-bold line-clamp-1 group-hover:text-black/80 transition-colors">
                        {user?.user_metadata?.full_name || user?.email || 'User'}
                      </p>
                    </div>
                    <ChevronDown className={`hidden lg:block h-4 w-4 text-black/40 transition-all duration-300 ease-in-out relative z-10 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`} />
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="user-dropdown absolute right-0 mt-2 w-72 rounded-3xl shadow-xl bg-white backdrop-blur-lg border border-black/[0.06] py-3 z-50"
                      >
                        <div className="px-3">
                          <div className="flex items-center gap-3 p-3 rounded-full bg-black/[0.05] border border-black/5 hover:bg-black/[0.03] transition-all duration-200 hover:scale-[1.02]">
                            <div className="relative h-12 w-12 animate-pulse">
                              <div className="absolute inset-0 bg-gradient-to-br from-black to-black/80 rounded-full"></div>
                              <div className="absolute inset-0.5 bg-gradient-to-br from-black to-black flex items-center justify-center text-white font-medium rounded-full shadow-inner">
                                {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-black font-bold line-clamp-1 group-hover:text-black/80">
                                {user?.user_metadata?.full_name || user?.email || 'User'}
                              </p>
                              <p className="text-xs text-black/50">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-black/5 my-3" />

                        <div className="px-3 space-y-1">
                          {[
                            { icon: User, label: 'Profile Settings', onClick: () => { navigate('/settings'); setShowUserMenu(false); } },
                            { icon: Shield, label: 'Security' },
                            { icon: HelpCircle, label: 'Help & Support' }
                          ].map((item, index) => (
                            <motion.button 
                              key={index}
                              whileHover={{ scale: 1.02, x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={item.onClick}
                              className="flex items-center gap-3 w-full p-3 text-sm font-medium text-black hover:bg-black/[0.05] rounded-2xl transition-all duration-200"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </motion.button>
                          ))}
                        </div>

                        <div className="h-px bg-black/5 my-3" />

                        <div className="px-3">
                          <motion.button
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full p-3 text-sm font-semibold text-black hover:bg-gray-100 rounded-2xl transition-all duration-200"
                          >
                            <LogOut className="mr-3 h-5 w-5" />
                            <span>Sign out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout