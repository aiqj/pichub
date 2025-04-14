import React, { useState, useEffect, useRef } from 'react';

interface ImagePreviewProps {
  imageUrl: string;
  onClose: () => void;
  alt?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imageUrl, onClose, alt = '图片预览' }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 阻止容器滚动
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        
        // 在这里添加缩放逻辑，确保滚轮事件能被处理
        const delta = e.deltaY * -0.01;
        const newScale = Math.min(Math.max(0.1, scale + delta), 5);
        setScale(newScale);
        
        return false;
      }
    };

    // 添加全局事件监听器以确保捕获所有滚轮事件
    document.addEventListener('wheel', preventScroll, { passive: false, capture: true });
    
    // 防止触摸滚动
    const preventTouchMove = (e: TouchEvent) => {
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', preventTouchMove, { passive: false, capture: true });

    // 防止滚动传播
    const preventBodyScroll = () => {
      if (containerRef.current) {
        document.body.style.overflow = 'hidden';
      }
    };
    
    const restoreBodyScroll = () => {
      document.body.style.overflow = '';
    };
    
    preventBodyScroll();

    // 组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('wheel', preventScroll, { capture: true });
      document.removeEventListener('touchmove', preventTouchMove, { capture: true });
      restoreBodyScroll();
    };
  }, [scale]);

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // 处理拖拽中
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // 防止事件冒泡和默认行为
    e.preventDefault();
    e.stopPropagation();
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 监听全局鼠标移动和抬起事件，确保拖拽流畅
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    // 添加全局事件监听
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    // 移除事件监听
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  // 处理全屏模式
  const toggleFullscreen = () => {
    if (imageContainerRef.current) {
      if (!isFullscreen) {
        // 进入全屏前先重置位置，确保居中显示
        setScale(1);
        setPosition({ x: 0, y: 0 });
        
        // 进入全屏
        if (imageContainerRef.current.requestFullscreen) {
          imageContainerRef.current.requestFullscreen();
        } else if ((imageContainerRef.current as any).webkitRequestFullscreen) {
          (imageContainerRef.current as any).webkitRequestFullscreen();
        } else if ((imageContainerRef.current as any).msRequestFullscreen) {
          (imageContainerRef.current as any).msRequestFullscreen();
        }
      } else {
        // 退出全屏并重置
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        
        // 直接重置状态，以避免在某些浏览器中的延迟
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  // 监听全屏变化事件
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // 如果从全屏退出，重置缩放和位置
      if (!isNowFullscreen && isFullscreen) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      } else if (e.key === '0') {
        // 重置缩放和位置
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === '+' || e.key === '=') {
        // 放大
        setScale(prev => Math.min(prev + 0.1, 5));
      } else if (e.key === '-') {
        // 缩小
        setScale(prev => Math.max(prev - 0.1, 0.1));
      } else if (e.key === 'f') {
        // 切换全屏
        toggleFullscreen();
      } else if (e.key === 'ArrowUp') {
        // 向上移动
        setPosition(prev => ({ ...prev, y: prev.y + 20 }));
      } else if (e.key === 'ArrowDown') {
        // 向下移动
        setPosition(prev => ({ ...prev, y: prev.y - 20 }));
      } else if (e.key === 'ArrowLeft') {
        // 向左移动
        setPosition(prev => ({ ...prev, x: prev.x + 20 }));
      } else if (e.key === 'ArrowRight') {
        // 向右移动
        setPosition(prev => ({ ...prev, x: prev.x - 20 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, isFullscreen, toggleFullscreen]);

  // 点击背景关闭
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  };

  // 双击重置缩放
  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
      ref={containerRef}
      onClick={handleBackgroundClick}
    >
      <div className={`absolute top-4 right-4 z-10 space-x-2 ${isFullscreen ? 'fixed' : ''}`}>
        <button 
          onClick={() => setScale(prev => Math.min(prev + 0.1, 5))}
          className="bg-gray-800/80 text-white p-2 rounded-full hover:bg-gray-700/80"
          title="放大"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={() => setScale(prev => Math.max(prev - 0.1, 0.1))}
          className="bg-gray-800/80 text-white p-2 rounded-full hover:bg-gray-700/80"
          title="缩小"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="bg-gray-800/80 text-white p-2 rounded-full hover:bg-gray-700/80"
          title="重置"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm5 5a1 1 0 012 0v4a1 1 0 01-2 0V9z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={toggleFullscreen}
          className="bg-gray-800/80 text-white p-2 rounded-full hover:bg-gray-700/80"
          title={isFullscreen ? "退出全屏" : "全屏查看"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 5a1 1 0 011-1h1V3a1 1 0 112 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V6H6a1 1 0 01-1-1zm9 0a1 1 0 00-1-1h-1V3a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0V6h1a1 1 0 001-1zm-9 9a1 1 0 011-1h1v-1a1 1 0 112 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H6a1 1 0 01-1-1zm9 0a1 1 0 00-1-1h-1v-1a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 001-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button 
          onClick={onClose}
          className="bg-gray-800/80 text-white p-2 rounded-full hover:bg-gray-700/80"
          title="关闭"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div 
        className={`relative overflow-hidden select-none h-full w-full flex items-center justify-center ${isFullscreen ? 'fixed inset-0 bg-black' : ''}`}
        ref={imageContainerRef}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-full max-w-full object-contain transition-transform duration-0 cursor-move"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            willChange: 'transform',
            pointerEvents: 'auto'
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          draggable="false"
        />
      </div>

      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm ${isFullscreen ? 'fixed' : ''}`}>
        <p className="text-sm font-medium">
          缩放: {Math.round(scale * 100)}% | 拖拽查看 | 双击重置 | F键全屏 | ESC关闭
        </p>
      </div>
    </div>
  );
};

export default ImagePreview; 