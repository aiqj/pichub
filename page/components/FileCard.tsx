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
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onPreview }) => {
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
          <div className="absolute top-2 right-2 bg-indigo-100/90 dark:bg-black/70 text-xs px-2 py-1 rounded-full text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/40 theme-transition">
            {file.file_type.split('/')[1].toUpperCase()}
          </div>
          
          {/* 预览图标提示 */}
          {onPreview && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="bg-black/70 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex flex-col space-y-2">
            <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200 truncate theme-transition" title={file.original_name}>
              {file.original_name}
            </h3>
            
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
            
            <div className="flex justify-between items-center mt-2">
              {onPreview ? (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowCopyOptions(!showCopyOptions)}
                  >
                    {showCopyOptions ? '隐藏链接' : '分享链接'}
                  </Button>
                  <Button
                    size="sm"
                    variant="info"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview();
                    }}
                  >
                    预览
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowCopyOptions(!showCopyOptions)}
                >
                  {showCopyOptions ? '隐藏链接' : '分享链接'}
                </Button>
              )}
              
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                loading={isDeleting}
                className="transition-all duration-300 hover:shadow-md hover:shadow-red-500/20 hover:scale-105 relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 group-hover:animate-shimmer bg-200%"></span>
                <span className="relative flex items-center">
                  {isDeleting ? null : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 transition-all duration-300 group-hover:rotate-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  {isDeleting ? '处理中...' : '删除'}
                </span>
              </Button>
            </div>
            
            {showCopyOptions && (
              <div className="mt-3 bg-gray-100/70 dark:bg-gray-900/50 p-3 rounded-md border border-gray-300 dark:border-gray-700 theme-transition">
                <input 
                  type="text" 
                  readOnly 
                  value={codeSnippets.url}
                  className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded py-1 px-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 theme-transition mb-3"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="info"
                    onClick={() => copyToClipboard(codeSnippets.url, 'url')}
                    className="flex-1 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 group-hover:animate-shimmer bg-200%"></span>
                    <span className="relative z-10 text-xs">复制链接</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="info"
                    onClick={() => copyToClipboard(codeSnippets.htmlCode, 'html')}
                    className="flex-1 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 group-hover:animate-shimmer bg-200%"></span>
                    <span className="relative z-10 text-xs">复制HTML</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="info"
                    onClick={() => copyToClipboard(codeSnippets.markdownCode, 'markdown')}
                    className="flex-1 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 group-hover:animate-shimmer bg-200%"></span>
                    <span className="relative z-10 text-xs">复制MD</span>
                  </Button>
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