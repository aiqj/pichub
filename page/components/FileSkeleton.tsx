import React from 'react';

const FileSkeleton = () => {
  return (
    <div className="bg-white/90 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-300 theme-transition hover:shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/20 hover:border-indigo-500/50 theme-transition">
      {/* 图片预览区域 */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900/70 animate-pulse theme-transition">
        {/* 文件类型显示 */}
        <div className="absolute top-2 right-2 bg-indigo-100/90 dark:bg-black/70 text-xs px-2 py-1 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/40 theme-transition">
          文件
        </div>
      </div>
      
      {/* 文件信息区域 */}
      <div className="p-4 animate-pulse">
        <div className="flex flex-col space-y-2">
          {/* 文件名 */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full theme-transition"></div>
          
          {/* 文件大小和日期 */}
          <div className="flex justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 theme-transition"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 theme-transition"></div>
          </div>
          
          {/* 按钮区域 */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-2">
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded theme-transition"></div>
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded theme-transition"></div>
            </div>
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded theme-transition"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSkeleton; 