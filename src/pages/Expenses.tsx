import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { supabase } from '../lib/supabase'
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Receipt,
  Edit2,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Upload,
  Eye,
  Download,
  BarChart3,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Archive,
  Star,
  Copy
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { exportExpensesPDF, exportExpensesExcel, ExportButtons } from '../utils/exportUtils'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  receipt_url?: string
  created_at: string
}

interface ExpenseFormData {
  description: string
  amount: number
  category: string
  date: string
}

const Expenses: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'analytics'>('list')
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ExpenseFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  })

  const categories = [
    { name: 'Raw Materials', icon: '🏭', color: 'bg-blue-100 text-blue-800', chartColor: '#3B82F6' },
    { name: 'Equipment', icon: '⚙️', color: 'bg-purple-100 text-purple-800', chartColor: '#8B5CF6' },
    { name: 'Labor', icon: '👷', color: 'bg-green-100 text-green-800', chartColor: '#10B981' },
    { name: 'Utilities', icon: '⚡', color: 'bg-yellow-100 text-yellow-800', chartColor: '#F59E0B' },
    { name: 'Transport', icon: '🚛', color: 'bg-indigo-100 text-indigo-800', chartColor: '#6366F1' },
    { name: 'Maintenance', icon: '🔧', color: 'bg-red-100 text-red-800', chartColor: '#EF4444' },
    { name: 'Marketing', icon: '📢', color: 'bg-pink-100 text-pink-800', chartColor: '#EC4899' },
    { name: 'Office Supplies', icon: '📋', color: 'bg-gray-100 text-gray-800', chartColor: '#6B7280' },
    { name: 'Professional Services', icon: '💼', color: 'bg-teal-100 text-teal-800', chartColor: '#14B8A6' },
    { name: 'Insurance', icon: '🛡️', color: 'bg-orange-100 text-orange-800', chartColor: '#F97316' },
    { name: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-800', chartColor: '#9CA3AF' }
  ]

  // Define getCategoryInfo function early to avoid initialization errors
  const getCategoryInfo = (categoryName: string) => {
    return categories.find(cat => cat.name === categoryName) || categories[categories.length - 1]
  }

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'INR'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Memoize the fetchExpenses function to prevent infinite re-renders
  const fetchExpenses = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(data)
          .eq('id', editingExpense.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([{
            user_id: user.id,
            ...data
          }])

        if (error) throw error
      }

      await fetchExpenses()
      setShowCreateForm(false)
      setEditingExpense(null)
      reset()
    } catch (error) {
      console.error('Error saving expense:', error)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setValue('description', expense.description)
    setValue('amount', expense.amount)
    setValue('category', expense.category)
    setValue('date', expense.date)
    setShowCreateForm(true)
  }

  const viewExpense = (expense: Expense) => {
    setViewingExpense(expense)
    setShowViewModal(true)
  }

  const duplicateExpense = (expense: Expense) => {
    setEditingExpense(null)
    setValue('description', expense.description)
    setValue('amount', expense.amount)
    setValue('category', expense.category)
    setValue('date', new Date().toISOString().split('T')[0])
    setShowCreateForm(true)
  }

  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    )
  }

  const selectAllExpenses = () => {
    setSelectedExpenses(filteredExpenses.map(expense => expense.id))
  }

  const clearSelection = () => {
    setSelectedExpenses([])
  }

  const bulkDeleteExpenses = async () => {
    if (selectedExpenses.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedExpenses.length} expense(s)?`)) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', selectedExpenses)

      if (error) throw error
      await fetchExpenses()
      clearSelection()
    } catch (error) {
      console.error('Error deleting expenses:', error)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory
    const expenseMonth = expense.date.slice(0, 7)
    const matchesMonth = !selectedMonth || expenseMonth === selectedMonth
    return matchesSearch && matchesCategory && matchesMonth
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])

  // Calculate month-over-month change
  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)
  
  const currentMonthExpenses = expenses.filter(e => e.date.slice(0, 7) === currentMonth).reduce((sum, e) => sum + e.amount, 0)
  const lastMonthExpenses = expenses.filter(e => e.date.slice(0, 7) === lastMonth).reduce((sum, e) => sum + e.amount, 0)
  
  const monthlyChange = lastMonthExpenses > 0 ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0

  // Generate chart data
  const categoryChartData = Object.entries(categoryTotals).map(([category, amount]) => {
    const categoryInfo = getCategoryInfo(category)
    return {
      name: category,
      value: amount,
      color: categoryInfo.chartColor
    }
  }).sort((a, b) => b.value - a.value).slice(0, 6)

  const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthKey = date.toISOString().slice(0, 7)
    const monthExpenses = expenses.filter(e => e.date.slice(0, 7) === monthKey)
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
    
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      amount: total,
      count: monthExpenses.length
    }
  })

  const handleExportPDF = () => {
    exportExpensesPDF(filteredExpenses, user)
  }

  const handleExportExcel = () => {
    exportExpensesExcel(filteredExpenses, user)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Track and analyze your business expenses</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <ExportButtons 
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
          />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-red-200 p-3 rounded-xl">
              <CreditCard className="h-6 w-6 text-red-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {monthlyChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            )}
            <span className={`font-medium ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {Math.abs(monthlyChange).toFixed(1)}%
            </span>
            <span className="text-red-600 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Number of Expenses</p>
              <p className="text-2xl font-bold text-blue-900">{filteredExpenses.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Receipt className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-600">
            This period
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Top Category</p>
              <p className="text-lg font-bold text-green-900 truncate">
                {topCategory[0] || 'N/A'}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <BarChart3 className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            {formatCurrency(topCategory[1])}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Average Expense</p>
              <p className="text-2xl font-bold text-purple-900">
                {filteredExpenses.length > 0 ? formatCurrency(totalExpenses / filteredExpenses.length) : formatCurrency(0)}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">
            Per expense
          </div>
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Expense Distribution</h3>
            {categoryChartData.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center">
                <div className="w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-3">
                  {categoryChartData.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-900 text-sm">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">{formatCurrency(category.value)}</div>
                        <div className="text-xs text-gray-500">
                          {((category.value / totalExpenses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>No expense data available</p>
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                  labelStyle={{ color: '#374151' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => alert('Report functionality')}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <FileText className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Actions</label>
            <div className="flex space-x-2">
              <button
                onClick={selectedExpenses.length === filteredExpenses.length ? clearSelection : selectAllExpenses}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                {selectedExpenses.length === filteredExpenses.length ? 'Clear' : 'Select All'}
              </button>
              {selectedExpenses.length > 0 && (
                <button
                  onClick={bulkDeleteExpenses}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete ({selectedExpenses.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Display */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === filteredExpenses.length}
                        onChange={() => selectedExpenses.length === filteredExpenses.length ? clearSelection() : selectAllExpenses()}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Description</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Category</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => {
                    const categoryInfo = getCategoryInfo(expense.category)
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(expense.id)}
                            onChange={() => toggleExpenseSelection(expense.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{expense.description}</div>
                          <div className="text-sm text-gray-600">
                            Added {new Date(expense.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${categoryInfo.color}`}>
                            <span className="mr-1">{categoryInfo.icon}</span>
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-lg text-gray-900">{formatCurrency(expense.amount)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center text-gray-900">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => viewExpense(expense)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Expense"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => startEdit(expense)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Expense"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => duplicateExpense(expense)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Duplicate Expense"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteExpense(expense.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <CreditCard className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterCategory !== 'all' || selectedMonth
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first expense'
                }
              </p>
              {!searchTerm && filterCategory === 'all' && !selectedMonth && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Expense
                </button>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((expense) => {
            const categoryInfo = getCategoryInfo(expense.category)
            return (
              <div key={expense.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={() => toggleExpenseSelection(expense.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${categoryInfo.color}`}>
                      <span className="mr-1">{categoryInfo.icon}</span>
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => viewExpense(expense)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => startEdit(expense)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{expense.description}</h3>
                <div className="text-2xl font-bold text-gray-900 mb-3">{formatCurrency(expense.amount)}</div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(expense.date).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* Create/Edit Expense Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingExpense ? 'Update expense information' : 'Track your business expense'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  {...register('description', { required: 'Description is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter expense description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload receipt</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingExpense(null)
                    reset()
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Expense Modal */}
      {showViewModal && viewingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">{viewingExpense.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getCategoryInfo(viewingExpense.category).color}`}>
                    <span className="mr-1">{getCategoryInfo(viewingExpense.category).icon}</span>
                    {viewingExpense.category}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(viewingExpense.amount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-gray-900">{new Date(viewingExpense.date).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-gray-900">{new Date(viewingExpense.created_at).toLocaleDateString()}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    startEdit(viewingExpense)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Expense
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    duplicateExpense(viewingExpense)
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expenses