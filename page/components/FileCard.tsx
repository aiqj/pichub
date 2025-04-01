import React, { useState } from 'react';
import { FileItem } from '../types';
import Button from './ui/Button';
import { fileApi } from '../utils/api';

interface FileCardProps {
  file: FileItem;
  onDelete: (id: number) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete }) => {
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
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ ...copyStatus, [type]: true });
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [type]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  // 处理删除
  const handleDelete = async () => {
    if (confirm('确定要删除此文件吗？')) {
      try {
        setIsDeleting(true);
        await fileApi.deleteFile(file.id);
        onDelete(file.id);
      } catch (error) {
        console.error('删除文件失败:', error);
        alert('删除文件失败，请重试');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden transition-all duration-300 hover:shadow-indigo-900/20 hover:border-indigo-500/50">
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
        {/* 图片预览 */}
        {file.file_type.startsWith('image/') && (
          <img
            src={imageUrl}
            alt={file.original_name}
            className="w-full h-full object-contain"
          />
        )}
        
        {/* 文件类型显示 */}
        <div className="absolute top-2 right-2 bg-black/70 text-xs px-2 py-1 rounded-full text-indigo-400 border border-indigo-500/40">
          {file.file_type.split('/')[1].toUpperCase()}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col space-y-2">
          <h3 className="font-medium text-lg text-gray-200 truncate" title={file.original_name}>
            {file.original_name}
          </h3>
          
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatFileSize(file.file_size)}</span>
            <span>{formatDate(file.uploaded_at)}</span>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowCopyOptions(!showCopyOptions)}
            >
              {showCopyOptions ? '隐藏链接' : '分享链接'}
            </Button>
            
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
            <div className="mt-3 space-y-2 bg-gray-900/50 p-3 rounded-md border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">URL:</span>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => copyToClipboard(codeSnippets.url, 'url')}
                >
                  {copyStatus.url ? '已复制' : '复制'}
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">HTML:</span>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => copyToClipboard(codeSnippets.htmlCode, 'html')}
                >
                  {copyStatus.html ? '已复制' : '复制'}
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Markdown:</span>
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