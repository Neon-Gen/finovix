import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { supabase } from '../lib/supabase'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  IndianRupee,
  User,
  Phone,
  Mail,
  Download,
  Upload,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BarChart3,
  MessageCircle,
  FileSpreadsheet,
  RefreshCw,
  LayoutList,
  Grid,
  X
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { exportBillsPDF, exportBillsExcel, ExportButtons } from '../utils/exportUtils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { motion } from 'framer-motion'

interface BillItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface Bill {
  id: string
  bill_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  items: BillItem[]
  subtotal: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  created_at: string
  due_date: string
}

interface BillFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  due_date: string
  tax_rate: number
  items: BillItem[]
}

const Bills: React.FC = () => {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [viewingBill, setViewingBill] = useState<Bill | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedBills, setSelectedBills] = useState<string[]>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BillFormData>({
    defaultValues: {
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax_rate: settings?.default_tax_rate || 18,
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
    }
  })

  const watchedItems = watch('items')
  const watchedTaxRate = watch('tax_rate')

  // Memoize the fetchBills function to prevent infinite re-renders
  const fetchBills = useCallback(async () => {
    if (!user) return

    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Update overdue status for bills past due date
      const updatedBills = (data || []).map(bill => {
        const today = new Date()
        const dueDate = new Date(bill.due_date)
        if (bill.status === 'sent' && dueDate < today) {
          return { ...bill, status: 'overdue' }
        }
        return bill
      })

      setBills(updatedBills)
    } catch (error) {
      console.error('Error fetching bills:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchBills()
    const interval = setInterval(fetchBills, 30000)
    return () => clearInterval(interval)
  }, [fetchBills])

  // Separate useEffect for calculating amounts with proper dependencies
  useEffect(() => {
    if (!watchedItems || !Array.isArray(watchedItems)) return

    const items = watchedItems.map(item => ({
      ...item,
      amount: (item.quantity || 0) * (item.rate || 0)
    }))

    // Only update if items have actually changed
    const hasChanged = items.some((item, index) => {
      const originalItem = watchedItems[index]
      return !originalItem || item.amount !== originalItem.amount
    })

    if (hasChanged) {
      setValue('items', items, { shouldValidate: false })
    }
  }, [watchedItems, watchedTaxRate, setValue])

  const generateBillNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `BILL-${year}${month}${day}-${random}`
  }

  const onSubmit = async (data: BillFormData) => {
    if (!user) return

    try {
      const items = data.items.filter(item => item.description.trim() !== '')
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
      const taxAmount = (subtotal * data.tax_rate) / 100
      const totalAmount = subtotal + taxAmount

      const billData = {
        user_id: user.id,
        bill_number: editingBill?.bill_number || generateBillNumber(),
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        items: items,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        due_date: data.due_date,
        status: 'draft'
      }

      if (editingBill) {
        const { error } = await supabase
          .from('bills')
          .update(billData)
          .eq('id', editingBill.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('bills')
          .insert([billData])

        if (error) throw error
      }

      await fetchBills()
      setShowCreateForm(false)
      setEditingBill(null)
      reset()
    } catch (error) {
      console.error('Error saving bill:', error)
      alert('Error saving bill. Please try again.')
    }
  }

  const deleteBill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchBills()
    } catch (error) {
      console.error('Error deleting bill:', error)
      alert('Error deleting bill. Please try again.')
    }
  }

  const updateBillStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      await fetchBills()
    } catch (error) {
      console.error('Error updating bill status:', error)
      alert('Error updating bill status. Please try again.')
    }
  }

  const startEdit = (bill: Bill) => {
    setEditingBill(bill)
    setValue('customer_name', bill.customer_name)
    setValue('customer_email', bill.customer_email)
    setValue('customer_phone', bill.customer_phone)
    setValue('due_date', bill.due_date)
    setValue('tax_rate', (bill.tax_amount / bill.subtotal) * 100)
    setValue('items', bill.items)
    setShowCreateForm(true)
  }

  const viewBill = (bill: Bill) => {
    setViewingBill(bill)
    setShowViewModal(true)
  }

  const duplicateBill = (bill: Bill) => {
    setEditingBill(null)
    setValue('customer_name', bill.customer_name)
    setValue('customer_email', bill.customer_email)
    setValue('customer_phone', bill.customer_phone)
    setValue('due_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    setValue('tax_rate', (bill.tax_amount / bill.subtotal) * 100)
    setValue('items', bill.items)
    setShowCreateForm(true)
  }

  const addItem = () => {
    const currentItems = watchedItems || []
    setValue('items', [...currentItems, { description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    const currentItems = watchedItems || []
    if (currentItems.length > 1) {
      setValue('items', currentItems.filter((_, i) => i !== index))
    }
  }

  const toggleBillSelection = (billId: string) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    )
  }

  const selectAllBills = () => {
    setSelectedBills(filteredBills.map(bill => bill.id))
  }

  const clearSelection = () => {
    setSelectedBills([])
  }

  const bulkDeleteBills = async () => {
    if (selectedBills.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedBills.length} bill(s)?`)) return

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .in('id', selectedBills)

      if (error) throw error
      await fetchBills()
      clearSelection()
    } catch (error) {
      console.error('Error deleting bills:', error)
      alert('Error deleting bills. Please try again.')
    }
  }

  // Individual bill PDF export
const exportIndividualBillPDF = (bill: Bill) => {
  const doc = new jsPDF()
  
  // Company header with minimal black & white design
  doc.setFillColor(0, 0, 0)
  doc.rect(20, 10, 170, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(settings?.company_name || 'Finora', 25, 30)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Premium Business Accounting System', 25, 42)
  
  // Bill details in clean typography with rounded corners
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`INVOICE NO: ${bill.bill_number}`, 20, 70)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated Date: ${new Date(bill.created_at).toLocaleDateString()}`, 20, 85)
  doc.text(`Due Date: ${new Date(bill.due_date).toLocaleDateString()}`, 20, 95)
  doc.text(`Payment Terms: Net ${Math.ceil((new Date(bill.due_date).getTime() - new Date(bill.created_at).getTime()) / (1000 * 3600 * 24))} days`, 20, 105)
  
  // Customer details with improved spacing
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', 120, 70)
  
  doc.setFont('helvetica', 'normal')
  doc.text(bill.customer_name, 120, 85)
  if (bill.customer_email) doc.text(`Email: ${bill.customer_email}`, 120, 95)
  if (bill.customer_phone) doc.text(`Phone: ${bill.customer_phone}`, 120, 105)
  
  // Items table with monochrome styling and rounded corners
  const tableData = bill.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${settings?.currency || '₹'} ${Number(item.rate).toFixed(2)}`,
    `${settings?.currency || '₹'} ${Number(item.amount).toFixed(2)}`
  ])
  
  autoTable(doc, {
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    startY: 120,
    styles: { 
      fontSize: 10,
      cellPadding: 8,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      halign: 'left'
    },
    headStyles: { 
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: {cellWidth: 30, halign: 'center'},
      2: {cellWidth: 30, halign: 'center'},
      3: {cellWidth: 30, halign: 'center'}
    },
    margin: {top: 20, right: 20, bottom: 20, left: 20}
  })
  
  // Totals with enhanced typography
  const finalY = (doc as any).lastAutoTable.finalY + 15
  
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.1)
  doc.line(120, finalY - 5, 190, finalY - 5)
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Subtotal: ${settings?.currency || '₹'} ${Number(bill.subtotal).toFixed(2)}`, 140, finalY)
  doc.text(`Tax (${((Number(bill.tax_amount)/Number(bill.subtotal))*100).toFixed(1)}%): ${settings?.currency || '₹'} ${Number(bill.tax_amount).toFixed(2)}`, 140, finalY + 10)
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: ${settings?.currency || '₹'} ${Number(bill.total_amount).toFixed(2)}`, 140, finalY + 25)
  
  // Terms and conditions
  doc.text('Terms & Conditions:', 20, finalY + 90)
  doc.setFontSize(8)
  doc.text('1. Payment is due within the specified payment terms', 20, finalY + 100)
  doc.text('2. Please include invoice number in payment reference', 20, finalY + 108)
  
  // Footer with rounded corners
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.roundedRect(20, doc.internal.pageSize.height - 30, 170, 20, 3, 3, 'S')
  doc.setFontSize(10)
  doc.text(`Generated by ${settings?.company_name || 'Finora'} on ${new Date().toLocaleString()}`, 25, doc.internal.pageSize.height - 18)
  
  doc.save(`invoice-${bill.bill_number}.pdf`)
}

  // Individual bill Excel export
  const exportIndividualBillExcel = (bill: Bill) => {
    const workbook = XLSX.utils.book_new()
    
    // Bill details sheet
    const billData = [
      ['Invoice Details'],
      ['Bill Number', bill.bill_number],
      ['Customer', bill.customer_name],
      ['Email', bill.customer_email],
      ['Phone', bill.customer_phone],
      ['Date', new Date(bill.created_at).toLocaleDateString()],
      ['Due Date', new Date(bill.due_date).toLocaleDateString()],
      ['Status', bill.status.toUpperCase()],
      [''],
      ['Items'],
      ['Description', 'Quantity', 'Rate', 'Amount'],
      ...bill.items.map(item => [item.description, item.quantity, item.rate, item.amount]),
      [''],
      ['Subtotal', '', '', bill.subtotal],
      ['Tax', '', '', bill.tax_amount],
      ['Total', '', '', bill.total_amount]
    ]
    
    const billSheet = XLSX.utils.aoa_to_sheet(billData)
    XLSX.utils.book_append_sheet(workbook, billSheet, 'Invoice')
    
    XLSX.writeFile(workbook, `invoice-${bill.bill_number}.xlsx`)
  }

  // WhatsApp sharing function
  const shareViaWhatsApp = (bill: Bill, format: 'pdf' | 'excel') => {
    if (!bill.customer_phone) {
      alert('Customer phone number is required for WhatsApp sharing')
      return
    }

    // Generate the document first
    if (format === 'pdf') {
      exportIndividualBillPDF(bill)
    } else {
      exportIndividualBillExcel(bill)
    }

    // Create WhatsApp message
    const message = `Hi ${bill.customer_name},

Your invoice ${bill.bill_number} is ready!

Amount: ${formatCurrency(bill.total_amount)}
Due Date: ${new Date(bill.due_date).toLocaleDateString()}

Please find the attached ${format.toUpperCase()} file.

Thank you for your business!

Best regards,
${settings?.company_name || 'Burhani Accounts'}`

    // Clean phone number (remove non-digits)
    const cleanPhone = bill.customer_phone.replace(/\D/g, '')
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
  }

  // Import functionality
const handleFileImport = async () => {
  if (!importFile || !user) return

  try {
    setImportLoading(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        let importedBill: any = null

        if (importFile.name.endsWith('.xlsx') || importFile.name.endsWith('.xls')) {
          // Excel import
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          // Only take the first row as a single bill
          if (jsonData.length > 0) {
            const row = jsonData[0]
            importedBill = {
              user_id: user.id,
              bill_number: (row as Record<string, unknown>)['Bill Number']?.toString() || generateBillNumber(),
              customer_name: (row as Record<string, unknown>)['Customer Name']?.toString() || '',
              customer_email: (row as Record<string, unknown>)['Customer Email']?.toString() || '',
              customer_phone: (row as Record<string, unknown>)['Customer Phone']?.toString() || '',
              items: [{ 
                description: (row as Record<string, unknown>)['Description']?.toString() || 'Imported Item', 
                quantity: (row as Record<string, unknown>)['Quantity']?.toString() || 1, 
                rate: (row as Record<string, unknown>)['Rate']?.toString() || 0, 
                amount: (row as Record<string, unknown>)['Amount']?.toString() || 0 
              }],
              subtotal: (row as Record<string, unknown>)['Subtotal']?.toString() || 0,
              tax_amount: (row as Record<string, unknown>)['Tax Amount']?.toString() || 0,
              total_amount: (row as Record<string, unknown>)['Total Amount']?.toString() || 0,
              status: 'draft',
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          }
        } else if (importFile.name.endsWith('.json')) {
          // JSON import
          const jsonData = JSON.parse(data as string)
          importedBill = {
            ...jsonData,
            user_id: user.id,
            bill_number: jsonData.bill_number || generateBillNumber(),
            status: 'draft'
          }
        }

        if (importedBill) {
          const { error } = await supabase
            .from('bills')
            .insert([importedBill]) // Insert as single bill

          if (error) throw error
          
          await fetchBills()
          setShowImportModal(false)
          setImportFile(null)
          alert('Successfully imported bill')
        }
      } catch (error) {
        console.error('Error processing import file:', error)
        alert('Error processing import file. Please check the format.')
      }
    }

    if (importFile.name.endsWith('.json')) {
      reader.readAsText(importFile)
    } else {
      reader.readAsArrayBuffer(importFile)
    }
  } catch (error) {
    console.error('Error importing bill:', error)
    alert('Error importing bill. Please try again.')
  } finally {
    setImportLoading(false)
  }
}

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus
    const billMonth = bill.created_at.slice(0, 7)
    const matchesMonth = !selectedMonth || billMonth === selectedMonth
    return matchesSearch && matchesStatus && matchesMonth
  })

  const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.total_amount, 0)
  const paidAmount = filteredBills.filter(bill => bill.status === 'paid').reduce((sum, bill) => sum + bill.total_amount, 0)
  const pendingAmount = filteredBills.filter(bill => ['sent', 'overdue'].includes(bill.status)).reduce((sum, bill) => sum + bill.total_amount, 0)
  const overdueAmount = filteredBills.filter(bill => bill.status === 'overdue').reduce((sum, bill) => sum + bill.total_amount, 0)

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'INR'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-gray-100 text-black'
      case 'sent': return 'bg-gray-100 text-black'
      case 'overdue': return 'bg-gray-100 text-black'
      default: return 'bg-gray-100 text-black'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'sent': return <Send className="h-4 w-4" />
      case 'overdue': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleExportPDF = () => {
    exportBillsPDF(filteredBills, user)
  }

  const handleExportExcel = () => {
    exportBillsExcel(filteredBills, user)
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
      {/* Enhanced Header */}
      <motion.div 
        className="bg-gradient-to-r from-black to-gray-800 rounded-3xl p-4 md:p-6 lg:p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Background decorative elements */}
        <motion.div 
          className="absolute inset-0 bg-black opacity-10"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
        ></motion.div>
        <motion.div 
          className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-white opacity-5 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-white opacity-5 rounded-full -ml-16 md:-ml-24 -mb-16 md:-mb-24"
          animate={{ 
            rotate: -360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        ></motion.div>
        
        <div className="relative z-10">
          <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
            {/* Header Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Bills & Invoices
              </motion.h1>
              
              <motion.p 
                className="text-gray-300 text-base sm:text-lg mb-4 max-w-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Create, manage and track your customer bills and invoices
              </motion.p>

              <motion.div 
                className="flex flex-wrap items-center gap-4 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div 
                  className="flex items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-black/30 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    transition={{ duration: 2, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                  </motion.div>
                  <span className="whitespace-nowrap">Last updated: {new Date().toLocaleTimeString()}</span>
                </motion.div>

                <motion.div 
                  className="flex items-center bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-black/30 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                  </motion.div>
                  <span className="whitespace-nowrap">{filteredBills.length} bills this period</span>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Action Buttons Group */}
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <motion.button
                  onClick={handleExportPDF}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Export PDF"
                >
                  <FileText className="h-5 w-5" />
                </motion.button>

                <motion.button
                  onClick={handleExportExcel}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Export Excel"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                </motion.button>

                <motion.button
                  onClick={() => setShowImportModal(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Import Bills"
                >
                  <Upload className="h-5 w-5" />
                </motion.button>

                <motion.button
                  onClick={() => fetchBills()}
                  disabled={refreshing}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: refreshing ? 360 : 0 }}
                    transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </motion.div>
                </motion.button>
              </motion.div>

              {/* View Mode Toggle */}
              <motion.div 
                className="flex bg-black/20 rounded-full p-1"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <motion.button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white text-black' 
                      : 'text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <LayoutList className="h-5 w-5" />
                </motion.button>
                <motion.button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-black' 
                      : 'text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Grid className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Create New Bill Button */}
              <motion.button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full hover:bg-gray-100 transition-all duration-200 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1 }}
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">New Bill</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bills</p>
              <motion.p 
                className="text-3xl font-bold text-black mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {filteredBills.length}
              </motion.p>
            </div>
            <motion.div 
              className="bg-black p-4 rounded-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <div className="mt-6 text-sm text-gray-500 font-medium">
            This period
          </div>
          <motion.div 
            className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div 
              className="bg-black h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <motion.p 
                className="text-3xl font-bold text-black mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {formatCurrency(totalAmount)}
              </motion.p>
            </div>
            <motion.div 
              className="bg-black p-4 rounded-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <IndianRupee className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <div className="mt-6 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-black mr-1" />
            <span className="text-black font-medium">All bills</span>
          </div>
          <motion.div 
            className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div 
              className="bg-black h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Amount</p>
              <motion.p 
                className="text-3xl font-bold text-black mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {formatCurrency(paidAmount)}
              </motion.p>
            </div>
            <motion.div 
              className="bg-black p-4 rounded-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <CheckCircle className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <div className="mt-6 text-sm text-gray-500 font-medium">
            Received payments
          </div>
          <motion.div 
            className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div 
              className="bg-black h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
          whileHover={{ scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Amount</p>
              <motion.p 
                className="text-3xl font-bold text-black mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {formatCurrency(overdueAmount)}
              </motion.p>
            </div>
            <motion.div 
              className="bg-black p-4 rounded-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <AlertCircle className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          <div className="mt-6 text-sm text-gray-500 font-medium">
            Needs attention
          </div>
          <motion.div 
            className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div 
              className="bg-black h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bills..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Month</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Actions</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex-1 px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm"
              >
                <Upload className="h-4 w-4 mx-auto" />
              </button>
              <button 
                onClick={() => alert('Send bulk emails')}
                className="flex-1 px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm"
              >
                <Send className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Bulk Actions</label>
            <div className="flex space-x-2">
              <button
                onClick={selectedBills.length === filteredBills.length ? clearSelection : selectAllBills}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors text-sm"
              >
                {selectedBills.length === filteredBills.length ? 'Clear' : 'Select All'}
              </button>
              {selectedBills.length > 0 && (
                <button
                  onClick={bulkDeleteBills}
                  className="flex-1 px-3 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors text-sm"
                >
                  Delete ({selectedBills.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bills Display */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredBills.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedBills.length === filteredBills.length}
                        onChange={() => selectedBills.length === filteredBills.length ? clearSelection() : selectAllBills()}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-black">Bill Details</th>
                    <th className="text-left py-4 px-6 font-semibold text-black">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-black">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-black">Due Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-black">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(bill.id)}
                          onChange={() => toggleBillSelection(bill.id)}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-semibold text-black">{bill.bill_number}</div>
                          <div className="text-sm text-gray-600">
                            Created {new Date(bill.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-black">{bill.customer_name}</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {bill.customer_email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {bill.customer_email}
                              </div>
                            )}
                            {bill.customer_phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {bill.customer_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-lg text-black">{formatCurrency(bill.total_amount)}</div>
                        <div className="text-sm text-gray-600">
                          Subtotal: {formatCurrency(bill.subtotal)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-black">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(bill.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(bill.status)}`}>
                            {getStatusIcon(bill.status)}
                            <span className="ml-1 capitalize">{bill.status}</span>
                          </span>
                          {bill.status === 'draft' && (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'sent')}
                              className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 transition-colors"
                            >
                              Mark as Sent
                            </button>
                          )}
                          {bill.status === 'sent' && (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'paid')}
                              className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 transition-colors"
                            >
                              Mark as Paid
                            </button>
                          )}
                          {bill.status === 'overdue' && (
                            <button
                              onClick={() => updateBillStatus(bill.id, 'paid')}
                              className="text-xs bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 transition-colors"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => viewBill(bill)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                            title="View Bill"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => exportIndividualBillPDF(bill)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => exportIndividualBillExcel(bill)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                            title="Download Excel"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>
                          {bill.customer_phone && (
                            <>
                              <button 
                                onClick={() => shareViaWhatsApp(bill, 'pdf')}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-colors"
                                title="Share PDF via WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => shareViaWhatsApp(bill, 'excel')}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-2xl transition-colors"
                                title="Share Excel via WhatsApp"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => startEdit(bill)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                            title="Edit Bill"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => duplicateBill(bill)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                            title="Duplicate Bill"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => deleteBill(bill.id)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-2xl transition-colors"
                            title="Delete Bill"
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
              <FileText className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-black mb-2">No bills found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' || selectedMonth
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating your first bill'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && !selectedMonth && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Bill
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedBills.includes(bill.id)}
                    onChange={() => toggleBillSelection(bill.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(bill.status)}`}>
                    {getStatusIcon(bill.status)}
                    <span className="ml-1 capitalize">{bill.status}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => viewBill(bill)}
                    className="p-1 text-gray-400 hover:text-black rounded"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => exportIndividualBillPDF(bill)}
                    className="p-1 text-gray-400 hover:text-black rounded"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {bill.customer_phone && (
                    <button 
                      onClick={() => shareViaWhatsApp(bill, 'pdf')}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => startEdit(bill)}
                    className="p-1 text-gray-400 hover:text-black rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteBill(bill.id)}
                    className="p-1 text-gray-400 hover:text-black rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-black mb-1">{bill.bill_number}</h3>
              <p className="text-gray-600 mb-3">{bill.customer_name}</p>
              
              <div className="text-2xl font-bold text-black mb-3">{formatCurrency(bill.total_amount)}</div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due {new Date(bill.due_date).toLocaleDateString()}
                </div>
                <div>
                  {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Status Actions */}
              <div className="mt-4 flex space-x-2">
                {bill.status === 'draft' && (
                  <button
                    onClick={() => updateBillStatus(bill.id, 'sent')}
                    className="flex-1 text-xs bg-black text-white px-3 py-2 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Mark as Sent
                  </button>
                )}
                {(bill.status === 'sent' || bill.status === 'overdue') && (
                  <button
                    onClick={() => updateBillStatus(bill.id, 'paid')}
                    className="flex-1 text-xs bg-black text-white px-3 py-2 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Import Bills</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Supported formats: Excel (.xlsx, .xls) and JSON (.json)
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <h4 className="font-medium text-black mb-2">Excel Format Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Customer Name (required)</li>
                  <li>• Customer Email</li>
                  <li>• Customer Phone</li>
                  <li>• Description</li>
                  <li>• Quantity, Rate, Amount</li>
                  <li>• Subtotal, Tax Amount, Total Amount</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-3 text-black bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileImport}
                  disabled={!importFile || importLoading}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importLoading ? 'Importing...' : 'Import Bills'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Bill Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-2xl font-bold text-black">
                {editingBill ? 'Edit Bill' : 'Create New Bill'}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingBill ? 'Update bill information' : 'Create a new invoice for your customer'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Customer Name *
                  </label>
                  <input
                    {...register('customer_name', { required: 'Customer name is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Enter customer name"
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-sm text-black">{errors.customer_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Customer Email
                  </label>
                  <input
                    {...register('customer_email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Enter customer email"
                  />
                  {errors.customer_email && (
                    <p className="mt-1 text-sm text-black">{errors.customer_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Customer Phone
                  </label>
                  <input
                    {...register('customer_phone')}
                    type="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="Enter customer phone"
                  />
                </div>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Due Date *
                  </label>
                  <input
                    {...register('due_date', { required: 'Due date is required' })}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                  {errors.due_date && (
                    <p className="mt-1 text-sm text-black">{errors.due_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    {...register('tax_rate', { 
                      required: 'Tax rate is required',
                      min: { value: 0, message: 'Tax rate cannot be negative' },
                      max: { value: 100, message: 'Tax rate cannot exceed 100%' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="18"
                  />
                  {errors.tax_rate && (
                    <p className="mt-1 text-sm text-black">{errors.tax_rate.message}</p>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">Bill Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {(watchedItems || []).map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-black mb-1">
                          Description *
                        </label>
                        <input
                          {...register(`items.${index}.description`, { required: 'Description is required' })}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                          placeholder="Item description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Quantity *
                        </label>
                        <input
                          {...register(`items.${index}.quantity`, { 
                            required: 'Quantity is required',
                            min: { value: 1, message: 'Quantity must be at least 1' }
                          })}
                          type="number"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">
                          Rate (₹) *
                        </label>
                        <input
                          {...register(`items.${index}.rate`, { 
                            required: 'Rate is required',
                            min: { value: 0, message: 'Rate cannot be negative' }
                          })}
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-black mb-1">
                            Amount (₹)
                          </label>
                          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-2xl text-black font-medium">
                            {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                          </div>
                        </div>
                        {(watchedItems || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="ml-2 p-2 text-black hover:bg-gray-100 rounded-2xl transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Summary */}
                <div className="mt-6 bg-gray-50 p-4 rounded-2xl">
                  <h4 className="text-sm font-medium text-black mb-3">Bill Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-medium text-black">
                        {formatCurrency((watchedItems || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Tax ({watchedTaxRate || 0}%):</span>
                      <span className="font-medium text-black">
                        {formatCurrency(((watchedItems || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0) * (watchedTaxRate || 0)) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2">
                      <span className="font-medium text-black">Total Amount:</span>
                      <span className="font-bold text-black">
                        {formatCurrency(
                          (watchedItems || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0)), 0) * 
                          (1 + (watchedTaxRate || 0) / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingBill(null)
                    reset()
                  }}
                  className="px-6 py-3 text-black bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 shadow-lg"
                >
                  {editingBill ? 'Update Bill' : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {showViewModal && viewingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-black">{viewingBill.bill_number}</h2>
                  <p className="text-gray-600">{viewingBill.customer_name}</p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-semibold text-black mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <p className="mt-1">{viewingBill.customer_name}</p>
                  </div>
                  {viewingBill.customer_email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="mt-1">{viewingBill.customer_email}</p>
                    </div>
                  )}
                  {viewingBill.customer_phone && (
                    <div>
                      <span className="font-medium text-gray-700">Phone:</span>
                      <p className="mt-1">{viewingBill.customer_phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span>
                    <p className="mt-1">{new Date(viewingBill.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Bill Items */}
              <div>
                <h3 className="font-semibold text-black mb-3">Bill Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-black">Description</th>
                        <th className="text-left py-2 px-3 font-medium text-black">Qty</th>
                        <th className="text-left py-2 px-3 font-medium text-black">Rate</th>
                        <th className="text-left py-2 px-3 font-medium text-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewingBill.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2 px-3">{item.description}</td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">{formatCurrency(item.rate)}</td>
                          <td className="py-2 px-3">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-semibold text-black mb-3">Bill Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium text-black">{formatCurrency(viewingBill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tax:</span>
                    <span className="font-medium text-black">{formatCurrency(viewingBill.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="font-medium text-black">Total Amount:</span>
                    <span className="font-bold text-black">{formatCurrency(viewingBill.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(viewingBill.status)}`}>
                    {getStatusIcon(viewingBill.status)}
                    <span className="ml-1 capitalize">{viewingBill.status}</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <button
                    onClick={() => exportIndividualBillPDF(viewingBill)}
                    className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2 inline" />
                    PDF
                  </button>
                  
                  <button
                    onClick={() => exportIndividualBillExcel(viewingBill)}
                    className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-2 inline" />
                    Excel
                  </button>

                  {viewingBill.customer_phone && (
                    <>
                      <button
                        onClick={() => shareViaWhatsApp(viewingBill, 'pdf')}
                        className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 mr-2 inline" />
                        WhatsApp PDF
                      </button>
                      
                      <button
                        onClick={() => shareViaWhatsApp(viewingBill, 'excel')}
                        className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 inline" />
                        WhatsApp Excel
                      </button>
                    </>
                  )}

                  {viewingBill.status !== 'paid' && (
                    <button
                      onClick={() => updateBillStatus(viewingBill.id, 'paid')}
                      className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                    >
                      Mark as Paid
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      startEdit(viewingBill)
                    }}
                    className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Edit Bill
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style >{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-slide-up-delay {
          animation: slide-up 0.6s ease-out 0.1s both;
        }
        
        .animate-slide-up-delay-2 {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
        
        .animate-slide-up-delay-3 {
          animation: slide-up 0.6s ease-out 0.3s both;
        }
      `}</style>
    </div>
  )
}

export default Bills