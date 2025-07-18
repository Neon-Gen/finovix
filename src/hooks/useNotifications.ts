import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  category: 'bill' | 'expense' | 'employee' | 'attendance' | 'system' | 'security'
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionText?: string
}

export const useNotifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Generate sample notifications
  const generateSampleNotifications = useCallback((): Notification[] => {
    const now = new Date()
    return [
      {
        id: '1',
        type: 'success',
        title: 'Payment Received',
        message: 'Payment of ₹25,000 received from ABC Corp for Invoice #INV-001',
        category: 'bill',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        actionUrl: '/bills',
        actionText: 'View Bill'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Bill Overdue',
        message: 'Invoice #INV-002 for XYZ Ltd is now 5 days overdue',
        category: 'bill',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionUrl: '/bills',
        actionText: 'View Bill'
      },
      {
        id: '3',
        type: 'info',
        title: 'New Employee Added',
        message: 'John Doe has been successfully added to the Production team',
        category: 'employee',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        actionUrl: '/employees',
        actionText: 'View Employee'
      },
      {
        id: '4',
        type: 'warning',
        title: 'Expense Budget Alert',
        message: 'Raw Materials expenses have exceeded 80% of monthly budget',
        category: 'expense',
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: false,
        actionUrl: '/expenses',
        actionText: 'View Expenses'
      },
      {
        id: '5',
        type: 'info',
        title: 'Monthly Report Ready',
        message: 'Your November financial report is now available for download',
        category: 'system',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        actionUrl: '/reports',
        actionText: 'View Reports'
      },
      {
        id: '6',
        type: 'success',
        title: 'Attendance Marked',
        message: 'Attendance has been successfully recorded for 15 employees today',
        category: 'attendance',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: true,
        actionUrl: '/attendance',
        actionText: 'View Attendance'
      },
      {
        id: '7',
        type: 'error',
        title: 'Failed Login Attempt',
        message: 'Multiple failed login attempts detected from IP 192.168.1.100',
        category: 'security',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: false,
        actionUrl: '/settings',
        actionText: 'View Security'
      },
      {
        id: '8',
        type: 'info',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM',
        category: 'system',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        read: true
      }
    ]
  }, [])

  useEffect(() => {
    if (user) {
      // In a real app, this would fetch from the backend
      const sampleNotifications = generateSampleNotifications()
      setNotifications(sampleNotifications)
      setLoading(false)
    }
  }, [user, generateSampleNotifications])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  const getNotificationsByCategory = useCallback((category: string) => {
    return notifications.filter(n => n.category === category)
  }, [notifications])

  const getRecentNotifications = useCallback((limit: number = 5) => {
    return notifications.slice(0, limit)
  }, [notifications])

  // Auto-generate notifications for demo purposes
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      const randomNotifications = [
        {
          type: 'info' as const,
          title: 'New Bill Created',
          message: `Bill #BILL-${Date.now()} has been created successfully`,
          category: 'bill' as const
        },
        {
          type: 'success' as const,
          title: 'Expense Recorded',
          message: 'New expense has been added to your records',
          category: 'expense' as const
        },
        {
          type: 'warning' as const,
          title: 'Attendance Reminder',
          message: 'Don\'t forget to mark attendance for today',
          category: 'attendance' as const
        }
      ]

      // Randomly add a notification every 30 seconds (for demo)
      if (Math.random() > 0.7) {
        const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
        addNotification(randomNotification)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [user, addNotification])

  return {
    notifications,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    getNotificationsByCategory,
    getRecentNotifications
  }
}