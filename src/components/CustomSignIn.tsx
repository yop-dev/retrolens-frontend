import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '@/css/components/CustomSignIn.css'

export function CustomSignIn({ onClose }: { onClose: () => void }) {
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)
  const navigate = useNavigate()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInLoaded || !signIn) {return}

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      })

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId })
        }
        navigate('/feed')
        onClose()
      } else {
        console.warn('Sign in requires additional steps:', result.status)
        setError('Sign in requires additional verification')
      }
    } catch (err: unknown) {
      console.error('Sign in error:', err)
      
      const error = err as { errors?: Array<{ code?: string; message?: string }> }
      if (error.errors?.[0]?.code === 'form_password_incorrect' || 
          error.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('Invalid email or password.')
      } else if (error.errors?.[0]?.message) {
        setError(error.errors[0].message)
      } else {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpLoaded || !signUp) {return}

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    setError('')

    // Add timeout for long requests
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Sign up is taking longer than expected...')
      }
    }, 5000)

    try {
      console.warn('Starting sign up process for:', email)
      const startTime = Date.now()
      
      const result = await signUp.create({
        emailAddress: email,
        password: password,
      })

      const elapsed = Date.now() - startTime
      console.warn(`Sign up API call took ${elapsed}ms`)
      console.warn('Sign up result:', result)

      if (result.status === 'complete') {
        console.warn('Sign up complete, setting active session...')
        if (setActive) {
          await setActive({ session: result.createdSessionId })
        }
        navigate('/feed')
        onClose()
      } else if (result.status === 'missing_requirements') {
        // Email verification required
        console.warn('Email verification required, preparing...')
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setVerificationPending(true)
      } else {
        console.warn('Sign up requires additional steps:', result.status)
        setError('Sign up requires additional verification')
      }
    } catch (err: unknown) {
      console.error('Sign up error:', err)
      
      const error = err as { errors?: Array<{ code?: string; message?: string }> }
      if (error.errors?.[0]?.code === 'form_identifier_exists') {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (error.errors?.[0]?.message) {
        setError(error.errors[0].message)
      } else {
        setError('Failed to sign up. Please try again.')
      }
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!signInLoaded || !signIn) {return}

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/feed'
      })
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Failed to sign in with Google')
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpLoaded || !signUp) {return}

    setIsLoading(true)
    setError('')

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode
      })

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId })
        }
        navigate('/feed')
        onClose()
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err: unknown) {
      console.error('Verification error:', err)
      
      const error = err as { errors?: Array<{ code?: string; message?: string }> }
      if (error.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Invalid verification code. Please check your email and try again.')
      } else if (error.errors?.[0]?.message) {
        setError(error.errors[0].message)
      } else {
        setError('Verification failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (verificationPending) {
    return (
      <div className="modal-overlay">
        <div className="modal-content modal-content-fixed">
          <button className="modal-close" onClick={onClose}>×</button>
          <h2>Verify Your Email</h2>
          <p className="modal-subtitle">We've sent a verification code to:</p>
          <p className="modal-subtitle" style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>{email}</p>
          
          <form onSubmit={handleVerifyEmail}>
            <div className="form-group">
              <label htmlFor="verification-code">Verification Code</label>
              <input
                type="text"
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2rem' }}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading || verificationCode.length < 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
            <p>
              Didn't receive a code?{' '}
              <button 
                onClick={async () => {
                  try {
                    await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' })
                    setError('')
                    alert('New verification code sent!')
                  } catch (_err) {
                    setError('Failed to resend code. Please try again.')
                  }
                }} 
                className="link-button"
                disabled={isLoading}
              >
                Resend code
              </button>
            </p>
            <p>
              Wrong email?{' '}
              <button onClick={() => {
                setVerificationPending(false)
                setVerificationCode('')
                setError('')
                setPassword('')
                setConfirmPassword('')
                setEmail('')
              }} className="link-button">
                Start over
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showSignUp) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '380px' }}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2>Sign up for RetroLens</h2>
          <p className="modal-subtitle">Create your account to get started</p>

          <button onClick={handleGoogleSignIn} className="btn btn-google">
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="google-icon"
            />
            Continue with Google
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSignUp}>
            <div className="form-group">
              <label htmlFor="signup-email">Email address</label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 8 characters)"
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                type="password"
                id="signup-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="modal-footer">
            <p>
              Already have an account?{' '}
              <button onClick={() => {
                setShowSignUp(false)
                setError('')
                setPassword('')
                setConfirmPassword('')
              }} className="link-button">
                Sign in
              </button>
            </p>
            <p className="secured-by">
              Secured by <strong>Clerk</strong>
            </p>
            <p className="dev-mode">Development mode</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '380px' }}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Sign in to RetroLens</h2>
        <p className="modal-subtitle">Welcome back! Please sign in to continue</p>

        <button onClick={handleGoogleSignIn} className="btn btn-google">
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="google-icon"
          />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSignIn}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <div className="modal-footer">
          <p>
            Don't have an account?{' '}
            <button onClick={() => {
              setShowSignUp(true)
              setError('')
              setPassword('')
            }} className="link-button">
              Sign up
            </button>
          </p>
          <p className="secured-by">
            Secured by <strong>Clerk</strong>
          </p>
          <p className="dev-mode">Development mode</p>
        </div>
      </div>
    </div>
  )
}
