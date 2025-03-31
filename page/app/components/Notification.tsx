'use client';

import { useEffect, useState } from 'react';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // 获取图标基于类型
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-times-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      default:
        return 'fa-info-circle';
    }
  };

  // 获取颜色基于类型
  const getColorClass = () => {
    switch (type) {
      case 'success':
        return 'border-success';
      case 'error':
        return 'border-error';
      case 'warning':
        return 'border-warning';
      default:
        return 'border-info';
    }
  };

  // 获取背景渐变
  const getBackgroundClass = () => {
    switch (type) {
      case 'success':
        return 'before:from-success/10 before:to-transparent';
      case 'error':
        return 'before:from-error/10 before:to-transparent';
      case 'warning':
        return 'before:from-warning/10 before:to-transparent';
      default:
        return 'before:from-info/10 before:to-transparent';
    }
  };

  // 获取图标颜色
  const getIconColorClass = () => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-info';
    }
  };

  // 处理关闭通知
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    // 创建淡出动画的计时器
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${getColorClass()} border rounded shadow-lg px-4 py-3 flex items-start gap-3 max-w-xs transform transition-all duration-300 backdrop-blur-md ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } relative bg-transparent-dark before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r ${getBackgroundClass()} before:rounded before:z-[-1] card-holographic`}
    >
      {/* 装饰性角标 */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-inherit opacity-60"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-inherit opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-inherit opacity-60"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-inherit opacity-60"></div>
      
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30"></div>
      
      <div className={`text-xl ${getIconColorClass()} animate-pulse`}>
        <i className={`fas ${getIcon()}`}></i>
      </div>
      <div className="flex-1 pr-5 text-light relative">
        {message}
        <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
      </div>
      <button
        onClick={handleClose}
        className="text-sm text-light opacity-70 hover:opacity-100 transition hover:text-info"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}; 