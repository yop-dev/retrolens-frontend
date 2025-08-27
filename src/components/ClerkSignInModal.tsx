import { SignIn } from '@clerk/clerk-react'
import '@/css/components/ClerkSignInModal.css'

export function ClerkSignInModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="clerk-modal-overlay" onClick={onClose}>
      <div className="clerk-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="clerk-modal-close" onClick={onClose}>×</button>
        <SignIn 
          appearance={{
            elements: {
              rootBox: 'clerk-signin-root',
              card: 'clerk-signin-card',
              headerTitle: 'clerk-signin-title',
              headerSubtitle: 'clerk-signin-subtitle',
              formButtonPrimary: 'clerk-signin-button',
              footerActionLink: 'clerk-signin-link',
              identityPreviewEditButton: 'hidden-element',
              alternativeMethodsBlockButton: 'hidden-element'
            },
            layout: {
              socialButtonsPlacement: 'top',
              socialButtonsVariant: 'blockButton'
            },
            variables: {
              colorPrimary: '#C97C5D',  // Warm Terracotta
              colorBackground: '#E0C097',  // Soft Tan
              colorText: '#2C1810',  // Rich Brown
              colorTextSecondary: '#5C4033',  // Deep Brown
              colorDanger: '#B85450',  // Dusty red (from semantic colors)
              borderRadius: '0.5rem',
              fontFamily: 'inherit'
            }
          }}
          routing="hash"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/feed"
          redirectUrl="/feed"
          initialValues={{
            emailAddress: '',
            password: ''
          }}
        />
      </div>
    </div>
  )
}
