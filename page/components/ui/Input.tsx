import React, { forwardRef, CSSProperties } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

// 定义样式
const styles = {
  container: (fullWidth: boolean) => ({
    width: fullWidth ? '100%' : 'auto',
  }),
  label: {
    display: 'block',
    color: '#e4e4e7',
    fontWeight: '500',
    marginBottom: '0.25rem',
  },
  inputWrapper: {
    position: 'relative' as CSSProperties['position'],
  },
  iconWrapper: {
    position: 'absolute' as CSSProperties['position'],
    inset: '0 auto 0 0',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.75rem',
    pointerEvents: 'none' as CSSProperties['pointerEvents'],
    color: '#a1a1aa',
  },
  input: (hasIcon: boolean, hasError: boolean) => ({
    width: '100%',
    borderRadius: '0.375rem',
    border: `1px solid ${hasError ? '#ef4444' : '#52525b'}`,
    backgroundColor: '#27272a',
    padding: '0.5rem 0.75rem',
    paddingLeft: hasIcon ? '2.5rem' : '0.75rem',
    color: '#e4e4e7',
    outline: 'none',
    ':focus': {
      borderColor: '#a855f7',
      boxShadow: '0 0 0 1px #a855f7',
    },
    '::placeholder': {
      color: '#71717a',
    },
  }),
  error: {
    marginTop: '0.25rem',
    fontSize: '0.875rem',
    color: '#ef4444',
  },
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, icon, className = '', ...props }, ref) => {
    return (
      <div style={{...styles.container(fullWidth), ...(className ? { className } : {})}}>
        {label && (
          <label style={styles.label}>{label}</label>
        )}
        <div style={styles.inputWrapper}>
          {icon && (
            <div style={styles.iconWrapper}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            style={styles.input(!!icon, !!error)}
            {...props}
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 