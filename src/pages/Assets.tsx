import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit2,
  Trash2,
  IndianRupee,
  Calculator,
  Eye,
  Search,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Upload,
  Archive,
  Star,
  Copy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import {
  PieChart as RechartsPieChart,
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
  Line,
  Area,
  AreaChart
} from 'recharts'

interface Asset {
  id: string
  name: string
  type: 'fixed' | 'current'
  category: string
  value: number
  acquisition_date: string
  depreciation_rate?: number
  description?: string
  status: 'active' | 'maintenance' | 'disposed'
  location?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
}

interface Liability {
  id: string
  name: string
  type: 'current' | 'long-term'
  amount: number
  due_date?: string
  interest_rate?: number
  description?: string
  status: 'active' | 'paid' | 'overdue'
  creditor?: string
}

interface AssetFormData {
  name: string
  type: 'fixed' | 'current'
  category: string
  value: number
  acquisition_date: string
  depreciation_rate?: number
  description?: string
  location?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
}

interface LiabilityFormData {
  name: string
  type: 'current' | 'long-term'
  amount: number
  due_date?: string
  interest_rate?: number
  description?: string
  creditor?: string
}

const Assets: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities' | 'analytics'>('assets')
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [showLiabilityForm, setShowLiabilityForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null)
  const [viewingItem, setViewingItem] = useState<Asset | Liability | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Sample data - in real app, this would come from Supabase
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: '1',
      name: 'PVC Pipe Manufacturing Machine',
      type: 'fixed',
      category: 'Machinery',
      value: 500000,
      acquisition_date: '2023-01-15',
      depreciation_rate: 10,
      description: 'High-capacity PVC pipe manufacturing equipment',
      status: 'active',
      location: 'Production Floor A',
      condition: 'excellent'
    },
    {
      id: '2',
      name: 'Raw Material Inventory',
      type: 'current',
      category: 'Inventory',
      value: 150000,
      acquisition_date: '2024-01-01',
      description: 'PVC resin and additives stock',
      status: 'active',
      location: 'Warehouse',
      condition: 'good'
    },
    {
      id: '3',
      name: 'Office Building',
      type: 'fixed',
      category: 'Real Estate',
      value: 2000000,
      acquisition_date: '2022-06-10',
      depreciation_rate: 2,
      description: 'Main office and administrative building',
      status: 'active',
      location: 'Main Campus',
      condition: 'excellent'
    },
    {
      id: '4',
      name: 'Cash in Bank',
      type: 'current',
      category: 'Cash',
      value: 75000,
      acquisition_date: '2024-01-01',
      description: 'Operating cash reserves',
      status: 'active',
      location: 'Bank Account',
      condition: 'excellent'
    },
    {
      id: '5',
      name: 'Delivery Trucks',
      type: 'fixed',
      category: 'Vehicles',
      value: 800000,
      acquisition_date: '2023-08-20',
      depreciation_rate: 15,
      description: 'Fleet of 4 delivery trucks',
      status: 'active',
      location: 'Vehicle Yard',
      condition: 'good'
    }
  ])

  const [liabilities, setLiabilities] = useState<Liability[]>([
    {
      id: '1',
      name: 'Equipment Loan',
      type: 'long-term',
      amount: 300000,
      due_date: '2027-01-15',
      interest_rate: 8.5,
      description: 'Loan for manufacturing equipment purchase',
      status: 'active',
      creditor: 'Industrial Bank'
    },
    {
      id: '2',
      name: 'Accounts Payable',
      type: 'current',
      amount: 45000,
      due_date: '2024-02-28',
      description: 'Outstanding supplier payments',
      status: 'active',
      creditor: 'Various Suppliers'
    },
    {
      id: '3',
      name: 'Business Credit Card',
      type: 'current',
      amount: 25000,
      interest_rate: 18,
      description: 'Corporate credit card balance',
      status: 'active',
      creditor: 'Commercial Bank'
    },
    {
      id: '4',
      name: 'Property Mortgage',
      type: 'long-term',
      amount: 1200000,
      due_date: '2035-06-10',
      interest_rate: 7.2,
      description: 'Mortgage on office building',
      status: 'active',
      creditor: 'Real Estate Finance'
    }
  ])

  const {
    register: registerAsset,
    handleSubmit: handleAssetSubmit,
    reset: resetAsset,
    setValue: setAssetValue,
    formState: { errors: assetErrors }
  } = useForm<AssetFormData>()

  const {
    register: registerLiability,
    handleSubmit: handleLiabilitySubmit,
    reset: resetLiability,
    setValue: setLiabilityValue,
    formState: { errors: liabilityErrors }
  } = useForm<LiabilityFormData>()

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const fixedAssets = assets.filter(a => a.type === 'fixed').reduce((sum, asset) => sum + asset.value, 0)
  const currentAssets = assets.filter(a => a.type === 'current').reduce((sum, asset) => sum + asset.value, 0)

  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const currentLiabilities = liabilities.filter(l => l.type === 'current').reduce((sum, liability) => sum + liability.amount, 0)
  const longTermLiabilities = liabilities.filter(l => l.type === 'long-term').reduce((sum, liability) => sum + liability.amount, 0)

  const netWorth = totalAssets - totalLiabilities
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0

  const assetCategories = [
    { name: 'Machinery', icon: '🏭', color: 'bg-blue-100 text-blue-800' },
    { name: 'Inventory', icon: '📦', color: 'bg-green-100 text-green-800' },
    { name: 'Real Estate', icon: '🏢', color: 'bg-purple-100 text-purple-800' },
    { name: 'Cash', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Equipment', icon: '⚙️', color: 'bg-indigo-100 text-indigo-800' },
    { name: 'Vehicles', icon: '🚛', color: 'bg-red-100 text-red-800' },
    { name: 'Other', icon: '📋', color: 'bg-gray-100 text-gray-800' }
  ]

  const getCategoryInfo = (categoryName: string) => {
    return assetCategories.find(cat => cat.name === categoryName) || assetCategories[assetCategories.length - 1]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'disposed': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || asset.type === filterType
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredLiabilities = liabilities.filter(liability => {
    const matchesSearch = liability.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || liability.type === filterType
    const matchesStatus = filterStatus === 'all' || liability.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Chart data
  const assetChartData = assetCategories.map(category => {
    const categoryAssets = assets.filter(asset => asset.category === category.name)
    const total = categoryAssets.reduce((sum, asset) => sum + asset.value, 0)
    return {
      name: category.name,
      value: total,
      count: categoryAssets.length
    }
  }).filter(item => item.value > 0)

  const financialHealthData = [
    { name: 'Assets', value: totalAssets, color: '#10B981' },
    { name: 'Liabilities', value: totalLiabilities, color: '#EF4444' },
    { name: 'Net Worth', value: netWorth, color: '#3B82F6' }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const onAssetSubmit = async (data: AssetFormData) => {
    const newAsset: Asset = {
      id: Date.now().toString(),
      ...data,
      value: Number(data.value),
      depreciation_rate: data.depreciation_rate ? Number(data.depreciation_rate) : undefined,
      status: 'active'
    }
    
    if (editingAsset) {
      setAssets(prev => prev.map(asset => asset.id === editingAsset.id ? { ...newAsset, id: editingAsset.id } : asset))
    } else {
      setAssets(prev => [...prev, newAsset])
    }
    
    setShowAssetForm(false)
    setEditingAsset(null)
    resetAsset()
  }

  const onLiabilitySubmit = async (data: LiabilityFormData) => {
    const newLiability: Liability = {
      id: Date.now().toString(),
      ...data,
      amount: Number(data.amount),
      interest_rate: data.interest_rate ? Number(data.interest_rate) : undefined,
      status: 'active'
    }
    
    if (editingLiability) {
      setLiabilities(prev => prev.map(liability => liability.id === editingLiability.id ? { ...newLiability, id: editingLiability.id } : liability))
    } else {
      setLiabilities(prev => [...prev, newLiability])
    }
    
    setShowLiabilityForm(false)
    setEditingLiability(null)
    resetLiability()
  }

  const startEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setAssetValue('name', asset.name)
    setAssetValue('type', asset.type)
    setAssetValue('category', asset.category)
    setAssetValue('value', asset.value)
    setAssetValue('acquisition_date', asset.acquisition_date)
    setAssetValue('depreciation_rate', asset.depreciation_rate)
    setAssetValue('description', asset.description)
    setAssetValue('location', asset.location)
    setAssetValue('condition', asset.condition)
    setShowAssetForm(true)
  }

  const startEditLiability = (liability: Liability) => {
    setEditingLiability(liability)
    setLiabilityValue('name', liability.name)
    setLiabilityValue('type', liability.type)
    setLiabilityValue('amount', liability.amount)
    setLiabilityValue('due_date', liability.due_date)
    setLiabilityValue('interest_rate', liability.interest_rate)
    setLiabilityValue('description', liability.description)
    setLiabilityValue('creditor', liability.creditor)
    setShowLiabilityForm(true)
  }

  const deleteAsset = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      setAssets(prev => prev.filter(asset => asset.id !== id))
    }
  }

  const deleteLiability = (id: string) => {
    if (confirm('Are you sure you want to delete this liability?')) {
      setLiabilities(prev => prev.filter(liability => liability.id !== id))
    }
  }

  const viewItem = (item: Asset | Liability) => {
    setViewingItem(item)
    setShowViewModal(true)
  }

  const duplicateAsset = (asset: Asset) => {
    setEditingAsset(null)
    setAssetValue('name', `${asset.name} (Copy)`)
    setAssetValue('type', asset.type)
    setAssetValue('category', asset.category)
    setAssetValue('value', asset.value)
    setAssetValue('acquisition_date', new Date().toISOString().split('T')[0])
    setAssetValue('depreciation_rate', asset.depreciation_rate)
    setAssetValue('description', asset.description)
    setAssetValue('location', asset.location)
    setAssetValue('condition', asset.condition)
    setShowAssetForm(true)
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets & Liabilities</h1>
          <p className="text-gray-600 mt-1">Manage your business assets and track liabilities</p>
        </div>
        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
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
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-5 w-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Total Assets</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+8.2%</span>
            <span className="text-green-600 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className="bg-red-200 p-3 rounded-xl">
              <TrendingDown className="h-6 w-6 text-red-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">-3.1%</span>
            <span className="text-green-600 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Net Worth</p>
              <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                {formatCurrency(netWorth)}
              </p>
            </div>
            <div className={`${netWorth >= 0 ? 'bg-blue-200' : 'bg-red-200'} p-3 rounded-xl`}>
              <Calculator className={`h-6 w-6 ${netWorth >= 0 ? 'text-blue-700' : 'text-red-700'}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Target className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-blue-600 font-medium">Equity Position</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Current Ratio</p>
              <p className="text-2xl font-bold text-purple-900">
                {currentRatio.toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <BarChart3 className="h-6 w-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              currentRatio >= 2 ? 'bg-green-100 text-green-800' :
              currentRatio >= 1 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentRatio >= 2 ? 'Excellent' : currentRatio >= 1 ? 'Good' : 'Poor'}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assets ({filteredAssets.length})
            </button>
            <button
              onClick={() => setActiveTab('liabilities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'liabilities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Liabilities ({filteredLiabilities.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Enhanced Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="fixed">Fixed</option>
                <option value="current">Current</option>
                <option value="long-term">Long-term</option>
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
                <option value="maintenance">Maintenance</option>
                <option value="disposed">Disposed</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <button
                onClick={() => activeTab === 'assets' ? setShowAssetForm(true) : setShowLiabilityForm(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add {activeTab === 'assets' ? 'Asset' : 'Liability'}
              </button>
            </div>
          </div>

          {activeTab === 'assets' ? (
            viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Asset Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Condition</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAssets.map((asset) => {
                      const categoryInfo = getCategoryInfo(asset.category)
                      return (
                        <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{asset.name}</div>
                              <div className="text-sm text-gray-600">{asset.location}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              asset.type === 'fixed' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {asset.type === 'fixed' ? 'Fixed' : 'Current'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryInfo.color}`}>
                              <span className="mr-1">{categoryInfo.icon}</span>
                              {asset.category}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-900">{formatCurrency(asset.value)}</div>
                            {asset.depreciation_rate && (
                              <div className="text-xs text-gray-500">Dep: {asset.depreciation_rate}%</div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(asset.condition)}`}>
                              {asset.condition}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => viewItem(asset)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => startEditAsset(asset)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => duplicateAsset(asset)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteAsset(asset.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => {
                  const categoryInfo = getCategoryInfo(asset.category)
                  return (
                    <div key={asset.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                            {categoryInfo.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                            <p className="text-sm text-gray-600">{asset.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button onClick={() => viewItem(asset)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => startEditAsset(asset)} className="p-1 text-gray-400 hover:text-green-600 rounded">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteAsset(asset.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryInfo.color}`}>
                            {asset.category}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                            {asset.status}
                          </span>
                        </div>

                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(asset.value)}</div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Condition:</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(asset.condition)}`}>
                            {asset.condition}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600">
                          Acquired: {new Date(asset.acquisition_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : activeTab === 'liabilities' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Liability Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Creditor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLiabilities.map((liability) => (
                    <tr key={liability.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{liability.name}</div>
                        {liability.interest_rate && (
                          <div className="text-sm text-gray-600">Interest: {liability.interest_rate}%</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          liability.type === 'current' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {liability.type === 'current' ? 'Current' : 'Long-term'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{formatCurrency(liability.amount)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900">{liability.creditor || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900">
                          {liability.due_date ? new Date(liability.due_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(liability.status)}`}>
                          {liability.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => viewItem(liability)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => startEditLiability(liability)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteLiability(liability.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Asset Distribution Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Asset Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={assetChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Value']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              {/* Financial Health Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Financial Health</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialHealthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Amount']} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asset Form Modal */}
      {showAssetForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
              </h2>
            </div>

            <form onSubmit={handleAssetSubmit(onAssetSubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                  <input
                    {...registerAsset('name', { required: 'Asset name is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter asset name"
                  />
                  {assetErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{assetErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    {...registerAsset('type', { required: 'Type is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="fixed">Fixed Asset</option>
                    <option value="current">Current Asset</option>
                  </select>
                  {assetErrors.type && (
                    <p className="mt-1 text-sm text-red-600">{assetErrors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    {...registerAsset('category', { required: 'Category is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    {assetCategories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {assetErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{assetErrors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Value (₹) *</label>
                  <input
                    {...registerAsset('value', { 
                      required: 'Value is required',
                      min: { value: 0, message: 'Value must be positive' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  {assetErrors.value && (
                    <p className="mt-1 text-sm text-red-600">{assetErrors.value.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Acquisition Date *</label>
                  <input
                    {...registerAsset('acquisition_date', { required: 'Acquisition date is required' })}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {assetErrors.acquisition_date && (
                    <p className="mt-1 text-sm text-red-600">{assetErrors.acquisition_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depreciation Rate (%)</label>
                  <input
                    {...registerAsset('depreciation_rate')}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    {...registerAsset('location')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Asset location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                  <select
                    {...registerAsset('condition', { required: 'Condition is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select condition</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                  {assetErrors.condition && (
                    <p className="mt-1 text-sm text-red-600">{assetErrors.condition.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  {...registerAsset('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter asset description"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssetForm(false)
                    setEditingAsset(null)
                    resetAsset()
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                >
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liability Form Modal */}
      {showLiabilityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingLiability ? 'Edit Liability' : 'Add New Liability'}
              </h2>
            </div>

            <form onSubmit={handleLiabilitySubmit(onLiabilitySubmit)} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Liability Name *</label>
                  <input
                    {...registerLiability('name', { required: 'Liability name is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter liability name"
                  />
                  {liabilityErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{liabilityErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    {...registerLiability('type', { required: 'Type is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select type</option>
                    <option value="current">Current Liability</option>
                    <option value="long-term">Long-term Liability</option>
                  </select>
                  {liabilityErrors.type && (
                    <p className="mt-1 text-sm text-red-600">{liabilityErrors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                  <input
                    {...registerLiability('amount', { 
                      required: 'Amount is required',
                      min: { value: 0, message: 'Amount must be positive' }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                  />
                  {liabilityErrors.amount && (
                    <p className="mt-1 text-sm text-red-600">{liabilityErrors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Creditor</label>
                  <input
                    {...registerLiability('creditor')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Creditor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    {...registerLiability('due_date')}
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                  <input
                    {...registerLiability('interest_rate')}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  {...registerLiability('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter liability description"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowLiabilityForm(false)
                    setEditingLiability(null)
                    resetLiability()
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                >
                  {editingLiability ? 'Update Liability' : 'Add Liability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {'type' in viewingItem ? 'Asset Details' : 'Liability Details'}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{viewingItem.name}</p>
                </div>

                {'type' in viewingItem ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-gray-900 capitalize">{viewingItem.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-gray-900">{(viewingItem as Asset).category}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Value</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency((viewingItem as Asset).value)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condition</label>
                      <p className="mt-1 text-gray-900 capitalize">{(viewingItem as Asset).condition}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="mt-1 text-gray-900">{(viewingItem as Asset).location || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Acquisition Date</label>
                      <p className="mt-1 text-gray-900">{new Date((viewingItem as Asset).acquisition_date).toLocaleDateString()}</p>
                    </div>
                    {(viewingItem as Asset).depreciation_rate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Depreciation Rate</label>
                        <p className="mt-1 text-gray-900">{(viewingItem as Asset).depreciation_rate}% per year</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-gray-900 capitalize">{(viewingItem as Liability).type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency((viewingItem as Liability).amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Creditor</label>
                      <p className="mt-1 text-gray-900">{(viewingItem as Liability).creditor || 'N/A'}</p>
                    </div>
                    {(viewingItem as Liability).due_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <p className="mt-1 text-gray-900">{new Date((viewingItem as Liability).due_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {(viewingItem as Liability).interest_rate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                        <p className="mt-1 text-gray-900">{(viewingItem as Liability).interest_rate}% per year</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {viewingItem.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900">{viewingItem.description}</p>
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assets