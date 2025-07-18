import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string, companyName: string) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<any>
  sendVerificationCode: (email: string) => Promise<{ success: boolean; code?: string; error?: string }>
  verifyCodeAndResetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Store for verification codes (in production, this would be server-side)
  const [verificationCodes, setVerificationCodes] = useState<Map<string, { code: string; expiry: Date }>>(new Map())

  // Function to log authentication events securely
  const logAuthEvent = async (eventType: string, metadata: any = {}) => {
    try {
      if (user?.id) {
        await supabase.rpc('log_auth_event', {
          p_user_id: user.id,
          p_event_type: eventType,
          p_metadata: metadata
        })
      }
    } catch (error) {
      // Don't throw errors for logging failures
      console.warn('Failed to log auth event:', error)
    }
  }

  const clearAuthState = async () => {
    setSession(null)
    setUser(null)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Ignore signOut errors as the session is already invalid
      console.warn('SignOut error (ignored):', error)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setLoading(true)
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.warn('Session retrieval error:', error.message)
          await clearAuthState()
        } else if (session && session.access_token) {
          // Validate session by checking if it's not expired
          const now = Math.floor(Date.now() / 1000)
          if (session.expires_at && session.expires_at < now) {
            console.warn('Session expired, clearing auth state')
            await clearAuthState()
          } else {
            setSession(session)
            setUser(session.user)
            // Log session restoration
            await logAuthEvent('session_restored')
          }
        } else {
          // No session or invalid session
          await clearAuthState()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          await clearAuthState()
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with enhanced error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      try {
        setLoading(true)

        // Handle invalid session states
        if (event === 'SIGNED_IN' && (!session || !session.access_token)) {
          console.warn('Invalid session detected during SIGNED_IN event')
          await clearAuthState()
          return
        }

        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing session')
          await clearAuthState()
          return
        }

        // Handle sign out events
        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          return
        }

        // Handle other auth events with session validation
        if (session) {
          // Validate session token
          const now = Math.floor(Date.now() / 1000)
          if (session.expires_at && session.expires_at < now) {
            console.warn('Received expired session, clearing auth state')
            await clearAuthState()
            return
          }
          
          setSession(session)
          setUser(session.user)
          
          // Log authentication events
          if (event === 'SIGNED_IN') {
            await logAuthEvent('sign_in_success')
          } else if (event === 'TOKEN_REFRESHED') {
            await logAuthEvent('token_refreshed')
          }
        } else {
          setSession(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        await clearAuthState()
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // Remove user dependency to prevent infinite loops

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        // Log failed sign in attempt
        await supabase.rpc('log_auth_event', {
          p_user_id: null,
          p_event_type: 'sign_in_failed',
          p_metadata: { email, error: error.message }
        })
      }
      
      return { data, error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, companyName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      })

      if (data.user && !error) {
        // Log successful sign up
        await supabase.rpc('log_auth_event', {
          p_user_id: data.user.id,
          p_event_type: 'sign_up_success',
          p_metadata: { email, full_name: fullName, company_name: companyName }
        })
      } else if (error) {
        // Log failed sign up attempt
        await supabase.rpc('log_auth_event', {
          p_user_id: null,
          p_event_type: 'sign_up_failed',
          p_metadata: { email, error: error.message }
        })
      }

      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      // Log sign out before clearing state
      if (user?.id) {
        await logAuthEvent('sign_out')
      }
      
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Sign out error:', error)
    } finally {
      setSession(null)
      setUser(null)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      
      // Log password reset attempt
      await supabase.rpc('log_auth_event', {
        p_user_id: null,
        p_event_type: 'password_reset_requested',
        p_metadata: { email }
      })
      
      return { data, error }
    } catch (error) {
      console.error('Reset password error:', error)
      return { data: null, error }
    }
  }

  // New function to send verification code
  const sendVerificationCode = async (email: string): Promise<{ success: boolean; code?: string; error?: string }> => {
    try {
      // Generate a 7-digit verification code
      const code = Math.floor(1000000 + Math.random() * 9000000).toString()
      const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      
      // Store the code (in production, this would be stored server-side)
      setVerificationCodes(prev => new Map(prev.set(email, { code, expiry })))
      
      // In a real application, you would send this code via email using:
      // - Supabase Edge Functions
      // - SendGrid, Mailgun, AWS SES, etc.
      // - Your own email service
      
      // For demo purposes, we'll log it and return it
      console.log(`Verification code for ${email}: ${code}`)
      
      // Log the verification code request
      await supabase.rpc('log_auth_event', {
        p_user_id: null,
        p_event_type: 'verification_code_requested',
        p_metadata: { email }
      })
      
      return { success: true, code } // Return code for demo purposes
    } catch (error) {
      console.error('Send verification code error:', error)
      return { success: false, error: 'Failed to send verification code' }
    }
  }

  // New function to verify code and reset password
  const verifyCodeAndResetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if code exists and is valid
      const storedData = verificationCodes.get(email)
      
      if (!storedData) {
        return { success: false, error: 'No verification code found for this email' }
      }
      
      if (new Date() > storedData.expiry) {
        // Remove expired code
        setVerificationCodes(prev => {
          const newMap = new Map(prev)
          newMap.delete(email)
          return newMap
        })
        return { success: false, error: 'Verification code has expired' }
      }
      
      if (code !== storedData.code) {
        return { success: false, error: 'Invalid verification code' }
      }
      
      // Code is valid, now reset the password
      // In a real application, you would:
      // 1. Generate a temporary session or token
      // 2. Use Supabase Admin API to update the user's password
      // 3. Invalidate the verification code
      
      // For demo purposes, we'll simulate success
      // Remove the used code
      setVerificationCodes(prev => {
        const newMap = new Map(prev)
        newMap.delete(email)
        return newMap
      })
      
      // Log successful password reset
      await supabase.rpc('log_auth_event', {
        p_user_id: null,
        p_event_type: 'password_reset_completed',
        p_metadata: { email }
      })
      
      return { success: true }
    } catch (error) {
      console.error('Verify code and reset password error:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendVerificationCode,
    verifyCodeAndResetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}