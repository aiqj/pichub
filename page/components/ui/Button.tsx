import React, { CSSProperties } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

// 定义样式
const styles = {
  base: {
    borderRadius: '0.375rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  sizes: {
    sm: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.875rem',
    },
    md: {
      padding: '0.5rem 1rem',
      fontSize: '1rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.125rem',
    },
  },
  variants: {
    primary: {
      background: 'linear-gradient(to right, #9333ea, #9333ea)',
      color: 'white',
      ':hover': {
        background: 'linear-gradient(to right, #7e22ce, #7e22ce)',
      },
    },
    secondary: {
      border: '1px solid #d4d4d8',
      backgroundColor: 'white',
      color: '#3f3f46',
      ':hover': {
        backgroundColor: '#f4f4f5',
      },
    },
    danger: {
      background: 'linear-gradient(to right, #ef4444, #dc2626)',
      color: 'white',
      ':hover': {
        background: 'linear-gradient(to right, #dc2626, #b91c1c)',
      },
    },
    success: {
      background: 'linear-gradient(to right, #10b981, #22c55e)',
      color: 'white',
      ':hover': {
        background: 'linear-gradient(to right, #059669, #16a34a)',
      },
    },
    warning: {
      background: 'linear-gradient(to right, #f59e0b, #f97316)',
      color: 'white',
      ':hover': {
        background: 'linear-gradient(to right, #d97706, #ea580c)',
      },
    },
    info: {
      background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
      color: 'white',
      ':hover': {
        background: 'linear-gradient(to right, #0891b2, #2563eb)',
      },
    },
  },
  spinner: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  spinnerIcon: {
    animation: 'spin 1s linear infinite',
    marginLeft: '-0.25rem',
    marginRight: '0.5rem',
    height: '1rem',
    width: '1rem',
  },
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  loading = false,
}) => {
  // 合并样式
  const buttonStyle = {
    ...styles.base,
    ...(fullWidth ? styles.fullWidth : {}),
    ...(disabled || loading ? styles.disabled : {}),
    ...styles.sizes[size],
    ...styles.variants[variant],
  };
  
  return (
    <button
      type={type}
      style={buttonStyle}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
    >
      {loading ? (
        <div style={styles.spinner}>
          <svg style={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>处理中...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 