import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useNotifications } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  UserCheck,
  UserX,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Target,
  Activity
} from 'lucide-react'
import { useForm } from 'react-hook-form'

interface Employee {
  id: string
  name: string
  position: string
  department: string
  hourly_rate: number
  overtime_rate: number
}

interface AttendanceRecord {
  id: string
  employee_id: string
  employee?: Employee
  date: string
  check_in: string
  check_out?: string
  regular_hours: number
  overtime_hours: number
  total_pay: number
  status: 'present' | 'absent' | 'late' | 'half_day'
  created_at: string
}

interface AttendanceFormData {
  employee_id: string
  date: string
  check_in: string
  check_out?: string
  status: 'present' | 'absent' | 'late' | 'half_day'
}

const Attendance: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { showCreateSuccess, showUpdateSuccess, showDeleteSuccess, showError, showInfo } = useNotifications()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showMarkForm, setShowMarkForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AttendanceFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      check_in: '09:00',
      status: 'present'
    }
  })

  const watchedStatus = watch('status')
  const watchedCheckIn = watch('check_in')
  const watchedCheckOut = watch('check_out')

  const fetchEmployees = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }, [user])

  const fetchAttendanceRecords = useCallback(async () => {
    if (!user) return

    try {
      // Create attendance table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_attendance_table_if_not_exists')
      
      // For now, we'll use sample data since the attendance table might not exist
      const sampleRecords: AttendanceRecord[] = employees.map((employee, index) => ({
        id: `attendance-${employee.id}-${selectedDate}`,
        employee_id: employee.id,
        employee: employee,
        date: selectedDate,
        check_in: '09:00',
        check_out: index % 3 === 0 ? undefined : '18:00',
        regular_hours: index % 3 === 0 ? 0 : 8,
        overtime_hours: index % 4 === 0 ? 2 : 0,
        total_pay: index % 3 === 0 ? 0 : (8 * employee.hourly_rate) + (index % 4 === 0 ? 2 * employee.overtime_rate : 0),
        status: index % 3 === 0 ? 'absent' : index % 5 === 0 ? 'late' : 'present',
        created_at: new Date().toISOString()
      }))

      setAttendanceRecords(sampleRecords)
    } catch (error) {
      console.error('Error fetching attendance records:', error)
    } finally {
      setLoading(false)
    }
  }, [user, employees, selectedDate])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    if (employees.length > 0) {
      fetchAttendanceRecords()
    }
  }, [fetchAttendanceRecords, employees])

  const calculateHoursAndPay = (checkIn: string, checkOut: string, employee: Employee) => {
    if (!checkIn || !checkOut) return { regularHours: 0, overtimeHours: 0, totalPay: 0 }

    const checkInTime = new Date(`2000-01-01T${checkIn}:00`)
    const checkOutTime = new Date(`2000-01-01T${checkOut}:00`)
    
    let totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60 // Handle overnight shifts
    }

    const totalHours = totalMinutes / 60
    const regularHours = Math.min(totalHours, 8)
    const overtimeHours = Math.max(totalHours - 8, 0)
    const totalPay = (regularHours * employee.hourly_rate) + (overtimeHours * employee.overtime_rate)

    return { regularHours, overtimeHours, totalPay }
  }

  const onSubmit = async (data: AttendanceFormData) => {
    if (!user) return

    try {
      const employee = employees.find(emp => emp.id === data.employee_id)
      if (!employee) return

      let regularHours = 0
      let overtimeHours = 0
      let totalPay = 0

      if (data.status === 'present' && data.check_in && data.check_out) {
        const calculation = calculateHoursAndPay(data.check_in, data.check_out, employee)
        regularHours = calculation.regularHours
        overtimeHours = calculation.overtimeHours
        totalPay = calculation.totalPay
      }

      const attendanceData = {
        employee_id: data.employee_id,
        date: data.date,
        check_in: data.check_in,
        check_out: data.check_out || null,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        total_pay: totalPay,
        status: data.status
      }

      // For demo purposes, we'll update the local state
      const newRecord: AttendanceRecord = {
        id: editingRecord?.id || `attendance-${data.employee_id}-${data.date}`,
        employee_id: data.employee_id,
        employee: employee,
        date: data.date,
        check_in: data.check_in,
        check_out: data.check_out,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        total_pay: totalPay,
        status: data.status,
        created_at: new Date().toISOString()
      }

      if (editingRecord) {
        setAttendanceRecords(prev => prev.map(record => 
          record.id === editingRecord.id ? newRecord : record
        ))
        showUpdateSuccess('Attendance', `${employee.name} - ${data.date}`, { category: 'attendance' })
      } else {
        setAttendanceRecords(prev => [...prev.filter(r => r.employee_id !== data.employee_id || r.date !== data.date), newRecord])
        showCreateSuccess('Attendance', `${employee.name} - ${data.date}`, { category: 'attendance' })
      }

      setShowMarkForm(false)
      setEditingRecord(null)
      reset()
    } catch (error) {
      console.error('Error saving attendance:', error)
      showError('Save Failed', 'Failed to save attendance record. Please try again.')
    }
  }

  const markAbsent = (employee: Employee) => {
    try {
      const absentRecord: AttendanceRecord = {
        id: `attendance-${employee.id}-${selectedDate}`,
        employee_id: employee.id,
        employee: employee,
        date: selectedDate,
        check_in: '',
        check_out: undefined,
        regular_hours: 0,
        overtime_hours: 0,
        total_pay: 0,
        status: 'absent',
        created_at: new Date().toISOString()
      }

      setAttendanceRecords(prev => [...prev.filter(r => r.employee_id !== employee.id || r.date !== selectedDate), absentRecord])
      showInfo('Marked Absent', `${employee.name} has been marked absent for ${selectedDate}`, { category: 'attendance' })
    } catch (error) {
      showError('Mark Absent Failed', 'Failed to mark employee as absent. Please try again.')
    }
  }

  const startEdit = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setValue('employee_id', record.employee_id)
    setValue('date', record.date)
    setValue('check_in', record.check_in)
    setValue('check_out', record.check_out || '')
    setValue('status', record.status)
    setShowMarkForm(true)
  }

  const deleteRecord = (id: string) => {
    const record = attendanceRecords.find(r => r.id === id)
    if (confirm(`Are you sure you want to delete attendance record for ${record?.employee?.name}?`)) {
      setAttendanceRecords(prev => prev.filter(record => record.id !== id))
      showDeleteSuccess('Attendance Record', record?.employee?.name || 'Record', { category: 'attendance' })
    }
  }

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.employee?.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus
    const recordMonth = record.date.slice(0, 7)
    const matchesMonth = !selectedMonth || recordMonth === selectedMonth
    return matchesSearch && matchesStatus && matchesMonth
  })

  const employeesWithoutAttendance = employees.filter(employee => 
    !attendanceRecords.some(record => 
      record.employee_id === employee.id && record.date === selectedDate
    )
  )

  const todayStats = {
    present: attendanceRecords.filter(r => r.date === selectedDate && r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.date === selectedDate && r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.date === selectedDate && r.status === 'late').length,
    totalHours: attendanceRecords.filter(r => r.date === selectedDate).reduce((sum, r) => sum + r.regular_hours + r.overtime_hours, 0),
    totalPay: attendanceRecords.filter(r => r.date === selectedDate).reduce((sum, r) => sum + r.total_pay, 0)
  }

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'INR'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Attendance Management</h1>
          <p className="text-gray-600 mt-1">Track employee attendance and working hours</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowMarkForm(true)}
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Present Today</p>
              <p className="text-2xl font-bold text-black">{todayStats.present}</p>
            </div>
            <div className="bg-black p-3 rounded-2xl">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Absent Today</p>
              <p className="text-2xl font-bold text-black">{todayStats.absent}</p>
            </div>
            <div className="bg-black p-3 rounded-2xl">
              <UserX className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Late Today</p>
              <p className="text-2xl font-bold text-black">{todayStats.late}</p>
            </div>
            <div className="bg-black p-3 rounded-2xl">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Hours</p>
              <p className="text-2xl font-bold text-black">{todayStats.totalHours.toFixed(1)}</p>
            </div>
            <div className="bg-black p-3 rounded-2xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Pay</p>
              <p className="text-2xl font-bold text-black">{formatCurrency(todayStats.totalPay)}</p>
            </div>
            <div className="bg-black p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Employees Without Attendance */}
      {employeesWithoutAttendance.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-black mb-4">Employees Without Attendance ({selectedDate})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesWithoutAttendance.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-medium text-black">{employee.name}</p>
                  <p className="text-sm text-gray-600">{employee.department}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setValue('employee_id', employee.id)
                      setValue('date', selectedDate)
                      setValue('status', 'present')
                      setShowMarkForm(true)
                    }}
                    className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                    title="Mark Present"
                  >
                    <UserCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => markAbsent(employee)}
                    className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                    title="Mark Absent"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-black">Employee</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Check In</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Check Out</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Hours</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Pay</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-black">{record.employee?.name}</div>
                        <div className="text-sm text-gray-600">{record.employee?.department}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-black">{new Date(record.date).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-black">{record.check_in || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-black">{record.check_out || '-'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-black">
                        {record.regular_hours.toFixed(1)}h
                        {record.overtime_hours > 0 && (
                          <span className="text-gray-600"> (+{record.overtime_hours.toFixed(1)}h OT)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-black">{formatCurrency(record.total_pay)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                        record.status === 'present' ? 'bg-gray-100 text-black' :
                        record.status === 'absent' ? 'bg-gray-100 text-black' :
                        record.status === 'late' ? 'bg-gray-100 text-black' :
                        'bg-gray-100 text-black'
                      }`}>
                        {record.status === 'present' && <CheckCircle className="h-4 w-4 mr-1" />}
                        {record.status === 'absent' && <XCircle className="h-4 w-4 mr-1" />}
                        {record.status === 'late' && <AlertCircle className="h-4 w-4 mr-1" />}
                        <span className="capitalize">{record.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => startEdit(record)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteRecord(record.id)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-20 w-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-black mb-2">No attendance records found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' || selectedMonth
                ? 'Try adjusting your search or filter criteria'
                : 'Start by marking attendance for your employees'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && !selectedMonth && (
              <button
                onClick={() => setShowMarkForm(true)}
                className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Mark First Attendance
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showMarkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-xl font-bold text-black">
                {editingRecord ? 'Edit Attendance' : 'Mark Attendance'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingRecord ? 'Update attendance record' : 'Record employee attendance'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Employee *</label>
                <select
                  {...register('employee_id', { required: 'Employee is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="">Select employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </option>
                  ))}
                </select>
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-black">{errors.employee_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Date *</label>
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-black">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Status *</label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-black">{errors.status.message}</p>
                )}
              </div>

              {watchedStatus !== 'absent' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Check In Time *</label>
                    <input
                      {...register('check_in', { required: watchedStatus !== 'absent' ? 'Check in time is required' : false })}
                      type="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                    {errors.check_in && (
                      <p className="mt-1 text-sm text-black">{errors.check_in.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">Check Out Time</label>
                    <input
                      {...register('check_out')}
                      type="time"
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>

                  {/* Hours and Pay Preview */}
                  {watchedCheckIn && watchedCheckOut && (
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <h4 className="text-sm font-medium text-black mb-2">Preview</h4>
                      {(() => {
                        const selectedEmployee = employees.find(emp => emp.id === watch('employee_id'))
                        if (selectedEmployee) {
                          const { regularHours, overtimeHours, totalPay } = calculateHoursAndPay(
                            watchedCheckIn, 
                            watchedCheckOut, 
                            selectedEmployee
                          )
                          return (
                            <div className="text-sm space-y-1">
                              <div>Regular Hours: {regularHours.toFixed(1)}h</div>
                              <div>Overtime Hours: {overtimeHours.toFixed(1)}h</div>
                              <div className="font-semibold">Total Pay: {formatCurrency(totalPay)}</div>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMarkForm(false)
                    setEditingRecord(null)
                    reset()
                  }}
                  className="flex-1 px-4 py-3 text-black bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200"
                >
                  {editingRecord ? 'Update Attendance' : 'Mark Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Attendance