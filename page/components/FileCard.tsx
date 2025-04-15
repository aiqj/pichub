import React, { useState } from 'react';
import { FileItem } from '../types';
import Button from './ui/Button';
import { fileApi } from '../utils/api';
import { toast } from 'react-toastify';
import DeleteConfirmModal from './DeleteConfirmModal';

interface FileCardProps {
  file: FileItem;
  onDelete: (id: number) => void;
  onPreview?: () => void;
  onStatusChange?: (fileId: number, isPublic: boolean) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onPreview, onStatusChange }) => {
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // 根据后端返回的图片URL构建完整路径
  const imageUrl = `${process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST}/images/${file.file_name}`;
  
  // 格式化文件大小
  const formatFileSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    // 获取现在的时间
    const now = new Date();
    
    // 计算时间差（毫秒）
    const diff = now.getTime() - date.getTime();
    
    // 判断是否是今天上传的
    const isToday = date.toDateString() === now.toDateString();
    
    // 判断是否是昨天上传的
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    // 根据不同情况返回不同格式
    if (isToday) {
      // 如果是今天，显示"今天 HH:MM"
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      // 如果是昨天，显示"昨天 HH:MM"
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      // 如果是最近7天，显示"星期X HH:MM"
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return `星期${weekdays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.getFullYear() === now.getFullYear()) {
      // 如果是今年但超过7天，显示"MM-DD HH:MM"
      return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } else {
      // 其他情况显示完整日期
      return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
  };
  
  // 生成代码片段
  const codeSnippets = {
    url: imageUrl,
    htmlCode: `<img src="${imageUrl}" alt="${file.original_name}" />`,
    markdownCode: `![${file.original_name}](${imageUrl})`,
  };
  
  // 复制到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyStatus({ ...copyStatus, [type]: true });
        setTimeout(() => {
          setCopyStatus({ ...copyStatus, [type]: false });
        }, 2000);
      })
      .catch(err => {
        toast.error('复制失败，请手动复制');
      });
  };
  
  // 删除文件
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fileApi.deleteFile(file.id);
      if (response.data.success) {
        toast.success('文件已成功删除');
        onDelete(file.id);
      } else {
        toast.error(response.data.message || '删除失败，请重试');
      }
    } catch (error) {
      toast.error('删除文件时发生错误，请重试');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 切换文件公开状态
  const toggleFilePublicStatus = async () => {
    setIsUpdatingStatus(true);
    const newStatus = file.is_public === 0;

    try {
      const response = await fileApi.updateFileStatus(file.id, newStatus);
      if (response.data.success) {
        const statusText = newStatus ? '公开' : '私有';
        toast.success(`文件已设为${statusText}`);
        // 通知父组件状态已更改
        if (onStatusChange) {
          onStatusChange(file.id, newStatus);
        }
      } else {
        toast.error(response.data.message || '更新状态失败，请重试');
      }
    } catch (error) {
      toast.error('更新文件状态时发生错误，请重试');
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  return (
    <>
      <div className="bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-300 hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/20 hover:border-indigo-500/50 theme-transition">
        <div 
          className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden theme-transition"
          style={{ cursor: onPreview ? 'zoom-in' : 'default' }}
          onClick={onPreview}
        >
          {/* 图片预览 */}
          {file.file_type.startsWith('image/') && (
            <img
              src={imageUrl}
              alt={file.original_name}
              className="w-full h-full object-contain"
            />
          )}
          
          {/* 文件类型显示 */}
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 theme-transition shadow-sm">
            {file.file_type.split('/')[1].toUpperCase()}
          </div>

          {/* 文件状态指示 */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm shadow-sm ${
            file.is_public === 1
              ? 'bg-emerald-500/80 text-white border border-emerald-600 dark:bg-emerald-600/90'
              : 'bg-amber-500/80 text-white border border-amber-600 dark:bg-amber-600/90'
          }`}>
            {file.is_public === 1 ? '公开' : '私有'}
          </div>
          
          {/* 预览图标提示 */}
          {onPreview && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-black/70 rounded-full p-3 shadow-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200 truncate theme-transition flex-1 mr-2" title={file.original_name}>
                {file.original_name}
              </h3>
              
              {/* 状态切换按钮 - 只显示图标，使用锁图标 */}
              <button 
                onClick={toggleFilePublicStatus}
                disabled={isUpdatingStatus}
                className={`relative p-1.5 rounded-full transition-all duration-300 shadow-sm ${
                  isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                } ${
                  file.is_public === 1 
                    ? 'bg-emerald-100 dark:bg-emerald-700/80 text-emerald-600 dark:text-emerald-200' 
                    : 'bg-amber-100 dark:bg-amber-700/80 text-amber-600 dark:text-amber-200'
                }`}
                title={file.is_public === 1 ? '设为私有' : '设为公开'}
              >
                {isUpdatingStatus ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    {file.is_public === 1 ? (
                      <path d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    ) : (
                      <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    )}
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 theme-transition">
              <span>{formatFileSize(file.file_size)}</span>
              <span 
                title={new Date(file.uploaded_at).toLocaleString('zh-CN', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
                className="group relative cursor-help"
              >
                {formatDate(file.uploaded_at)}
                <span className="absolute bottom-full right-0 mb-2 w-44 rounded bg-black/80 p-1 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  {new Date(file.uploaded_at).toLocaleString('zh-CN', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    weekday: 'long'
                  })}
                </span>
              </span>
            </div>
            
            {/* 操作按钮区 - 纯图标显示 */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              {/* 分享按钮 */}
              <button
                onClick={() => setShowCopyOptions(!showCopyOptions)}
                className="group flex-1 flex items-center justify-center p-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/80 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 transition-all duration-300 theme-transition shadow-sm dark:shadow-inner dark:shadow-black/30"
                title={showCopyOptions ? "隐藏链接" : "分享链接"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              
              {/* 预览按钮 */}
              {onPreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview();
                  }}
                  className="group flex-1 flex items-center justify-center p-2 rounded-md bg-blue-100 hover:bg-blue-200 dark:bg-blue-700/60 dark:hover:bg-blue-600/70 text-blue-600 dark:text-blue-200 transition-all duration-300 theme-transition shadow-sm dark:shadow-inner dark:shadow-black/30"
                  title="预览"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
              
              {/* 删除按钮 */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="group flex-1 flex items-center justify-center p-2 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-700/60 dark:hover:bg-red-600/70 text-red-600 dark:text-red-200 transition-all duration-300 theme-transition shadow-sm dark:shadow-inner dark:shadow-black/30"
                title="删除"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
            
            {showCopyOptions && (
              <div className="mt-3 bg-gray-100/70 dark:bg-gray-800/80 p-3 rounded-md border border-gray-300 dark:border-gray-600 theme-transition shadow-sm">
                <div className="relative mb-3">
                  <input 
                    type="text" 
                    readOnly 
                    value={codeSnippets.url}
                    className="w-full text-xs border border-gray-300 dark:border-gray-500 rounded py-1.5 px-3 pr-8 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 theme-transition"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => copyToClipboard(codeSnippets.url, 'url')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="复制链接"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(codeSnippets.htmlCode, 'html')}
                    className="flex-1 text-xs py-1.5 rounded-md bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-700/70 dark:hover:bg-indigo-600/80 text-indigo-700 dark:text-indigo-200 transition-all duration-300 theme-transition shadow-sm"
                  >
                    复制HTML
                  </button>
                  
                  <button
                    onClick={() => copyToClipboard(codeSnippets.markdownCode, 'markdown')}
                    className="flex-1 text-xs py-1.5 rounded-md bg-purple-100 hover:bg-purple-200 dark:bg-purple-700/70 dark:hover:bg-purple-600/80 text-purple-700 dark:text-purple-200 transition-all duration-300 theme-transition shadow-sm"
                  >
                    复制Markdown
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="删除文件"
        message={`您确定要删除 "${file.original_name}" 吗？此操作将永久删除该文件，无法恢复。`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
};

export default FileCard; 