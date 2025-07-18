import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { supabase } from '../lib/supabase'
import {
  Plus,
  Search,
  Filter,
  Users,
  Mail,
  Phone,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  IndianRupee,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  Download,
  Upload,
  Star,
  Copy,
  MoreHorizontal,
  Building,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { exportEmployeesPDF, exportEmployeesExcel, ExportButtons } from '../utils/exportUtils'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  hourly_rate: number
  overtime_rate: number
  position: string
  department: string
  hire_date: string
  is_active: boolean
  created_at: string
}

interface EmployeeFormData {
  name: string
  email: string
  phone: string
  hourly_rate: number
  overtime_rate: number
  position: string
  department: string
  hire_date: string
}

const Employees: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<EmployeeFormData>()

  const departments = [
    { name: 'Production', icon: '🏭', color: 'bg-blue-100 text-blue-800' },
    { name: 'Quality Control', icon: '✅', color: 'bg-green-100 text-green-800' },
    { name: 'Maintenance', icon: '🔧', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Sales', icon: '💼', color: 'bg-purple-100 text-purple-800' },
    { name: 'Administration', icon: '📋', color: 'bg-gray-100 text-gray-800' },
    { name: 'Finance', icon: '💰', color: 'bg-indigo-100 text-indigo-800' },
    { name: 'HR', icon: '👥', color: 'bg-pink-100 text-pink-800' },
    { name: 'Other', icon: '📦', color: 'bg-orange-100 text-orange-800' }
  ]

  // Memoize the fetchEmployees function to prevent infinite re-renders
  const fetchEmployees = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const onSubmit = async (data: EmployeeFormData) => {
    if (!user) return

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(data)
          .eq('id', editingEmployee.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([{
            user_id: user.id,
            ...data,
            is_active: true
          }])

        if (error) throw error
      }

      await fetchEmployees()
      setShowCreateForm(false)
      setEditingEmployee(null)
      reset()
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  const toggleEmployeeStatus = async (employee: Employee) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id)

      if (error) throw error
      await fetchEmployees()
    } catch (error) {
      console.error('Error updating employee status:', error)
    }
  }

  const deleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setValue('name', employee.name)
    setValue('email', employee.email)
    setValue('phone', employee.phone)
    setValue('hourly_rate', employee.hourly_rate)
    setValue('overtime_rate', employee.overtime_rate)
    setValue('position', employee.position)
    setValue('department', employee.department)
    setValue('hire_date', employee.hire_date)
    setShowCreateForm(true)
  }

  const viewEmployee = (employee: Employee) => {
    setViewingEmployee(employee)
    setShowViewModal(true)
  }

  const duplicateEmployee = (employee: Employee) => {
    setEditingEmployee(null)
    setValue('name', `${employee.name} (Copy)`)
    setValue('email', '')
    setValue('phone', employee.phone)
    setValue('hourly_rate', employee.hourly_rate)
    setValue('overtime_rate', employee.overtime_rate)
    setValue('position', employee.position)
    setValue('department', employee.department)
    setValue('hire_date', new Date().toISOString().split('T')[0])
    setShowCreateForm(true)
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAllEmployees = ()=> {
    setSelectedEmployees(filteredEmployees.map(employee => employee.id))
  }

  const clearSelection = () => {
    setSelectedEmployees([])
  }

  const bulkDeleteEmployees = async () => {
    if (selectedEmployees.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedEmployees.length} employee(s)?`)) return

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .in('id', selectedEmployees)

      if (error) throw error
      await fetchEmployees()
      clearSelection()
    } catch (error) {
      console.error('Error deleting employees:', error)
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && employee.is_active) || 
                         (filterStatus === 'inactive' && !employee.is_active)
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const activeEmployees = employees.filter(emp => emp.is_active).length
  const averageHourlyRate = employees.length > 0 
    ? employees.reduce((sum, emp) => sum + emp.hourly_rate, 0) / employees.length 
    : 0

  const departmentCounts = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'INR'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getDepartmentInfo = (departmentName: string) => {
    return departments.find(dept => dept.name === departmentName) || departments[departments.length - 1]
  }

  const calculateTenure = (hireDate: string) => {
    const hire = new Date(hireDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - hire.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) return `${diffDays} days`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
    return `${Math.floor(diffDays / 365)} years`
  }

  const handleExportPDF = () => {
    exportEmployeesPDF(filteredEmployees, user)
  }

  const handleExportExcel = () => {
    exportEmployeesExcel(filteredEmployees, user)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage your workforce and employee information</p>
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
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Employees</p>
              <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Users className="h-6 w-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-600">
            All employees
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Active Employees</p>
              <p className="text-2xl font-bold text-green-900">{activeEmployees}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <UserCheck className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">
            Currently working
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Avg. Hourly Rate</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(averageHourlyRate)}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <IndianRupee className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">
            Per hour
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Departments</p>
              <p className="text-2xl font-bold text-orange-900">{Object.keys(departmentCounts).length}</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl">
              <Building className="h-6 w-6 text-orange-700" />
            </div>
          </div>
          <div className="mt-4 text-sm text-orange-600">
            Active departments
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.name} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Upload className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Actions</label>
            <div className="flex space-x-2">
              <button
                onClick={selectedEmployees.length === filteredEmployees.length ? clearSelection : selectAllEmployees}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                {selectedEmployees.length === filteredEmployees.length ? 'Clear' : 'Select All'}
              </button>
              {selectedEmployees.length > 0 && (
                <button
                  onClick={bulkDeleteEmployees}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete ({selectedEmployees.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employees Display */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.length === filteredEmployees.length}
                        onChange={() => selectedEmployees.length === filteredEmployees.length ? clearSelection() : selectAllEmployees()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Employee</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Position</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Department</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Rates</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => {
                    const departmentInfo = getDepartmentInfo(employee.department)
                    return (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => toggleEmployeeSelection(employee.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-semibold text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {employee.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {employee.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{employee.position}</div>
                          <div className="text-sm text-gray-600 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {calculateTenure(employee.hire_date)} tenure
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${departmentInfo.color}`}>
                            <span className="mr-1">{departmentInfo.icon}</span>
                            {employee.department}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">{formatCurrency(employee.hourly_rate)}/hr</div>
                            <div className="text-sm text-gray-600">OT: {formatCurrency(employee.overtime_rate)}/hr</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleEmployeeStatus(employee)}
                            className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border transition-colors ${
                              employee.is_active 
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                            }`}
                          >
                            {employee.is_active ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => viewEmployee(employee)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Employee"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => startEdit(employee)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => duplicateEmployee(employee)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Duplicate Employee"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteEmployee(employee.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Employee"
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
              <Users className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterDepartment !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first employee'
                }
              </p>
              {!searchTerm && filterDepartment === 'all' && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Employee
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => {
            const departmentInfo = getDepartmentInfo(employee.department)
            return (
              <div key={employee.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <button onClick={() => viewEmployee(employee)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => startEdit(employee)} className="p-1 text-gray-400 hover:text-green-600 rounded">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteEmployee(employee.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${departmentInfo.color}`}>
                    <span className="mr-1">{departmentInfo.icon}</span>
                    {employee.department}
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Hourly Rate</p>
                      <p className="font-semibold">{formatCurrency(employee.hourly_rate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Overtime Rate</p>
                      <p className="font-semibold">{formatCurrency(employee.overtime_rate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {calculateTenure(employee.hire_date)} tenure
                    </div>
                    <button
                      onClick={() => toggleEmployeeStatus(employee)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Employee Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingEmployee ? 'Update employee information' : 'Add a new team member'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter employee name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <input
                    {...register('position', { required: 'Position is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter job position"
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    {...register('department', { required: 'Department is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept.name} value={dept.name}>
                        {dept.icon} {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date *
                  </label>
                  <input
                    {...register('hire_date', { required: 'Hire date is required' })}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.hire_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.hire_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (₹) *
                  </label>
                  <input
                    {...register('hourly_rate', { 
                      required: 'Hourly rate is required',
                      min: { value: 1, message: 'Rate must be greater than 0' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  {errors.hourly_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.hourly_rate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overtime Rate (₹) *
                  </label>
                  <input
                    {...register('overtime_rate', { 
                      required: 'Overtime rate is required',
                      min: { value: 1, message: 'Rate must be greater than 0' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  {errors.overtime_rate && (
                    <p className="mt-1 text-sm text-red-600">{errors.overtime_rate.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingEmployee(null)
                    reset()
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && viewingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {viewingEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{viewingEmployee.name}</h2>
                    <p className="text-gray-600">{viewingEmployee.position}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{viewingEmployee.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{viewingEmployee.phone}</span>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getDepartmentInfo(viewingEmployee.department).color}`}>
                        {getDepartmentInfo(viewingEmployee.department).icon} {viewingEmployee.department}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Hire Date:</span>
                    <p className="mt-1">{new Date(viewingEmployee.hire_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tenure:</span>
                    <p className="mt-1">{calculateTenure(viewingEmployee.hire_date)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        viewingEmployee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingEmployee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Regular Hourly Rate</span>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(viewingEmployee.hourly_rate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Overtime Rate</span>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(viewingEmployee.overtime_rate)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    startEdit(viewingEmployee)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Employee
                </button>
                
                <button
                  onClick={() => toggleEmployeeStatus(viewingEmployee)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                    viewingEmployee.is_active
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {viewingEmployee.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowViewModal(false)
                    duplicateEmployee(viewingEmployee)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-2" />
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

export default Employees