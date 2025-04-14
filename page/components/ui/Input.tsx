import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, icon, className = '', ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label className="block text-gray-700 dark:text-gray-200 font-medium mb-1 theme-transition">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500 dark:text-gray-400 theme-transition">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-md border ${
              error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-800 px-3 py-2 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 theme-transition ${
              icon ? 'pl-10' : ''
            }`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400 theme-transition">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 