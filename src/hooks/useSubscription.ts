import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getProductByPriceId } from '../stripe-config'

interface Subscription {
  customer_id: string
  subscription_id: string | null
  subscription_status: string
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export const useSubscription = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError)
        setError('Failed to fetch subscription data')
        return
      }

      setSubscription(data)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getActiveProduct = () => {
    if (!subscription?.price_id) return null
    return getProductByPriceId(subscription.price_id)
  }

  const isActive = () => {
    return subscription?.subscription_status === 'active'
  }

  const isTrialing = () => {
    return subscription?.subscription_status === 'trialing'
  }

  const isCanceled = () => {
    return subscription?.subscription_status === 'canceled'
  }

  const isPastDue = () => {
    return subscription?.subscription_status === 'past_due'
  }

  const getCurrentPeriodEnd = () => {
    if (!subscription?.current_period_end) return null
    return new Date(subscription.current_period_end * 1000)
  }

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    getActiveProduct,
    isActive,
    isTrialing,
    isCanceled,
    isPastDue,
    getCurrentPeriodEnd
  }
}