import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './ui/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  isLoading = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // 添加ESC键监听
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onCancel, isLoading]);
  
  // 控制模态框显示和隐藏的动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 禁止页面滚动
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // 恢复页面滚动
        document.body.style.overflow = '';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // 如果未挂载或不显示，返回null
  if (!mounted || !isOpen) return null;
  
  // 创建模态框内容
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999]" 
      style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* 背景蒙层 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
      ></div>
      
      {/* 模态框容器 - 用于居中定位 */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* 模态框内容 */}
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 theme-transition overflow-hidden animate-fade-scale-up">
          {/* 顶部圆角装饰条 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400"></div>

          {/* 关闭按钮 */}
          <button
            type="button"
            className="absolute top-3 right-3 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none transition-all duration-200 theme-transition z-10"
            onClick={onCancel}
            aria-label="关闭"
          >
            <span className="sr-only">关闭</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 警告图标和标题 */}
          <div className="p-6 pb-0 flex flex-col items-center">
            <div className="mx-auto flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 mb-4 theme-transition border border-red-200 dark:border-red-800/40 shadow-lg shadow-red-500/10">
              <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/60 flex items-center justify-center animate-pulse-slow">
                <svg className="h-10 w-10 text-red-600 dark:text-red-400 theme-transition" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-bold leading-6 text-gray-900 dark:text-gray-100 theme-transition text-center" id="modal-title">
              {title}
            </h3>
          </div>
          
          {/* 警告内容 */}
          <div className="p-6 pt-4">
            <p className="text-sm text-center text-gray-600 dark:text-gray-300 theme-transition mt-2 mb-2">
              {message}
            </p>
            <p className="text-xs text-center text-red-500 dark:text-red-400 theme-transition mt-2 mb-4">
              此操作不可撤销，请谨慎操作
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex flex-col sm:flex-row sm:justify-center space-y-3 sm:space-y-0 sm:space-x-4 theme-transition border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto transition-colors border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 dark:hover:border-gray-500 hover:shadow-sm relative overflow-hidden group"
              size="lg"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-200/0 via-gray-200/30 to-gray-200/0 dark:from-gray-600/0 dark:via-gray-600/30 dark:to-gray-600/0 group-hover:animate-shimmer bg-200%"></span>
              <span className="relative z-10">取消</span>
            </Button>
            <Button
              variant="danger"
              onClick={onConfirm}
              loading={isLoading}
              disabled={isLoading}
              className="w-full sm:w-auto hover:scale-105 transition-transform relative overflow-hidden group"
              size="lg"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500/0 via-red-500/30 to-red-500/0 group-hover:animate-shimmer bg-200%"></span>
              <span className="relative z-10">{isLoading ? '处理中...' : '确认删除'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // 使用ReactDOM.createPortal将模态框内容挂载到#__next元素
  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('__next') || document.body
  );
};

export default DeleteConfirmModal; 