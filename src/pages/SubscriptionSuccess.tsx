import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowRight, Crown, Loader2 } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refetch, getActiveProduct, loading } = useSubscription()
  const [isRefetching, setIsRefetching] = useState(true)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Refetch subscription data to get the latest status
    const refreshData = async () => {
      try {
        await refetch()
      } catch (error) {
        console.error('Error refreshing subscription data:', error)
      } finally {
        setIsRefetching(false)
      }
    }

    // Add a small delay to ensure webhook has processed
    const timer = setTimeout(refreshData, 2000)
    return () => clearTimeout(timer)
  }, [refetch])

  const activeProduct = getActiveProduct()

  if (loading || isRefetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your subscription...</h2>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your subscription. Your account has been upgraded successfully.
          </p>

          {/* Subscription Details */}
          {activeProduct && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-900">{activeProduct.name} Plan</span>
              </div>
              <p className="text-sm text-blue-700">{activeProduct.description}</p>
            </div>
          )}

          {/* Session ID (for reference) */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
              <p className="text-sm font-mono text-gray-700 break-all">{sessionId}</p>
            </div>
          )}

          {/* What's Next */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What's next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Your subscription is now active</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Access to all premium features</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Priority customer support</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>You'll receive an email confirmation shortly</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/subscription')}
              className="w-full px-6 py-3 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              Manage Subscription
            </button>
          </div>

          {/* Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@burhaniaccounts.com" className="text-blue-600 hover:text-blue-700">
                support@burhaniaccounts.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionSuccess