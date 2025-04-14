import React, { useState } from 'react';
import { FileItem } from '../types';
import Button from './ui/Button';
import { fileApi } from '../utils/api';
import { toast } from 'react-toastify';

interface FileCardProps {
  file: FileItem;
  onDelete: (id: number) => void;
  onPreview?: () => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onPreview }) => {
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    return date.toLocaleString('zh-CN');
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
    if (!window.confirm('确定要删除这个文件吗？此操作不可恢复。')) {
      return;
    }
    
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
    }
  };
  
  return (
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
            <span>{formatDate(file.uploaded_at)}</span>
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
              onClick={handleDelete}
              loading={isDeleting}
            >
              删除
            </Button>
          </div>
          
          {showCopyOptions && (
            <div className="mt-3 space-y-2 bg-gray-100/70 dark:bg-gray-900/50 p-3 rounded-md border border-gray-300 dark:border-gray-700 theme-transition">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 theme-transition">URL:</span>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => copyToClipboard(codeSnippets.url, 'url')}
                >
                  {copyStatus.url ? '已复制' : '复制'}
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 theme-transition">HTML:</span>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => copyToClipboard(codeSnippets.htmlCode, 'html')}
                >
                  {copyStatus.html ? '已复制' : '复制'}
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 theme-transition">Markdown:</span>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => copyToClipboard(codeSnippets.markdownCode, 'markdown')}
                >
                  {copyStatus.markdown ? '已复制' : '复制'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard; 