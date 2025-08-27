import { ReactNode } from 'react';

/**
 * Common component props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

/**
 * Button variants and sizes
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Input component props
 */
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'tel';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Loading states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Theme modes
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Screen sizes for responsive design
 */
export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

/**
 * Navigation item
 */
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

/**
 * Tab item
 */
export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

/**
 * Form validation error
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * Form field state
 */
export interface FormFieldState {
  value: string;
  error?: string;
  touched: boolean;
  valid: boolean;
}

/**
 * Notification types
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Notification data
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

/**
 * Search result item
 */
export interface SearchResult {
  id: string;
  type: 'user' | 'camera' | 'discussion';
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
}

/**
 * Generic list item for UI components
 */
export interface ListItem {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

/**
 * Page component type
 */
export type PageComponent = React.FC<BaseComponentProps> & {
  displayName?: string;
};
