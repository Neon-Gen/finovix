import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  Book, 
  Settings, 
  Shield, 
  Bell,
  Minimize2,
  Maximize2,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  category?: 'help' | 'guide' | 'support'
  helpful?: boolean
}

interface ChatCategory {
  id: string
  name: string
  icon: React.ReactNode
  description: string
}

const LiveChart: React.FC = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('help')
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const categories: ChatCategory[] = [
    {
      id: 'help',
      name: 'Help',
      icon: <HelpCircle className="h-4 w-4" />,
      description: 'Get help with features and functionality'
    },
    {
      id: 'guide',
      name: 'User Guide',
      icon: <Book className="h-4 w-4" />,
      description: 'Learn how to use the application'
    },
    {
      id: 'support',
      name: 'Support',
      icon: <Settings className="h-4 w-4" />,
      description: 'Technical support and troubleshooting'
    }
  ]

  const helpResponses = {
    help: {
      'how to create bill': 'To create a bill: 1) Go to Bills page, 2) Click "Create Bill", 3) Fill customer details, 4) Add items with quantities and rates, 5) Review totals and save.',
      'add employee': 'To add an employee: 1) Navigate to Employees page, 2) Click "Add Employee", 3) Fill in personal details, 4) Set hourly and overtime rates, 5) Assign department and position.',
      'track expenses': 'To track expenses: 1) Go to Expenses page, 2) Click "Add Expense", 3) Enter description and amount, 4) Select category, 5) Set date and save.',
      'attendance': 'To mark attendance: 1) Go to Attendance page, 2) Click "Mark Attendance", 3) Select employee, 4) Set check-in and check-out times, 5) Save record.',
      'mark absent': 'To mark an employee as absent: 1) Go to Attendance page, 2) Find the employee in the "Employees Without Attendance" section, 3) Click the "Mark Absent" button (user with X icon), or 4) Use "Mark Attendance" and select "Absent" status.',
      'reports': 'Access reports from the Reports page. You can generate financial reports, tax summaries, payroll reports, and export data in PDF or Excel format.',
      'settings': 'Customize your experience in Settings: Update profile, company info, notification preferences, security settings, and app preferences.',
      'cashbook': 'Access the Cashbook by clicking the book icon in the header. Track cash inflows and outflows, categorize transactions, and view financial summaries.'
    },
    guide: {
      'getting started': 'Welcome to Burhani Accounts! Start by: 1) Setting up your company profile in Settings, 2) Adding your employees, 3) Creating your first bill, 4) Recording expenses.',
      'dashboard overview': 'The dashboard shows: Revenue and expense summaries, recent bills and expenses, quick action buttons, and business insights with charts.',
      'navigation': 'Use the sidebar to navigate between: Dashboard, Bills, Expenses, Assets, Employees, Attendance, Reports, and Settings.',
      'data export': 'Export your data: Each page has export buttons for PDF and Excel formats. Go to Reports for comprehensive business reports.',
      'security features': 'Your account includes: Leaked password protection, email verification, session management, and audit logging for security.',
      'notifications': 'Manage notifications in Settings: Email alerts, push notifications, bill reminders, payment alerts, and report preferences.',
      'attendance management': 'Attendance features: Mark present/absent, track hours, calculate overtime, generate payroll reports, and manage employee schedules.'
    },
    support: {
      'login issues': 'If you cannot log in: 1) Check your email and password, 2) Ensure email is verified, 3) Try password reset, 4) Contact support if issues persist.',
      'data not loading': 'If data is not loading: 1) Refresh the page, 2) Check internet connection, 3) Clear browser cache, 4) Try logging out and back in.',
      'export problems': 'If exports are not working: 1) Ensure you have data to export, 2) Check browser popup blockers, 3) Try different export format.',
      'performance issues': 'For slow performance: 1) Close other browser tabs, 2) Clear browser cache, 3) Check internet speed, 4) Try incognito mode.',
      'billing questions': 'For subscription questions: 1) Check your plan in Settings, 2) View billing history, 3) Contact support for plan changes.',
      'security concerns': 'For security issues: 1) Change your password immediately, 2) Review recent login activity in Settings, 3) Enable two-factor authentication.',
      'forgot password': 'To reset your password: 1) Click "Forgot Password" on login page, 2) Enter your email, 3) Enter the 7-digit verification code sent to your email, 4) Create a new password.'
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    // Add welcome message when chat opens for the first time
    if (isOpen && messages.length === 0) {
      addBotMessage(
        `Hello ${user?.user_metadata?.full_name || 'there'}! 👋 I'm your AI assistant. I can help you with:\n\n• How to use features\n• Step-by-step guides\n• Troubleshooting\n• General questions\n\nWhat would you like to know?`,
        'help'
      )
    }
  }, [isOpen, messages.length, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addBotMessage = (content: string, category: string = 'help') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      category: category as any
    }
    setMessages(prev => [...prev, newMessage])
    if (!isOpen) {
      setUnreadCount(prev => prev + 1)
    }
  }

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const getBotResponse = (userInput: string, category: string) => {
    const input = userInput.toLowerCase()
    const responses = helpResponses[category as keyof typeof helpResponses] || helpResponses.help

    // Find matching response
    for (const [key, response] of Object.entries(responses)) {
      if (input.includes(key) || key.split(' ').some(word => input.includes(word))) {
        return response
      }
    }

    // Default responses by category
    const defaultResponses = {
      help: "I'd be happy to help! You can ask me about:\n• Creating bills and invoices\n• Managing employees\n• Tracking expenses\n• Attendance management\n• Generating reports\n• Account settings\n• Using the cashbook\n\nTry asking something like 'how to create bill' or 'mark absent'.",
      guide: "Here are some helpful guides:\n• Getting started with the app\n• Dashboard overview\n• Navigation tips\n• Data export options\n• Security features\n• Notification settings\n• Attendance management\n\nAsk me about any of these topics!",
      support: "I can help with technical issues:\n• Login problems\n• Data loading issues\n• Export problems\n• Performance issues\n• Billing questions\n• Security concerns\n• Password reset\n\nDescribe your issue and I'll provide specific help."
    }

    return defaultResponses[category as keyof typeof defaultResponses] || defaultResponses.help
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    addUserMessage(inputValue)
    setIsTyping(true)

    // Simulate bot typing delay
    setTimeout(() => {
      const response = getBotResponse(inputValue, selectedCategory)
      addBotMessage(response, selectedCategory)
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)

    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const markMessageHelpful = (messageId: string, helpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, helpful } : msg
    ))
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    // You could add a toast notification here
  }

  const clearChat = () => {
    setMessages([])
    addBotMessage(
      `Chat cleared! How can I help you today?`,
      selectedCategory
    )
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setUnreadCount(0)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="bg-black hover:bg-gray-800 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 relative"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-black rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Assistant</h3>
              <p className="text-xs text-gray-300">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-white text-black border-b-2 border-black'
                      : 'text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
                  title={category.description}
                >
                  <div className="flex items-center justify-center space-x-1">
                    {category.icon}
                    <span>{category.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className={`flex items-center mt-1 space-x-2 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.type === 'bot' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy message"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => markMessageHelpful(message.id, true)}
                            className={`p-1 ${
                              message.helpful === true ? 'text-black' : 'text-gray-400 hover:text-black'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => markMessageHelpful(message.id, false)}
                            className={`p-1 ${
                              message.helpful === false ? 'text-black' : 'text-gray-400 hover:text-black'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-end ${message.type === 'user' ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-end space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={clearChat}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Clear chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <div className="text-xs text-gray-500">
                  Ask me anything about {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()}
                </div>
              </div>
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LiveChart