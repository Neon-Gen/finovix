import React from 'react'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Company information
const COMPANY_INFO = {
  name: 'Burhani Accounts',
  address: 'PVC Pipe Manufacturing',
  phone: '+91 XXXXX XXXXX',
  email: 'info@burhaniaccounts.com',
  website: 'www.burhaniaccounts.com'
}

// Utility functions
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// PDF Export Functions
export const exportBillsPDF = (bills: any[], userInfo?: any) => {
  try {
    const doc = new jsPDF()
    
    // Add company header
    addPDFHeader(doc, 'Bills Report')
    
    // Add summary
    const totalAmount = bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
    const paidBills = bills.filter(bill => bill.status === 'paid').length
    const pendingBills = bills.filter(bill => bill.status !== 'paid').length
    
    doc.setFontSize(12)
    doc.text(`Total Bills: ${bills.length}`, 20, 60)
    doc.text(`Paid Bills: ${paidBills}`, 20, 70)
    doc.text(`Pending Bills: ${pendingBills}`, 20, 80)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 90)
    
    // Add table
    const tableData = bills.map(bill => [
      bill.bill_number,
      bill.customer_name,
      formatDate(bill.created_at),
      formatDate(bill.due_date),
      formatCurrency(bill.total_amount),
      bill.status.toUpperCase()
    ])
    
    autoTable(doc, {
      head: [['Bill Number', 'Customer', 'Created', 'Due Date', 'Amount', 'Status']],
      body: tableData,
      startY: 100,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    doc.save(`bills-report-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting bills PDF:', error)
    throw new Error('Failed to export PDF')
  }
}

export const exportExpensesPDF = (expenses: any[], userInfo?: any) => {
  try {
    const doc = new jsPDF()
    
    addPDFHeader(doc, 'Expenses Report')
    
    // Add summary
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    const categories = [...new Set(expenses.map(expense => expense.category))]
    
    doc.setFontSize(12)
    doc.text(`Total Expenses: ${expenses.length}`, 20, 60)
    doc.text(`Categories: ${categories.length}`, 20, 70)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 80)
    
    // Add table
    const tableData = expenses.map(expense => [
      expense.description,
      expense.category,
      formatDate(expense.date),
      formatCurrency(expense.amount)
    ])
    
    autoTable(doc, {
      head: [['Description', 'Category', 'Date', 'Amount']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] }
    })
    
    doc.save(`expenses-report-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting expenses PDF:', error)
    throw new Error('Failed to export PDF')
  }
}

export const exportEmployeesPDF = (employees: any[], userInfo?: any) => {
  try {
    const doc = new jsPDF()
    
    addPDFHeader(doc, 'Employees Report')
    
    // Add summary
    const activeEmployees = employees.filter(emp => emp.is_active).length
    const avgHourlyRate = employees.length > 0 
      ? employees.reduce((sum, emp) => sum + emp.hourly_rate, 0) / employees.length 
      : 0
    
    doc.setFontSize(12)
    doc.text(`Total Employees: ${employees.length}`, 20, 60)
    doc.text(`Active Employees: ${activeEmployees}`, 20, 70)
    doc.text(`Average Hourly Rate: ${formatCurrency(avgHourlyRate)}`, 20, 80)
    
    // Add table
    const tableData = employees.map(employee => [
      employee.name,
      employee.position,
      employee.department,
      formatCurrency(employee.hourly_rate),
      formatCurrency(employee.overtime_rate),
      formatDate(employee.hire_date),
      employee.is_active ? 'Active' : 'Inactive'
    ])
    
    autoTable(doc, {
      head: [['Name', 'Position', 'Department', 'Hourly Rate', 'OT Rate', 'Hire Date', 'Status']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    })
    
    doc.save(`employees-report-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting employees PDF:', error)
    throw new Error('Failed to export PDF')
  }
}

export const exportAttendancePDF = (attendanceRecords: any[], userInfo?: any) => {
  const doc = new jsPDF()
  
  addPDFHeader(doc, 'Attendance Report')
  
  // Add summary
  const totalHours = attendanceRecords.reduce((sum, record) => sum + record.regular_hours + record.overtime_hours, 0)
  const totalPay = attendanceRecords.reduce((sum, record) => sum + record.total_pay, 0)
  
  doc.setFontSize(12)
  doc.text(`Total Records: ${attendanceRecords.length}`, 20, 60)
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 20, 70)
  doc.text(`Total Pay: ${formatCurrency(totalPay)}`, 20, 80)
  
  // Add table
  const tableData = attendanceRecords.map(record => [
    record.employee?.name || 'Unknown',
    formatDate(record.date),
    record.check_in,
    record.check_out || '-',
    `${record.regular_hours.toFixed(1)}h`,
    `${record.overtime_hours.toFixed(1)}h`,
    formatCurrency(record.total_pay),
    record.status.toUpperCase()
  ])
  
  autoTable(doc, {
    head: [['Employee', 'Date', 'Check In', 'Check Out', 'Regular', 'Overtime', 'Pay', 'Status']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] }
  })
  
  doc.save(`attendance-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportFinancialReportPDF = (data: any, userInfo?: any) => {
  const doc = new jsPDF()
  
  addPDFHeader(doc, 'Financial Report')
  
  // Add financial summary
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Financial Summary', 20, 60)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Total Revenue: ${formatCurrency(data.totalRevenue || 0)}`, 20, 75)
  doc.text(`Total Expenses: ${formatCurrency(data.totalExpenses || 0)}`, 20, 85)
  doc.text(`Net Profit: ${formatCurrency((data.totalRevenue || 0) - (data.totalExpenses || 0))}`, 20, 95)
  doc.text(`Profit Margin: ${data.profitMargin?.toFixed(1) || 0}%`, 20, 105)
  
  // Add monthly data if available
  if (data.monthlyData && data.monthlyData.length > 0) {
    const tableData = data.monthlyData.map((month: any) => [
      month.month,
      formatCurrency(month.revenue || 0),
      formatCurrency(month.expenses || 0),
      formatCurrency(month.profit || 0)
    ])
    
    autoTable(doc, {
      head: [['Month', 'Revenue', 'Expenses', 'Profit']],
      body: tableData,
      startY: 120,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    })
  }
  
  doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportTaxSummaryPDF = (taxData: any, userInfo?: any) => {
  const doc = new jsPDF()
  
  addPDFHeader(doc, 'Tax Summary Report')
  
  // Add tax summary
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('GST Summary', 20, 60)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Tax Rate: ${taxData.taxRate}%`, 20, 75)
  doc.text(`Total Revenue: ${formatCurrency(taxData.totalRevenue)}`, 20, 85)
  doc.text(`Tax Collected: ${formatCurrency(taxData.totalTaxCollected)}`, 20, 95)
  doc.text(`Tax Paid: ${formatCurrency(taxData.estimatedTaxPaid)}`, 20, 105)
  doc.text(`Net Tax Liability: ${formatCurrency(taxData.netTaxLiability)}`, 20, 115)
  doc.text(`Next GST Due Date: ${taxData.gstReturns.nextDueDate}`, 20, 125)
  
  // Add monthly tax data
  if (taxData.monthlyTaxData && taxData.monthlyTaxData.length > 0) {
    const tableData = taxData.monthlyTaxData.map((month: any) => [
      month.month,
      formatCurrency(month.taxCollected || 0),
      formatCurrency(month.taxPaid || 0),
      formatCurrency(month.netTax || 0)
    ])
    
    autoTable(doc, {
      head: [['Month', 'Tax Collected', 'Tax Paid', 'Net Tax']],
      body: tableData,
      startY: 140,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 197, 94] }
    })
  }
  
  doc.save(`tax-summary-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportPayrollReportPDF = (payrollData: any[], userInfo?: any) => {
  const doc = new jsPDF()
  
  addPDFHeader(doc, 'Payroll Report')
  
  // Add payroll summary
  const totalGrossPay = payrollData.reduce((sum, emp) => sum + emp.grossPay, 0)
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.totalDeductions, 0)
  const totalNetPay = payrollData.reduce((sum, emp) => sum + emp.netPay, 0)
  
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text('Payroll Summary', 20, 60)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Total Employees: ${payrollData.length}`, 20, 75)
  doc.text(`Gross Payroll: ${formatCurrency(totalGrossPay)}`, 20, 85)
  doc.text(`Total Deductions: ${formatCurrency(totalDeductions)}`, 20, 95)
  doc.text(`Net Payroll: ${formatCurrency(totalNetPay)}`, 20, 105)
  
  // Add employee payroll data
  const tableData = payrollData.map(employee => [
    employee.name,
    employee.department,
    `${employee.regularHours}h`,
    `${employee.overtimeHours}h`,
    formatCurrency(employee.grossPay),
    formatCurrency(employee.totalDeductions),
    formatCurrency(employee.netPay)
  ])
  
  autoTable(doc, {
    head: [['Employee', 'Department', 'Regular Hours', 'OT Hours', 'Gross Pay', 'Deductions', 'Net Pay']],
    body: tableData,
    startY: 120,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [147, 51, 234] }
  })
  
  doc.save(`payroll-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

// Excel Export Functions
export const exportBillsExcel = (bills: any[], userInfo?: any) => {
  try {
    const workbook = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['Bills Report Summary'],
      ['Generated on:', formatDate(new Date())],
      [''],
      ['Total Bills:', bills.length],
      ['Paid Bills:', bills.filter(bill => bill.status === 'paid').length],
      ['Pending Bills:', bills.filter(bill => bill.status !== 'paid').length],
      ['Total Amount:', bills.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)]
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    
    // Bills data sheet
    const billsData = [
      ['Bill Number', 'Customer Name', 'Customer Email', 'Customer Phone', 'Created Date', 'Due Date', 'Subtotal', 'Tax Amount', 'Total Amount', 'Status'],
      ...bills.map(bill => [
        bill.bill_number,
        bill.customer_name,
        bill.customer_email,
        bill.customer_phone,
        formatDate(bill.created_at),
        formatDate(bill.due_date),
        bill.subtotal,
        bill.tax_amount,
        bill.total_amount,
        bill.status.toUpperCase()
      ])
    ]
    
    const billsSheet = XLSX.utils.aoa_to_sheet(billsData)
    XLSX.utils.book_append_sheet(workbook, billsSheet, 'Bills')
    
    XLSX.writeFile(workbook, `bills-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Error exporting bills Excel:', error)
    throw new Error('Failed to export Excel')
  }
}

export const exportExpensesExcel = (expenses: any[], userInfo?: any) => {
  try {
    const workbook = XLSX.utils.book_new()
    
    // Summary sheet
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    const categories = [...new Set(expenses.map(expense => expense.category))]
    
    const summaryData = [
      ['Expenses Report Summary'],
      ['Generated on:', formatDate(new Date())],
      [''],
      ['Total Expenses:', expenses.length],
      ['Categories:', categories.length],
      ['Total Amount:', totalAmount],
      [''],
      ['Category Breakdown:'],
      ...categories.map(category => {
        const categoryTotal = expenses
          .filter(expense => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0)
        return [category, categoryTotal]
      })
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    
    // Expenses data sheet
    const expensesData = [
      ['Description', 'Category', 'Amount', 'Date', 'Created Date'],
      ...expenses.map(expense => [
        expense.description,
        expense.category,
        expense.amount,
        formatDate(expense.date),
        formatDate(expense.created_at)
      ])
    ]
    
    const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData)
    XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses')
    
    XLSX.writeFile(workbook, `expenses-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Error exporting expenses Excel:', error)
    throw new Error('Failed to export Excel')
  }
}

export const exportEmployeesExcel = (employees: any[], userInfo?: any) => {
  try {
    const workbook = XLSX.utils.book_new()
    
    // Summary sheet
    const activeEmployees = employees.filter(emp => emp.is_active).length
    const departments = [...new Set(employees.map(emp => emp.department))]
    
    const summaryData = [
      ['Employees Report Summary'],
      ['Generated on:', formatDate(new Date())],
      [''],
      ['Total Employees:', employees.length],
      ['Active Employees:', activeEmployees],
      ['Departments:', departments.length],
      [''],
      ['Department Breakdown:'],
      ...departments.map(dept => {
        const deptCount = employees.filter(emp => emp.department === dept).length
        return [dept, deptCount]
      })
    ]
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    
    // Employees data sheet
    const employeesData = [
      ['Name', 'Email', 'Phone', 'Position', 'Department', 'Hourly Rate', 'Overtime Rate', 'Hire Date', 'Status'],
      ...employees.map(employee => [
        employee.name,
        employee.email,
        employee.phone,
        employee.position,
        employee.department,
        employee.hourly_rate,
        employee.overtime_rate,
        formatDate(employee.hire_date),
        employee.is_active ? 'Active' : 'Inactive'
      ])
    ]
    
    const employeesSheet = XLSX.utils.aoa_to_sheet(employeesData)
    XLSX.utils.book_append_sheet(workbook, employeesSheet, 'Employees')
    
    XLSX.writeFile(workbook, `employees-report-${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Error exporting employees Excel:', error)
    throw new Error('Failed to export Excel')
  }
}

export const exportAttendanceExcel = (attendanceRecords: any[], userInfo?: any) => {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const totalHours = attendanceRecords.reduce((sum, record) => sum + record.regular_hours + record.overtime_hours, 0)
  const totalPay = attendanceRecords.reduce((sum, record) => sum + record.total_pay, 0)
  
  const summaryData = [
    ['Attendance Report Summary'],
    ['Generated on:', formatDate(new Date())],
    [''],
    ['Total Records:', attendanceRecords.length],
    ['Total Hours:', totalHours.toFixed(1)],
    ['Total Pay:', totalPay]
  ]
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  
  // Attendance data sheet
  const attendanceData = [
    ['Employee', 'Date', 'Check In', 'Check Out', 'Regular Hours', 'Overtime Hours', 'Total Pay', 'Status'],
    ...attendanceRecords.map(record => [
      record.employee?.name || 'Unknown',
      formatDate(record.date),
      record.check_in,
      record.check_out || '-',
      record.regular_hours.toFixed(1),
      record.overtime_hours.toFixed(1),
      record.total_pay,
      record.status.toUpperCase()
    ])
  ]
  
  const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData)
  XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance')
  
  XLSX.writeFile(workbook, `attendance-report-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportFinancialReportExcel = (data: any, userInfo?: any) => {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['Financial Report Summary'],
    ['Generated on:', formatDate(new Date())],
    [''],
    ['Total Revenue:', data.totalRevenue || 0],
    ['Total Expenses:', data.totalExpenses || 0],
    ['Net Profit:', (data.totalRevenue || 0) - (data.totalExpenses || 0)],
    ['Profit Margin:', `${data.profitMargin?.toFixed(1) || 0}%`]
  ]
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  
  // Monthly data sheet
  if (data.monthlyData && data.monthlyData.length > 0) {
    const monthlyData = [
      ['Month', 'Revenue', 'Expenses', 'Profit'],
      ...data.monthlyData.map((month: any) => [
        month.month,
        month.revenue || 0,
        month.expenses || 0,
        month.profit || 0
      ])
    ]
    
    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Data')
  }
  
  XLSX.writeFile(workbook, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportTaxSummaryExcel = (taxData: any, userInfo?: any) => {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const summaryData = [
    ['Tax Summary Report'],
    ['Generated on:', formatDate(new Date())],
    [''],
    ['Tax Rate:', `${taxData.taxRate}%`],
    ['Total Revenue:', taxData.totalRevenue],
    ['Tax Collected:', taxData.totalTaxCollected],
    ['Tax Paid:', taxData.estimatedTaxPaid],
    ['Net Tax Liability:', taxData.netTaxLiability],
    ['Next GST Due Date:', taxData.gstReturns.nextDueDate]
  ]
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  
  // Monthly tax data sheet
  if (taxData.monthlyTaxData && taxData.monthlyTaxData.length > 0) {
    const monthlyData = [
      ['Month', 'Tax Collected', 'Tax Paid', 'Net Tax'],
      ...taxData.monthlyTaxData.map((month: any) => [
        month.month,
        month.taxCollected || 0,
        month.taxPaid || 0,
        month.netTax || 0
      ])
    ]
    
    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Tax Data')
  }
  
  XLSX.writeFile(workbook, `tax-summary-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportPayrollReportExcel = (payrollData: any[], userInfo?: any) => {
  const workbook = XLSX.utils.book_new()
  
  // Summary sheet
  const totalGrossPay = payrollData.reduce((sum, emp) => sum + emp.grossPay, 0)
  const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.totalDeductions, 0)
  const totalNetPay = payrollData.reduce((sum, emp) => sum + emp.netPay, 0)
  
  const summaryData = [
    ['Payroll Report Summary'],
    ['Generated on:', formatDate(new Date())],
    [''],
    ['Total Employees:', payrollData.length],
    ['Gross Payroll:', totalGrossPay],
    ['Total Deductions:', totalDeductions],
    ['Net Payroll:', totalNetPay]
  ]
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
  
  // Payroll data sheet
  const payrollDataSheet = [
    ['Employee', 'Department', 'Position', 'Regular Hours', 'OT Hours', 'Hourly Rate', 'OT Rate', 'Regular Pay', 'OT Pay', 'Gross Pay', 'PF', 'ESI', 'Tax', 'Total Deductions', 'Net Pay'],
    ...payrollData.map(employee => [
      employee.name,
      employee.department,
      employee.position,
      employee.regularHours,
      employee.overtimeHours,
      employee.hourlyRate,
      employee.overtimeRate,
      employee.regularPay,
      employee.overtimePay,
      employee.grossPay,
      employee.pf,
      employee.esi,
      employee.tax,
      employee.totalDeductions,
      employee.netPay
    ])
  ]
  
  const payrollSheet = XLSX.utils.aoa_to_sheet(payrollDataSheet)
  XLSX.utils.book_append_sheet(workbook, payrollSheet, 'Payroll Data')
  
  XLSX.writeFile(workbook, `payroll-report-${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Helper function to add PDF header
const addPDFHeader = (doc: jsPDF, title: string) => {
  // Company logo area (placeholder)
  doc.setFillColor(59, 130, 246)
  doc.rect(20, 10, 170, 30, 'F')
  
  // Company name and title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(COMPANY_INFO.name, 25, 25)
  
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(title, 25, 35)
  
  // Date and company info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.text(`Generated on: ${formatDate(new Date())}`, 140, 25)
  doc.text(COMPANY_INFO.address, 140, 35)
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
}

// Export component for reuse
export const ExportButtons: React.FC<{
  onExportPDF: () => void
  onExportExcel: () => void
  className?: string
}> = ({ onExportPDF, onExportExcel, className = '' }) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={onExportPDF}
        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        <Download className="h-4 w-4 mr-2" />
        PDF
      </button>
      <button
        onClick={onExportExcel}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        <Download className="h-4 w-4 mr-2" />
        Excel
      </button>
    </div>
  )
}