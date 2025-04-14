import React from 'react';

const FileSkeleton = () => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-300">
      {/* 图片预览区域 */}
      <div className="relative aspect-video bg-gray-900/70 animate-pulse">
        {/* 文件类型显示 */}
        <div className="absolute top-2 right-2 bg-black/70 w-12 h-6 rounded-full"></div>
      </div>
      
      {/* 文件信息区域 */}
      <div className="p-4 animate-pulse">
        <div className="flex flex-col space-y-2">
          {/* 文件名 */}
          <div className="h-6 bg-gray-700 rounded w-full"></div>
          
          {/* 文件大小和日期 */}
          <div className="flex justify-between">
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/3"></div>
          </div>
          
          {/* 按钮区域 */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-2">
              <div className="w-20 h-8 bg-gray-700 rounded"></div>
              <div className="w-16 h-8 bg-gray-700 rounded"></div>
            </div>
            <div className="w-16 h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSkeleton; 