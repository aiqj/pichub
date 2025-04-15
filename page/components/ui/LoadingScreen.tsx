import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingScreenProps {
  isVisible: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // 使用内部状态来控制显示，以获得更平滑的过渡效果
  const [opacity, setOpacity] = useState(isVisible ? 1 : 0);
  const [display, setDisplay] = useState(isVisible ? 'flex' : 'none');
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isVisible) {
      // 立即显示
      setDisplay('flex');
      // 然后淡入
      setTimeout(() => setOpacity(1), 10);
    } else {
      // 先淡出
      setOpacity(0);
      // 完全淡出后再隐藏 - 从300ms减少到150ms
      timer = setTimeout(() => setDisplay('none'), 150);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible]);

  // 如果不显示且opacity为0，则完全不渲染该组件
  if (display === 'none' && opacity === 0) return null;

  return (
    <div 
      className={`fixed inset-0 ${isDarkMode ? 'bg-[#121826]' : 'bg-gray-50'} z-50 flex flex-col items-center justify-center`}
      style={{ 
        opacity: opacity,
        display: display,
        transition: 'opacity 150ms ease-in-out', // 从300ms减少到150ms
      }}
    >
      <div className="loading-logo text-purple-500 text-4xl font-bold mb-4">
        PicHub
      </div>
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        简单、安全、高效的图片托管服务
      </div>
      
      {/* 加载指示器 */}
      <div className="mt-6 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-purple-500"
            style={{
              animation: `pulse 1.5s ${i * 0.2}s infinite ease-in-out`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen; 