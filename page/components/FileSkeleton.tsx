import React from 'react';

const FileSkeleton = () => {
  return (
    <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-300 theme-transition hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/20 hover:border-indigo-500/50">
      {/* 图片预览区域 */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900/70 overflow-hidden theme-transition">
        {/* 渐变动画背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 theme-transition animate-shimmer bg-200%"></div>
      </div>
      
      {/* 文件信息区域 */}
      <div className="p-4">
        <div className="flex flex-col space-y-3">
          {/* 文件名 */}
          <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded theme-transition animate-shimmer bg-200%"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-4/5 theme-transition animate-shimmer bg-200%"></div>
          
          {/* 文件大小和日期 */}
          <div className="flex justify-between text-xs mt-1">
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/4 theme-transition animate-shimmer bg-200%"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/3 theme-transition animate-shimmer bg-200%"></div>
          </div>
          
          {/* 按钮区域 */}
          <div className="flex justify-between items-center mt-1">
            <div className="flex space-x-2">
              <div className="w-20 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded theme-transition animate-shimmer bg-200%"></div>
              <div className="w-16 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded theme-transition animate-shimmer bg-200%"></div>
            </div>
            <div className="w-16 h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded theme-transition animate-shimmer bg-200%"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSkeleton; 