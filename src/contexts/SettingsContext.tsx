import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { useNotifications } from './NotificationContext'
import { supabase } from '../lib/supabase'

interface UserSettings {
  // Profile settings
  full_name: string
  email: string
  phone: string
  avatar_url?: string
  
  // Company settings
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  company_website: string
  tax_number: string
  
  // Notification settings
  email_notifications: boolean
  push_notifications: boolean
  bill_reminders: boolean
  payment_alerts: boolean
  expense_alerts: boolean
  weekly_reports: boolean
  monthly_reports: boolean
  
  // Privacy settings
  data_sharing: boolean
  analytics_tracking: boolean
  marketing_emails: boolean
  two_factor_auth: boolean
  
  auto_logout_enabled: boolean
  // App preferences
  currency: string
  date_format: string
  time_format: string
  language: string
  timezone: string
  default_tax_rate: number
}

interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
  updateSettings: (updates: Partial<UserSettings>) => Promise<boolean>
  resetSettings: () => Promise<boolean>
  exportData: () => Promise<void>
  deleteAccount: () => Promise<boolean>
}

const defaultSettings: UserSettings = {
  full_name: '',
  email: '',
  phone: '',
  company_name: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_website: '',
  tax_number: '',
  email_notifications: true,
  push_notifications: true,
  bill_reminders: true,
  payment_alerts: true,
  expense_alerts: true,
  weekly_reports: false,
  monthly_reports: true,
  data_sharing: false,
  analytics_tracking: true,
  marketing_emails: false,
  two_factor_auth: false,
  auto_logout_enabled: true,
  currency: 'INR',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  language: 'en',
  timezone: 'Asia/Kolkata',
  default_tax_rate: 18
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const { showSuccess, showError, showDownloadSuccess } = useNotifications()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      setSettings(null)
      setLoading(false)
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Try to load existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
      }

      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
          full_name: user.user_metadata?.full_name || data.full_name || '',
          email: user.email || data.email || '',
          company_name: user.user_metadata?.company_name || data.company_name || ''
        })
      } else {
        // Create default settings
        const newSettings = {
          ...defaultSettings,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          company_name: user.user_metadata?.company_name || ''
        }
        
        await createDefaultSettings(newSettings)
        setSettings(newSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setSettings(defaultSettings)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultSettings = async (newSettings: UserSettings) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...newSettings
        })

      if (error) {
        console.error('Error creating default settings:', error)
      }
    } catch (error) {
      console.error('Error creating default settings:', error)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>): Promise<boolean> => {
    if (!user || !settings) return false

    try {
      const updatedSettings = { ...settings, ...updates }
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings
        })

      if (error) {
        console.error('Error updating settings:', error)
        showError('Settings Update Failed', 'Failed to save settings. Please try again.')
        return false
      }

      setSettings(updatedSettings)
      showSuccess('Settings Updated', 'Your settings have been saved successfully', { category: 'system' })
      return true
    } catch (error) {
      console.error('Error updating settings:', error)
      showError('Settings Update Failed', 'An unexpected error occurred while saving settings.')
      return false
    }
  }

  const resetSettings = async (): Promise<boolean> => {
    if (!user) return false

    try {
      const resetSettings = {
        ...defaultSettings,
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
        company_name: user.user_metadata?.company_name || ''
      }

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...resetSettings
        })

      if (error) {
        console.error('Error resetting settings:', error)
        showError('Settings Reset Failed', 'Failed to reset settings. Please try again.')
        return false
      }

      setSettings(resetSettings)
      showSuccess('Settings Reset', 'Settings have been reset to default values', { category: 'system' })
      return true
    } catch (error) {
      console.error('Error resetting settings:', error)
      showError('Settings Reset Failed', 'An unexpected error occurred while resetting settings.')
      return false
    }
  }

  const exportData = async (): Promise<void> => {
    if (!user) return

    try {
      // Fetch all user data
      const [billsResult, expensesResult, employeesResult] = await Promise.all([
        supabase.from('bills').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('employees').select('*').eq('user_id', user.id)
      ])

      const exportData = {
        user_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        settings: settings,
        bills: billsResult.data || [],
        expenses: expensesResult.data || [],
        employees: employeesResult.data || [],
        exported_at: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `burhani-accounts-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showDownloadSuccess('Complete Data Export', { category: 'system' })
    } catch (error) {
      console.error('Error exporting data:', error)
      showError('Export Failed', 'Failed to export data. Please try again.')
      throw error
    }
  }

  const deleteAccount = async (): Promise<boolean> => {
    if (!user) return false

    try {
      // Delete all user data
      await Promise.all([
        supabase.from('bills').delete().eq('user_id', user.id),
        supabase.from('expenses').delete().eq('user_id', user.id),
        supabase.from('employees').delete().eq('user_id', user.id),
        supabase.from('user_settings').delete().eq('user_id', user.id)
      ])

      // Note: Actual user account deletion would require admin privileges
      // This would typically be handled by a server-side function
      console.log('User data deleted. Account deletion requires admin action.')
      showSuccess('Account Data Deleted', 'Your account data has been removed from our systems', { category: 'security' })
      return true
    } catch (error) {
      console.error('Error deleting account:', error)
      showError('Account Deletion Failed', 'Failed to delete account data. Please contact support.')
      return false
    }
  }

  const value = {
    settings,
    loading,
    updateSettings,
    resetSettings,
    exportData,
    deleteAccount
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}