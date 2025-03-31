'use client';
import React, { useEffect } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  show: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

export default function AdminNotification({
  type,
  message,
  show,
  onClose,
  autoClose = true,
  autoCloseTime = 3000
}: NotificationProps) {
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show && autoClose) {
      timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, autoClose, autoCloseTime, onClose]);

  if (!show) return null;

  const bgColor = {
    success: 'bg-green-50 border-green-400 text-green-700',
    error: 'bg-red-50 border-red-400 text-red-700',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-700',
    info: 'bg-blue-50 border-blue-400 text-blue-700'
  };

  const iconClass = {
    success: 'fas fa-check-circle text-green-500',
    error: 'fas fa-times-circle text-red-500',
    warning: 'fas fa-exclamation-triangle text-yellow-500',
    info: 'fas fa-info-circle text-blue-500'
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm">
      <div className={`${bgColor[type]} border-l-4 p-4 rounded shadow-md flex items-start`}>
        <div className="mr-3">
          <i className={`${iconClass[type]} text-lg`}></i>
        </div>
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        <button
          type="button"
          className="ml-4 text-gray-400 hover:text-gray-500"
          onClick={onClose}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
} 