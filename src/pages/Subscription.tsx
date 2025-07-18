import React, { useState } from 'react'
import {
  Crown,
  Check,
  X,
  CreditCard,
  Smartphone,
  Shield,
  Zap,
  Users,
  FileText,
  BarChart3,
  Clock,
  Loader2
} from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'
import { products } from '../stripe-config'
import CheckoutButton from '../components/CheckoutButton'
import SubscriptionStatus from '../components/SubscriptionStatus'

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  limitations: string[]
  popular?: boolean
  current?: boolean
  priceId?: string
  mode?: 'payment' | 'subscription'
}

const Subscription: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { subscription, loading: subscriptionLoading, isActive, getActiveProduct } = useSubscription()

  const activeProduct = getActiveProduct()

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: [
        'Up to 50 bills per month',
        'Basic expense tracking',
        'Up to 5 employees',
        'Basic reports',
        'Email support'
      ],
      limitations: [
        'Limited to 50 bills/month',
        'No advanced analytics',
        'No API access',
        'Basic templates only'
      ],
      current: !activeProduct && !subscriptionLoading
    },
    ...products.map(product => ({
      id: product.id,
      name: product.name,
      price: billingCycle === 'monthly' ? 999 : 9990,
      period: billingCycle === 'monthly' ? '/month' : '/year',
      description: product.description,
      features: [
        'Unlimited bills',
        'Advanced expense tracking',
        'Up to 25 employees',
        'Advanced reports & analytics',
        'Priority email support',
        'Custom templates',
        'Inventory management',
        'GST compliance'
      ],
      limitations: [
        'Limited to 25 employees',
        'No API access',
        'Standard integrations only'
      ],
      popular: true,
      current: activeProduct?.id === product.id && isActive(),
      priceId: product.priceId,
      mode: product.mode
    }))
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price)
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
            <Crown className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto mb-4">
          Select the perfect plan for your PVC pipe manufacturing business. 
          Upgrade or downgrade at any time with no hidden fees.
        </p>
        
        {/* Current Subscription Status */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2">
            <SubscriptionStatus />
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
              plan.popular
                ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
                : plan.current
                ? 'border-green-500'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {plan.current && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    Save {formatPrice(plan.price * 12 * 0.17)} per year
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    What's included:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <X className="h-5 w-5 text-red-500 mr-2" />
                      Limitations:
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start">
                          <X className="h-4 w-4 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {plan.current ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : plan.priceId && plan.mode ? (
                <CheckoutButton
                  priceId={plan.priceId}
                  mode={plan.mode}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Upgrade Now
                </CheckoutButton>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                >
                  {plan.price === 0 ? 'Current Plan' : 'Contact Sales'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Basic</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 px-6 flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  Bills per month
                </td>
                <td className="text-center py-4 px-6">50</td>
                <td className="text-center py-4 px-6">Unlimited</td>
              </tr>
              <tr>
                <td className="py-4 px-6 flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  Employees
                </td>
                <td className="text-center py-4 px-6">5</td>
                <td className="text-center py-4 px-6">25</td>
              </tr>
              <tr>
                <td className="py-4 px-6 flex items-center">
                  <BarChart3 className="h-5 w-5 text-gray-400 mr-3" />
                  Advanced Analytics
                </td>
                <td className="text-center py-4 px-6">
                  <X className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="text-center py-4 px-6">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
              <tr>
                <td className="py-4 px-6 flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  Priority Support
                </td>
                <td className="text-center py-4 px-6">
                  <X className="h-5 w-5 text-red-500 mx-auto" />
                </td>
                <td className="text-center py-4 px-6">
                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-blue-900 text-center mb-2">
          Secure Payment Processing
        </h3>
        <p className="text-blue-700 text-center text-sm">
          All payments are processed securely through Stripe. Your payment information is encrypted 
          and never stored on our servers. We support all major credit cards and UPI payments.
        </p>
      </div>
    </div>
  )
}

export default Subscription