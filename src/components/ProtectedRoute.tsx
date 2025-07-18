import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

const LoadingSkeleton = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-white"
  >
    <div className="flex h-screen">
      {/* Sidebar Skeleton */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="hidden lg:flex flex-col w-72 bg-black p-6 space-y-6"
      >
        {/* Logo Skeleton */}
        <motion.div 
          whileHover={{ scale: 1.05 }} 
          className="w-40 h-10 bg-white/20 mb-2 rounded-xl animate-pulse"
        />
        
        {/* Navigation Items Skeleton */}
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: -50 }}
              animate={{ x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="w-full h-12 bg-white/20 rounded-full animate-pulse"
            />
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-black/10 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              {/* Search Bar Skeleton */}
              <motion.div 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                whileHover={{ scale: 1.05 }}
                className="w-60 h-10 bg-gray-200 rounded-full animate-pulse"
              />
              
              <div className="flex items-center space-x-4">
                {/* Action Buttons */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"
                />
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"
                />
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"
                />
                
                {/* User Avatar Skeleton */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="h-10 w-40 bg-gray-200 rounded-full animate-pulse"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Rest of the content remains the same */}
            {/* Welcome Header Skeleton */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-black to-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden animate-pulse"
            >
              {/* Welcome Header content remains the same */}
              <motion.div 
                animate={{ 
                  opacity: [0.1, 0.2, 0.1],
                  scale: [1, 1.1, 1]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-black"
              />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"
              />
              <motion.div 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="relative z-10"
              >
                <motion.div whileHover={{ scale: 1.05 }} className="h-10 w-3/4 bg-white/10 rounded-lg mb-4" />
                <motion.div whileHover={{ scale: 1.05 }} className="h-6 w-1/2 bg-white/10 rounded-lg mb-4" />
                <motion.div className="flex gap-4">
                  <motion.div whileHover={{ scale: 1.1 }} className="h-8 w-32 bg-white/10 rounded-full" />
                  <motion.div whileHover={{ scale: 1.1 }} className="h-8 w-32 bg-white/10 rounded-full" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Stats Grid Skeleton */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200 shadow-md animate-pulse"
                >
                  <motion.div className="flex justify-between items-center mb-4">
                    <motion.div whileHover={{ scale: 1.1 }} className="h-5 w-24 bg-gray-200 rounded-lg" />
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="bg-black p-4 rounded-2xl"
                    >
                      <motion.div className="h-6 w-6 bg-white/20 rounded" />
                    </motion.div>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} className="h-8 w-32 bg-gray-200 rounded-lg mb-4" />
                  <motion.div className="flex items-center gap-2 mb-4">
                    <motion.div whileHover={{ scale: 1.2 }} className="h-4 w-4 bg-gray-200 rounded" />
                    <motion.div whileHover={{ scale: 1.05 }} className="h-4 w-20 bg-gray-200 rounded-lg" />
                    <motion.div whileHover={{ scale: 1.05 }} className="h-4 w-32 bg-gray-200 rounded-lg" />
                  </motion.div>
                  <motion.div className="h-2 w-full bg-gray-200 rounded-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1 }}
                      className="h-2 bg-black rounded-full" 
                    />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Actions Skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200 shadow-lg animate-pulse"
            >
              <motion.div className="flex items-center gap-2 mb-6">
                <motion.div whileHover={{ rotate: 360 }} className="h-6 w-6 bg-gray-200 rounded" />
                <motion.div whileHover={{ scale: 1.05 }} className="h-6 w-48 bg-gray-200 rounded-lg" />
              </motion.div>
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className="bg-white rounded-3xl p-6 border border-gray-200 hover:shadow-md transition-all"
                  >
                    <motion.div className="flex flex-col items-center space-y-3">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="bg-black p-4 rounded-2xl"
                      >
                        <motion.div className="h-8 w-8 bg-white/20 rounded" />
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.1 }} className="h-4 w-20 bg-gray-200 rounded-lg" />
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Charts Skeleton */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 border border-gray-200 shadow-lg animate-pulse"
                >
                  <motion.div className="flex items-center justify-between mb-6">
                    <motion.div whileHover={{ scale: 1.05 }} className="h-6 w-48 bg-gray-200 rounded-lg" />
                    <motion.div whileHover={{ scale: 1.05 }} className="h-6 w-24 bg-gray-200 rounded-lg" />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-6 rounded-2xl"
                  >
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 350 }}
                      transition={{ duration: 1 }}
                      className="bg-gray-200 rounded-2xl" 
                    />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  </motion.div>
)

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = "/login" 
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [showSkeleton, setShowSkeleton] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (loading || showSkeleton) {
    return <LoadingSkeleton />
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export default React.memo(ProtectedRoute)
