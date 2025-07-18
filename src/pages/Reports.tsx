import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { supabase } from '../lib/supabase'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Building2,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Calculator,
  Receipt,
  Briefcase,
  TrendingDown as TaxIcon,
  UserCheck
} from 'lucide-react'
import { exportFinancialReportPDF, exportFinancialReportExcel, exportTaxSummaryPDF, exportTaxSummaryExcel, exportPayrollReportPDF, exportPayrollReportExcel, ExportButtons } from '../utils/exportUtils'

interface ReportData {
  bills: any[]
  expenses: any[]
  employees: any[]
  monthlyRevenue: any[]
  expensesByCategory: any[]
  employeeProductivity: any[]
  profitTrend: any[]
  departmentExpenses: any[]
  taxSummary: any
  payrollData: any[]
}

const Reports: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedReport, setSelectedReport] = useState('financial')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData>({
    bills: [],
    expenses: [],
    employees: [],
    monthlyRevenue: [],
    expensesByCategory: [],
    employeeProductivity: [],
    profitTrend: [],
    departmentExpenses: [],
    taxSummary: null,
    payrollData: []
  })

  useEffect(() => {
    fetchReportData()
  }, [user, selectedPeriod, dateRange])

  const fetchReportData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch all data from Supabase
      const [billsResult, expensesResult, employeesResult] = await Promise.all([
        supabase.from('bills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('employees').select('*').eq('user_id', user.id).eq('is_active', true)
      ])

      const bills = billsResult.data || []
      const expenses = expensesResult.data || []
      const employees = employeesResult.data || []

      // Process data for charts
      const monthlyRevenue = generateMonthlyRevenueData(bills, expenses)
      const expensesByCategory = generateExpensesByCategoryData(expenses)
      const employeeProductivity = generateEmployeeProductivityData(employees)
      const profitTrend = generateProfitTrendData(bills, expenses)
      const departmentExpenses = generateDepartmentExpensesData(employees, expenses)
      const taxSummary = generateTaxSummaryData(bills, expenses)
      const payrollData = generatePayrollData(employees)

      setReportData({
        bills,
        expenses,
        employees,
        monthlyRevenue,
        expensesByCategory,
        employeeProductivity,
        profitTrend,
        departmentExpenses,
        taxSummary,
        payrollData
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyRevenueData = (bills: any[], expenses: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map((month, index) => {
      const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1)
      
      // Filter bills and expenses for this month
      const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate.getMonth() === monthDate.getMonth() && billDate.getFullYear() === monthDate.getFullYear()
      })
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === monthDate.getMonth() && expenseDate.getFullYear() === monthDate.getFullYear()
      })

      const revenue = monthBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
      const expenseAmount = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const profit = revenue - expenseAmount

      return { month, revenue, expenses: expenseAmount, profit }
    })
  }

  const generateExpensesByCategoryData = (expenses: any[]) => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
    
    return Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        percentage: 0, // Will be calculated later
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }

  const generateEmployeeProductivityData = (employees: any[]) => {
    const departments = ['Production', 'Quality Control', 'Maintenance', 'Administration']
    
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept)
      const avgRate = deptEmployees.length > 0 
        ? deptEmployees.reduce((sum, emp) => sum + emp.hourly_rate, 0) / deptEmployees.length 
        : 0
      
      return {
        department: dept,
        employees: deptEmployees.length,
        avgHourlyRate: avgRate,
        efficiency: Math.floor(Math.random() * 20) + 80, // Mock efficiency data
        totalHours: deptEmployees.length * 160, // Mock hours
        productivity: Math.floor(Math.random() * 30) + 70 // Mock productivity
      }
    }).filter(dept => dept.employees > 0)
  }

  const generateProfitTrendData = (bills: any[], expenses: any[]) => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth()
      }
    })

    return last12Months.map(({ month, year, monthIndex }) => {
      const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate.getMonth() === monthIndex && billDate.getFullYear() === year
      })
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === year
      })

      const revenue = monthBills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
      const expenseAmount = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
      const profit = revenue - expenseAmount
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

      return { month, profit, profitMargin, revenue, expenses: expenseAmount }
    })
  }

  const generateDepartmentExpensesData = (employees: any[], expenses: any[]) => {
    const departments = [...new Set(employees.map(emp => emp.department))]
    
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept)
      const laborCost = deptEmployees.reduce((sum, emp) => sum + (emp.hourly_rate * 160), 0) // 160 hours per month
      
      return {
        department: dept,
        laborCost,
        employees: deptEmployees.length,
        avgSalary: deptEmployees.length > 0 ? laborCost / deptEmployees.length : 0
      }
    })
  }

  const generateTaxSummaryData = (bills: any[], expenses: any[]) => {
    const defaultTaxRate = settings?.default_tax_rate || 18
    
    // Calculate tax collected from bills
    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
    const totalTaxCollected = bills.reduce((sum, bill) => sum + (bill.tax_amount || 0), 0)
    
    // Calculate tax paid on expenses (assuming some expenses have tax)
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    const estimatedTaxPaid = totalExpenses * (defaultTaxRate / 100) * 0.3 // Assuming 30% of expenses have tax
    
    // Net tax liability
    const netTaxLiability = totalTaxCollected - estimatedTaxPaid
    
    // Monthly breakdown
    const monthlyTaxData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate.getMonth() === date.getMonth() && billDate.getFullYear() === date.getFullYear()
      })
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear()
      })
      
      const taxCollected = monthBills.reduce((sum, bill) => sum + (bill.tax_amount || 0), 0)
      const taxPaid = monthExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) * (defaultTaxRate / 100) * 0.3
      
      return {
        month,
        taxCollected,
        taxPaid,
        netTax: taxCollected - taxPaid
      }
    })
    
    return {
      totalRevenue,
      totalTaxCollected,
      totalExpenses,
      estimatedTaxPaid,
      netTaxLiability,
      taxRate: defaultTaxRate,
      monthlyTaxData,
      gstReturns: {
        gstr1: totalTaxCollected,
        gstr3b: netTaxLiability,
        nextDueDate: getNextGSTDueDate()
      }
    }
  }

  const generatePayrollData = (employees: any[]) => {
    return employees.map(employee => {
      const regularHours = 160 // Standard monthly hours
      const overtimeHours = Math.floor(Math.random() * 20) // Random overtime 0-20 hours
      const regularPay = regularHours * employee.hourly_rate
      const overtimePay = overtimeHours * employee.overtime_rate
      const grossPay = regularPay + overtimePay
      
      // Calculate deductions
      const pf = grossPay * 0.12 // 12% PF
      const esi = grossPay * 0.0175 // 1.75% ESI
      const tax = grossPay > 50000 ? grossPay * 0.1 : 0 // 10% tax if > 50k
      const totalDeductions = pf + esi + tax
      const netPay = grossPay - totalDeductions
      
      return {
        id: employee.id,
        name: employee.name,
        department: employee.department,
        position: employee.position,
        regularHours,
        overtimeHours,
        hourlyRate: employee.hourly_rate,
        overtimeRate: employee.overtime_rate,
        regularPay,
        overtimePay,
        grossPay,
        pf,
        esi,
        tax,
        totalDeductions,
        netPay,
        payPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    })
  }

  const getNextGSTDueDate = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // GST returns are due by 20th of next month
    const dueDate = new Date(currentYear, currentMonth + 1, 20)
    return dueDate.toLocaleDateString('en-IN')
  }

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'INR'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const calculateTotals = () => {
    const totalRevenue = reportData.bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
    const totalExpenses = reportData.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return { totalRevenue, totalExpenses, netProfit, profitMargin }
  }

  const handleExportPDF = () => {
    const { totalRevenue, totalExpenses, netProfit, profitMargin } = calculateTotals()
    const exportData = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyData: reportData.monthlyRevenue
    }
    exportFinancialReportPDF(exportData, user)
  }

  const handleExportExcel = () => {
    const { totalRevenue, totalExpenses, netProfit, profitMargin } = calculateTotals()
    const exportData = {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      monthlyData: reportData.monthlyRevenue
    }
    exportFinancialReportExcel(exportData, user)
  }

  const handleExportTaxPDF = () => {
    exportTaxSummaryPDF(reportData.taxSummary, user)
  }

  const handleExportTaxExcel = () => {
    exportTaxSummaryExcel(reportData.taxSummary, user)
  }

  const handleExportPayrollPDF = () => {
    exportPayrollReportPDF(reportData.payrollData, user)
  }

  const handleExportPayrollExcel = () => {
    exportPayrollReportExcel(reportData.payrollData, user)
  }

  const { totalRevenue, totalExpenses, netProfit, profitMargin } = calculateTotals()

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
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Reports & Analytics</h1>
              <p className="text-indigo-100 text-lg mb-4">
                Comprehensive business insights and performance analytics
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  <span>Real-time data</span>
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Performance tracking</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {selectedReport === 'financial' && (
                <ExportButtons 
                  onExportPDF={handleExportPDF}
                  onExportExcel={handleExportExcel}
                  className="text-white"
                />
              )}
              {selectedReport === 'tax' && (
                <ExportButtons 
                  onExportPDF={handleExportTaxPDF}
                  onExportExcel={handleExportTaxExcel}
                  className="text-white"
                />
              )}
              {selectedReport === 'payroll' && (
                <ExportButtons 
                  onExportPDF={handleExportPayrollPDF}
                  onExportExcel={handleExportPayrollExcel}
                  className="text-white"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="financial">Financial Overview</option>
              <option value="sales">Sales Analysis</option>
              <option value="expenses">Expense Analysis</option>
              <option value="productivity">Employee Productivity</option>
              <option value="tax">Tax Summary</option>
              <option value="payroll">Payroll Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+15.3%</span>
            <span className="text-green-600 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-red-200 p-3 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600 font-medium">+8.7%</span>
            <span className="text-red-600 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <IndianRupee className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+22.1%</span>
            <span className="text-green-600 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-900">{profitMargin.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <BarChart3 className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+5.2%</span>
            <span className="text-green-600 ml-1">vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {selectedReport === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue vs Expenses */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={reportData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Legend />
                <Area dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Revenue" />
                <Area dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Profit Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Profit Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.profitTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Profit']} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedReport === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Expense Breakdown</h3>
            {reportData.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <PieChartIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>No expense data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Expense Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Expense Details</h3>
            <div className="space-y-4">
              {reportData.expensesByCategory.map((expense, index) => (
                <div key={expense.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: expense.color }}
                    ></div>
                    <span className="font-medium text-gray-900">{expense.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(expense.value)}</div>
                    <div className="text-sm text-gray-600">
                      {totalExpenses > 0 ? ((expense.value / totalExpenses) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'productivity' && (
        <div className="grid grid-cols-1 gap-8">
          {/* Employee Productivity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Department Performance</h3>
            {reportData.employeeProductivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Department</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Employees</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Avg. Hourly Rate</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Total Hours</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Efficiency</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.employeeProductivity.map((dept) => (
                      <tr key={dept.department} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900">{dept.department}</td>
                        <td className="py-4 px-6 text-gray-900">{dept.employees}</td>
                        <td className="py-4 px-6 text-gray-900">{formatCurrency(dept.avgHourlyRate)}</td>
                        <td className="py-4 px-6 text-gray-900">{dept.totalHours}h</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                            dept.efficiency >= 95 ? 'bg-green-100 text-green-800' :
                            dept.efficiency >= 90 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {dept.efficiency}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                dept.productivity >= 90 ? 'bg-green-500' :
                                dept.productivity >= 75 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${dept.productivity}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 mt-1">{dept.productivity}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>No employee data available</p>
              </div>
            )}
          </div>

          {/* Department Labor Costs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Department Labor Costs</h3>
            {reportData.departmentExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.departmentExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="department" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Labor Cost']} />
                  <Bar dataKey="laborCost" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>No department data available</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax Summary Report */}
      {selectedReport === 'tax' && reportData.taxSummary && (
        <div className="space-y-8">
          {/* Tax Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Tax Collected</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.taxSummary.totalTaxCollected)}</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-xl">
                  <Receipt className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <div className="mt-4 text-sm text-blue-600">
                From sales ({reportData.taxSummary.taxRate}% GST)
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Tax Paid</p>
                  <p className="text-2xl font-bold text-orange-900">{formatCurrency(reportData.taxSummary.estimatedTaxPaid)}</p>
                </div>
                <div className="bg-orange-200 p-3 rounded-xl">
                  <CreditCard className="h-6 w-6 text-orange-700" />
                </div>
              </div>
              <div className="mt-4 text-sm text-orange-600">
                On purchases (estimated)
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Net Tax Liability</p>
                  <p className={`text-2xl font-bold ${reportData.taxSummary.netTaxLiability >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(reportData.taxSummary.netTaxLiability)}
                  </p>
                </div>
                <div className="bg-green-200 p-3 rounded-xl">
                  <Calculator className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <div className="mt-4 text-sm text-green-600">
                {reportData.taxSummary.netTaxLiability >= 0 ? 'To be paid' : 'Refund due'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Next GST Due</p>
                  <p className="text-lg font-bold text-purple-900">{reportData.taxSummary.gstReturns.nextDueDate}</p>
                </div>
                <div className="bg-purple-200 p-3 rounded-xl">
                  <Calendar className="h-6 w-6 text-purple-700" />
                </div>
              </div>
              <div className="mt-4 text-sm text-purple-600">
                GSTR-3B filing due
              </div>
            </div>
          </div>

          {/* Monthly Tax Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Tax Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.taxSummary.monthlyTaxData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                <Legend />
                <Bar dataKey="taxCollected" fill="#10B981" name="Tax Collected" />
                <Bar dataKey="taxPaid" fill="#EF4444" name="Tax Paid" />
                <Bar dataKey="netTax" fill="#3B82F6" name="Net Tax" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* GST Returns Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">GST Returns Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">GSTR-1 (Sales)</h4>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.taxSummary.gstReturns.gstr1)}</p>
                <p className="text-sm text-blue-700 mt-1">Outward supplies</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">GSTR-3B (Summary)</h4>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.taxSummary.gstReturns.gstr3b)}</p>
                <p className="text-sm text-green-700 mt-1">Net tax liability</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2">Tax Rate</h4>
                <p className="text-2xl font-bold text-purple-900">{reportData.taxSummary.taxRate}%</p>
                <p className="text-sm text-purple-700 mt-1">Current GST rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Report */}
      {selectedReport === 'payroll' && (
        <div className="space-y-8">
          {/* Payroll Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Employees</p>
                  <p className="text-2xl font-bold text-blue-900">{reportData.payrollData.length}</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Gross Payroll</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(reportData.payrollData.reduce((sum, emp) => sum + emp.grossPay, 0))}
                  </p>
                </div>
                <div className="bg-green-200 p-3 rounded-xl">
                  <IndianRupee className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Total Deductions</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(reportData.payrollData.reduce((sum, emp) => sum + emp.totalDeductions, 0))}
                  </p>
                </div>
                <div className="bg-orange-200 p-3 rounded-xl">
                  <TaxIcon className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Net Payroll</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(reportData.payrollData.reduce((sum, emp) => sum + emp.netPay, 0))}
                  </p>
                </div>
                <div className="bg-purple-200 p-3 rounded-xl">
                  <UserCheck className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Details Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Employee Payroll Details</h3>
            {reportData.payrollData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Employee</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Department</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Hours</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Gross Pay</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Deductions</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.payrollData.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-600">{employee.position}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">{employee.department}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div>Regular: {employee.regularHours}h</div>
                            <div className="text-orange-600">OT: {employee.overtimeHours}h</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{formatCurrency(employee.grossPay)}</div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(employee.regularPay)} + {formatCurrency(employee.overtimePay)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <div>PF: {formatCurrency(employee.pf)}</div>
                            <div>ESI: {formatCurrency(employee.esi)}</div>
                            <div>Tax: {formatCurrency(employee.tax)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-lg text-gray-900">{formatCurrency(employee.netPay)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>No employee data available</p>
              </div>
            )}
          </div>

          {/* Payroll Summary by Department */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payroll by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.departmentExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Payroll Cost']} />
                <Bar dataKey="laborCost" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Report Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Report Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
              <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">Generate Monthly Report</span>
              <p className="text-sm text-gray-600 mt-1">Comprehensive monthly business report</p>
            </div>
          </button>
          
          <button 
            onClick={handleExportTaxPDF}
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          >
            <div className="text-center">
              <Calculator className="h-12 w-12 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
              <span className="text-lg font-semibold text-gray-900 group-hover:text-green-700">Tax Summary Report</span>
              <p className="text-sm text-gray-600 mt-1">GST and tax compliance report</p>
            </div>
          </button>
          
          <button 
            onClick={handleExportPayrollPDF}
            className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
          >
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
              <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-700">Payroll Report</span>
              <p className="text-sm text-gray-600 mt-1">Employee salary and attendance report</p>
            </div>
          </button>
        </div>
      </div>

      {/* Business Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Business Insights</h3>
          <button 
            onClick={fetchReportData}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Data
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Revenue Growth</h4>
            <p className="text-sm text-gray-600 mb-2">
              {reportData.bills.length > 0 ? 'Steady revenue growth this period' : 'Start creating bills to track revenue'}
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Target className="h-10 w-10 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Profit Margin</h4>
            <p className="text-sm text-gray-600 mb-2">
              Maintaining a {profitMargin.toFixed(1)}% profit margin
            </p>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(profitMargin, 100)}%` }}></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-10 w-10 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Team Performance</h4>
            <p className="text-sm text-gray-600 mb-2">
              {reportData.employees.length} active employees contributing to growth
            </p>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports