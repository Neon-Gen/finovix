import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X,
  Download,
  FileText,
  CreditCard,
  Users,
  Calendar,
  Building2,
  Trash2,
  Edit,
  Plus,
  Eye,
  Copy,
  Upload,
  Settings,
  Shield,
  Bell
} from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  action?: string
  category?: 'bill' | 'expense' | 'employee' | 'attendance' | 'asset' | 'liability' | 'system' | 'security'
  duration?: number
  persistent?: boolean
  actionUrl?: string
  actionText?: string
  timestamp: Date
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  showSuccess: (title: string, message: string, options?: Partial<Notification>) => void
  showError: (title: string, message: string, options?: Partial<Notification>) => void
  showWarning: (title: string, message: string, options?: Partial<Notification>) => void
  showInfo: (title: string, message: string, options?: Partial<Notification>) => void
  // Specific action notifications
  showCreateSuccess: (entity: string, name: string, options?: Partial<Notification>) => void
  showUpdateSuccess: (entity: string, name: string, options?: Partial<Notification>) => void
  showDeleteSuccess: (entity: string, name: string, options?: Partial<Notification>) => void
  showDownloadSuccess: (fileName: string, options?: Partial<Notification>) => void
  showStatusChange: (entity: string, name: string, status: string, options?: Partial<Notification>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const getIconForType = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'warning':
      return AlertCircle
    case 'info':
    default:
      return Info
  }
}

const getIconForCategory = (category?: Notification['category']) => {
  switch (category) {
    case 'bill':
      return FileText
    case 'expense':
      return CreditCard
    case 'employee':
      return Users
    case 'attendance':
      return Calendar
    case 'asset':
    case 'liability':
      return Building2
    case 'security':
      return Shield
    case 'system':
    default:
      return Bell
  }
}

const getColorClasses = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50 border-green-200',
        icon: 'text-green-600',
        title: 'text-green-900',
        message: 'text-green-700',
        button: 'text-green-600 hover:text-green-800'
      }
    case 'error':
      return {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
        message: 'text-red-700',
        button: 'text-red-600 hover:text-red-800'
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        message: 'text-yellow-700',
        button: 'text-yellow-600 hover:text-yellow-800'
      }
    case 'info':
    default:
      return {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
        message: 'text-blue-700',
        button: 'text-blue-600 hover:text-blue-800'
      }
  }
}

const NotificationToast: React.FC<{
  notification: Notification
  onRemove: (id: string) => void
}> = ({ notification, onRemove }) => {
  const Icon = getIconForType(notification.type)
  const CategoryIcon = getIconForCategory(notification.category)
  const colors = getColorClasses(notification.type)

  React.useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, notification.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [notification.id, notification.duration, notification.persistent, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`max-w-sm w-full ${colors.bg} border rounded-2xl shadow-lg pointer-events-auto overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${colors.icon}`} />
            {notification.category && (
              <CategoryIcon className={`h-4 w-4 ${colors.icon} opacity-70`} />
            )}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${colors.title}`}>
              {notification.title}
            </p>
            <p className={`mt-1 text-sm ${colors.message}`}>
              {notification.message}
            </p>
            {notification.actionUrl && notification.actionText && (
              <div className="mt-3">
                <a
                  href={notification.actionUrl}
                  className={`text-sm font-medium ${colors.button} hover:underline`}
                >
                  {notification.actionText}
                </a>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex ${colors.button} hover:bg-white hover:bg-opacity-20 rounded-full p-1.5 transition-colors`}
              onClick={() => onRemove(notification.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {!notification.persistent && notification.duration !== 0 && (
        <motion.div
          className={`h-1 ${colors.icon.replace('text-', 'bg-')} opacity-30`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (notification.duration || 5000) / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  )
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? 5000
    }
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]) // Keep max 5 notifications
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'success', title, message, ...options })
  }, [addNotification])

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'error', title, message, duration: 8000, ...options })
  }, [addNotification])

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'warning', title, message, duration: 6000, ...options })
  }, [addNotification])

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>) => {
    addNotification({ type: 'info', title, message, ...options })
  }, [addNotification])

  // Specific action notifications
  const showCreateSuccess = useCallback((entity: string, name: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title: `${entity} Created`,
      message: `${name} has been successfully created`,
      action: 'create',
      ...options
    })
  }, [addNotification])

  const showUpdateSuccess = useCallback((entity: string, name: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title: `${entity} Updated`,
      message: `${name} has been successfully updated`,
      action: 'update',
      ...options
    })
  }, [addNotification])

  const showDeleteSuccess = useCallback((entity: string, name: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title: `${entity} Deleted`,
      message: `${name} has been successfully deleted`,
      action: 'delete',
      ...options
    })
  }, [addNotification])

  const showDownloadSuccess = useCallback((fileName: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'success',
      title: 'Download Complete',
      message: `${fileName} has been downloaded successfully`,
      action: 'download',
      ...options
    })
  }, [addNotification])

  const showStatusChange = useCallback((entity: string, name: string, status: string, options?: Partial<Notification>) => {
    addNotification({
      type: 'info',
      title: `${entity} Status Changed`,
      message: `${name} status changed to ${status}`,
      action: 'status_change',
      ...options
    })
  }, [addNotification])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCreateSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showDownloadSuccess,
    showStatusChange
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}