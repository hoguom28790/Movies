import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    secondary: 'bg-surface text-foreground hover:bg-surface-hover',
    ghost: 'bg-transparent text-foreground hover:bg-surface',
    outline: 'border border-border text-foreground hover:bg-surface'
  };
  
  const sizes = {
    sm: 'min-h-[44px] md:min-h-[36px] px-4 md:px-3 py-2 md:py-1.5 text-[14px] md:text-sm',
    md: 'min-h-[44px] px-4 py-3 md:py-2 text-[15px] md:text-sm',
    lg: 'min-h-[48px] md:min-h-[44px] px-6 md:px-8 py-3.5 md:py-2.5 text-[16px] md:text-[15px]'
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
