import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  Users,
  Calendar,
  IndianRupee,
  Plus,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  DollarSign,
  Activity,
  Download,
  Filter,
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'

interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  totalBills: number
  totalEmployees: number
  monthlyRevenue: Array<{ month: string; revenue: number; expenses: number; profit: number }>
  expensesByCategory: Array<{ category: string; amount: number; color: string }>
  recentBills: Array<any>
  recentExpenses: Array<any>
  pendingAttendance: number
  netProfit: number
  profitMargin: number
  revenueGrowth: number
  expenseGrowth: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalBills: 0,
    totalEmployees: 0,
    monthlyRevenue: [],
    expensesByCategory: [],
    recentBills: [],
    recentExpenses: [],
    pendingAttendance: 0,
    netProfit: 0,
    profitMargin: 0,
    revenueGrowth: 0,
    expenseGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
    
    const interval = setInterval(fetchDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setRefreshing(true)
      
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const totalRevenue = bills?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0
      const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0
      const totalBills = bills?.length || 0
      const totalEmployees = employees?.length || 0
      const netProfit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

      const monthlyRevenue = generateMonthlyData(bills || [], expenses || [])
      const expensesByCategory = calculateExpensesByCategory(expenses || [])

      const currentMonth = new Date().getMonth()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      
      const currentMonthBills = bills?.filter(bill => 
        new Date(bill.created_at).getMonth() === currentMonth
      ) || []
      const lastMonthBills = bills?.filter(bill => 
        new Date(bill.created_at).getMonth() === lastMonth
      ) || []
      
      const currentMonthRevenue = currentMonthBills.reduce((sum, bill) => sum + bill.total_amount, 0)
      const lastMonthRevenue = lastMonthBills.reduce((sum, bill) => sum + bill.total_amount, 0)
      
      const revenueGrowth = lastMonthRevenue > 0 ? 
        ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

      const currentMonthExpenses = expenses?.filter(expense => 
        new Date(expense.date).getMonth() === currentMonth
      ).reduce((sum, expense) => sum + expense.amount, 0) || 0
      
      const lastMonthExpenses = expenses?.filter(expense => 
        new Date(expense.date).getMonth() === lastMonth
      ).reduce((sum, expense) => sum + expense.amount, 0) || 0
      
      const expenseGrowth = lastMonthExpenses > 0 ? 
        ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0

      setStats({
        totalRevenue,
        totalExpenses,
        totalBills,
        totalEmployees,
        monthlyRevenue,
        expensesByCategory: expensesByCategory as { category: string; amount: number; color: string; }[],
        recentBills: bills?.slice(0, 5) || [],
        recentExpenses: expenses?.slice(0, 5) || [],
        pendingAttendance: 0,
        netProfit,
        profitMargin,
        revenueGrowth,
        expenseGrowth
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateMonthlyData = (bills: any[], expenses: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const currentDate = new Date()
    
    return months.map((month, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1)
      
      const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate.getMonth() === monthDate.getMonth() && 
               billDate.getFullYear() === monthDate.getFullYear()
      })
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === monthDate.getMonth() && 
               expenseDate.getFullYear() === monthDate.getFullYear()
      })
      
      const revenue = monthBills.reduce((sum, bill) => sum + bill.total_amount, 0)
      const expenseAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const profit = revenue - expenseAmount
      
      return {
        month,
        revenue,
        expenses: expenseAmount,
        profit
      }
    })
  }

  const calculateExpensesByCategory = (expenses: any[]) => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    const colors = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5']
    
    return Object.entries(categoryTotals)
      .filter(([_, amount]) => (amount as number) > 0)
      .map(([category, amount], index) => ({
        category,
        amount,
        color: colors[index % colors.length]
      }))
      .slice(0, 6)
  }

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'INR'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const quickActions = [
    {
      title: 'Create Bill',
      icon: FileText,
      action: () => navigate('/bills'),
      recentData: stats.recentBills.slice(0, 6)
    },
    {
      title: 'Add Expense',
      icon: CreditCard,
      action: () => navigate('/expenses'),
      recentData: stats.recentExpenses.slice(0, 6)
    },
    {
      title: 'Add Employee',
      icon: Users,
      action: () => navigate('/employees'),
      recentData: []
    },
    {
      title: 'Mark Attendance',
      icon: Calendar,
      action: () => navigate('/attendance'),
      recentData: []
    }
  ]

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const handleExportData = (format: 'pdf' | 'excel') => {
    const data = {
      stats,
      exportedAt: new Date().toISOString(),
      user: user?.email,
      format
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-data-${format}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowDownloadOptions(false)
  }

if (loading) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Welcome Header Skeleton */}
      <div className="bg-gradient-to-r from-black to-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden animate-pulse">
        <motion.div className="absolute inset-0 bg-black opacity-10" />
        <motion.div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <motion.div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        <div className="relative z-10">
          <div className="h-10 w-3/4 bg-white/10 rounded-lg mb-4" />
          <div className="h-6 w-1/2 bg-white/10 rounded-lg mb-4" />
          <div className="flex gap-4">
            <div className="h-8 w-32 bg-white/10 rounded-full" />
            <div className="h-8 w-32 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200 shadow-md animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 w-24 bg-gray-200 rounded-lg" />
              <div className="bg-black p-4 rounded-2xl">
                <div className="h-6 w-6 bg-white/20 rounded" />
              </div>
            </div>
            <div className="h-8 w-32 bg-gray-200 rounded-lg mb-4" />
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded-lg" />
              <div className="h-4 w-32 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div className="h-2 w-3/4 bg-black rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200 shadow-lg animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-6 w-6 bg-gray-200 rounded" />
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-md transition-all">
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-black p-4 rounded-2xl">
                  <div className="h-8 w-8 bg-white/20 rounded" />
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 shadow-lg animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          </div>
          <div className="bg-white p-6 rounded-2xl">
            <div className="h-[350px] bg-gray-200 rounded-2xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 shadow-lg animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          </div>
          <div className="bg-white p-6 rounded-2xl">
            <div className="h-[350px] bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-gradient-to-r from-black to-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden"
        layout
      >
        {/* Background decorative elements with optimized animations */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-black"
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 0.8 }}
          className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32 transform"
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24 transform"
        />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 tracking-tight"
              >
                Welcome back, {user?.user_metadata?.full_name || settings?.full_name}!
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-gray-300 text-base sm:text-lg mb-4 leading-relaxed"
              >
                Here's what's happening with {user?.user_metadata?.company_name || settings?.company_name} today.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-wrap items-center gap-4 text-sm"
              >
                <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-full">
                  <Activity className="h-3.5 w-3.5 mr-2" />
                  <span className="whitespace-nowrap">Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-full">
                  <Target className="h-3.5 w-3.5 mr-2" />
                  <span className="whitespace-nowrap">Goal: {formatCurrency(500000)} this month</span>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex items-center justify-center gap-4 shrink-0"
            >
              <div className="text-white hidden sm:block">
                <div className="text-xl font-medium tracking-tight whitespace-nowrap">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <RefreshCw 
                    className={`h-4 w-4 transition-all ${
                      refreshing ? 'animate-spin' : ''
                    }`} 
                  />
                  {refreshing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-full border-2 border-t-transparent border-white/30 animate-spin"
                    />
                  )}
                </motion.button>
                
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleExportData('excel')}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </motion.button>
                  
                  {/* <AnimatePresence>
                    {showDownloadOptions && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0  mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50"
                      >
                        <button
                          onClick={() => handleExportData('pdf')}
                          className="w-full px-4 py-2.5 text-left text-black hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <FileText className="h-4 w-4" />
                          Download PDF Report
                        </button>
                        <button
                          onClick={() => handleExportData('excel')}
                          className="w-full px-4 py-2.5 text-left text-black hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <Download className="h-4 w-4" />
                          Download Excel Report
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence> */}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Revenue',
            value: formatCurrency(stats.totalRevenue),
            icon: TrendingUp,
            growth: stats.revenueGrowth,
            delay: 0
          },
          {
            title: 'Total Expenses',
            value: formatCurrency(stats.totalExpenses),
            icon: TrendingDown,
            growth: stats.expenseGrowth,
            delay: 0.1
          },
          {
            title: 'Net Profit',
            value: formatCurrency(stats.netProfit),
            icon: IndianRupee,
            growth: stats.profitMargin,
            delay: 0.2
          },
          {
            title: 'Active Employees',
            value: stats.totalEmployees.toString(),
            icon: Users,
            growth: 0,
            delay: 0.3
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: stat.delay }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                <p className="text-2xl font-bold text-black">{stat.value}</p>
              </div>
              <div className="bg-black p-4 rounded-2xl group-hover:scale-105 transition-transform">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-black mr-1" />
              <span className="text-black font-medium">+{Math.abs(stat.growth).toFixed(1)}%</span>
              <span className="text-gray-600 ml-1">from last month</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1, delay: stat.delay + 0.5 }}
                className="bg-black h-2 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-lg border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-black mr-2" />
            <h2 className="text-xl font-bold text-black">Quick Actions</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <div key={index} className="relative">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQuickActions(showQuickActions === action.title ? null : action.title)}
                className="group p-6 bg-white hover:bg-gray-50 rounded-3xl transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-gray-300 w-full"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="bg-black group-hover:bg-gray-800 p-4 rounded-2xl group-hover:scale-110 transition-all duration-200 shadow-lg">
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black group-hover:text-gray-800 text-sm">{action.title}</h3>
                  </div>
                </div>
              </motion.button>
              
              {/* Dropdown for recent data */}
              <AnimatePresence>
                {showQuickActions === action.title && action.recentData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-black text-sm">Recent {action.title.includes('Bill') ? 'Bills' : 'Expenses'}</h4>
                      <button
                        onClick={() => setShowQuickActions(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {action.recentData.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-black">
                              {action.title.includes('Bill') ? item.customer_name : item.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(action.title.includes('Bill') ? item.created_at : item.date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-black">
                            {formatCurrency(action.title.includes('Bill') ? item.total_amount : item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        action.action()
                        setShowQuickActions(null)
                      }}
                      className="w-full mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                    >
                      View All
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Enhanced Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue vs Expenses Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Revenue vs Expenses</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reports')}
              className="text-black hover:text-gray-600 text-sm font-medium flex items-center transition-colors"
            >
              View details
              <ArrowRight className="h-4 w-4 ml-1" />
            </motion.button>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const formattedValue = formatCurrency(Number(value))
                    let label = name
                    if (name === 'revenue') {
                      label = 'Revenue'
                    } else if (name === 'expenses') {
                      label = 'Expenses' 
                    } else if (name === 'profit') {
                      label = 'Profit'
                    }
                    return [`${label}: ${formattedValue}`]
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 500 }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#000000"
                  fill="#000000"
                  fillOpacity={0.7}
                  name="Revenue"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#666666"
                  fill="#666666"
                  fillOpacity={0.7}
                  name="Expenses"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#333333"
                  strokeWidth={3}
                  dot={{ fill: '#333333', strokeWidth: 2, r: 4 }}
                  name="Profit"
                  activeDot={{ r: 6, strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Expenses by Category */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Expenses by Category</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/expenses')}
              className="text-black hover:text-gray-600 text-sm font-medium flex items-center transition-colors"
            >
              View details
              <ArrowRight className="h-4 w-4 ml-1" />
            </motion.button>
          </div>
          {stats.expensesByCategory.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center">
              <div className="w-full lg:w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={stats.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {stats.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 space-y-3">
                {stats.expensesByCategory.map((category, _) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium text-black text-sm">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-black text-sm">{formatCurrency(category.amount)}</div>
                      <div className="text-xs text-gray-500">
                        {((category.amount / stats.totalExpenses) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>No expense data available</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/expenses')}
                  className="mt-2 text-black hover:text-gray-600 text-sm font-medium transition-colors"
                >
                  Add your first expense
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Enhanced Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bills */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Recent Bills</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/bills')}
              className="text-black hover:text-gray-600 text-sm font-medium flex items-center transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </motion.button>
          </div>
          {stats.recentBills.length > 0 ? (
            <div className="space-y-4">
              {stats.recentBills.map((bill, index) => (
                <motion.div 
                  key={bill.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-black p-2 rounded-2xl">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{bill.customer_name}</p>
                      <p className="text-sm text-gray-600">#{bill.bill_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">{formatCurrency(bill.total_amount)}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-black">
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No bills created yet</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/bills')}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first bill
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Recent Expenses */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Recent Expenses</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/expenses')}
              className="text-black hover:text-gray-600 text-sm font-medium flex items-center transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </motion.button>
          </div>
          {stats.recentExpenses.length > 0 ? (
            <div className="space-y-4">
              {stats.recentExpenses.map((expense, index) => (
                <motion.div 
                  key={expense.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-black p-2 rounded-2xl">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-black">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">{formatCurrency(expense.amount)}</p>
                    <p className="text-sm text-gray-600">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No expenses recorded yet</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/expenses')}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first expense
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Enhanced Business Insights */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 shadow-md hover:shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Business Insights</h3>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/reports')}
            className="text-black hover:text-gray-600 text-sm font-medium transition-colors"
          >
            View detailed analytics
          </motion.button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingUp,
              title: 'Revenue Growth',
              description: `Your revenue has increased by ${stats.revenueGrowth.toFixed(1)}% this month`,
              progress: 75
            },
            {
              icon: Target,
              title: 'Profit Margin',
              description: `Maintaining a healthy ${stats.profitMargin.toFixed(1)}% profit margin`,
              progress: Math.min(Math.abs(stats.profitMargin), 100)
            },
            {
              icon: Users,
              title: 'Team Performance',
              description: `All ${stats.totalEmployees} employees are active and productive`,
              progress: 100
            }
          ].map((insight, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              className="text-center"
            >
              <div className="bg-black p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <insight.icon className="h-10 w-10 text-white" />
              </div>
              <h4 className="font-semibold text-black mb-2">{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.progress}%` }}
                  transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                  className="bg-black h-2 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard