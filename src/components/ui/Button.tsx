import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-900 text-neutral-0 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg focus:ring-primary-500',
      secondary: 'border border-primary-500 text-primary-500 bg-transparent hover:bg-primary-500 hover:text-neutral-0 focus:ring-primary-500',
      gold: 'bg-accent-gold text-neutral-900 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg focus:ring-accent-gold',
      outline: 'border border-neutral-400 text-neutral-700 bg-transparent hover:bg-neutral-50 focus:ring-neutral-400',
      ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-400',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-default',
      md: 'px-6 py-3 text-base rounded-default',
      lg: 'px-8 py-4 text-lg rounded-default',
    };
    
    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;