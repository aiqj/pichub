import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FileItem } from '../../types';
import { adminApi, fileApi } from '../../utils/api';
import ImagePreview from '../../components/ImagePreview';
import { toast } from 'react-toastify';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

const AdminFilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [previewAlt, setPreviewAlt] = useState<string>('图片预览');
  const [sharingFileId, setSharingFileId] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  
  // 加载文件列表
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAllFiles();
        if (response.data && response.data.files) {
          setFiles(response.data.files);
        }
      } catch (err: any) {
        setError('获取文件列表失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, []);
  
  // 打开删除模态框
  const openDeleteModal = (file: FileItem) => {
    setSelectedFile(file);
    setIsDeleteModalOpen(true);
  };
  
  // 关闭删除模态框
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedFile(null);
  };
  
  // 处理文件删除
  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    
    try {
      setDeleteLoading(true);
      await fileApi.deleteFile(selectedFile.id);
      
      // 更新本地状态
      setFiles((prevFiles) => prevFiles.filter((f) => f.id !== selectedFile.id));
      toast.success('文件删除成功');
      closeDeleteModal();
    } catch (err: any) {
      setError('删除文件失败，请重试');
      toast.error('删除文件失败');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // 处理图片预览
  const handlePreviewImage = (file: FileItem) => {
    const apiHost = process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST;
    setPreviewUrl(`${apiHost}/images/${file.file_name}`);
    setPreviewAlt(file.original_name);
    setShowImagePreview(true);
  };
  
  // 关闭预览
  const handleClosePreview = () => {
    setShowImagePreview(false);
    setPreviewUrl(null);
  };
  
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
  
  // 切换分享选项的显示
  const toggleShareOptions = (fileId: number) => {
    setSharingFileId(sharingFileId === fileId ? null : fileId);
  };
  
  // 关闭所有分享面板
  const closeSharePanel = () => {
    setSharingFileId(null);
  };
  
  // 处理点击外部区域关闭分享面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的是分享按钮，不关闭面板（因为按钮点击会触发自己的逻辑）
      if ((event.target as Element).closest('.share-button')) {
        return;
      }
      
      // 如果点击在分享面板外且分享面板正在显示，则关闭它
      const sharePanel = document.querySelector('.share-panel');
      if (sharingFileId && sharePanel && !sharePanel.contains(event.target as Node)) {
        closeSharePanel();
      }
    };

    // 添加点击事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理函数
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sharingFileId]); // 依赖于sharingFileId，确保监听器在面板打开/关闭状态变化时更新
  
  // 复制到剪贴板
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyStatus({ ...copyStatus, [type]: true });
        setTimeout(() => {
          setCopyStatus({ ...copyStatus, [type]: false });
        }, 2000);
        toast.success('已复制到剪贴板');
      })
      .catch(err => {
        toast.error('复制失败，请手动复制');
      });
  };
  
  // 获取文件的分享链接
  const getFileShareLinks = (file: FileItem) => {
    const apiHost = process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST;
    const url = `${apiHost}/images/${file.file_name}`;
    return {
      url: url,
      htmlCode: `<img src="${url}" alt="${file.original_name}" />`,
      markdownCode: `![${file.original_name}](${url})`
    };
  };
  
  // 获取唯一的文件类型列表
  const uniqueFileTypes = Array.from(new Set(files.map(file => file.file_type.split('/')[0])));
  
  // 过滤文件
  const filteredFiles = files.filter((file) => {
    let typeMatch = true;
    
    // 按文件类型过滤
    if (filterType !== 'all') {
      typeMatch = file.file_type.startsWith(filterType);
    }
    
    // 搜索查询
    if (!searchQuery) return typeMatch;
    
    const query = searchQuery.toLowerCase();
    return (
      typeMatch && 
      (file.original_name.toLowerCase().includes(query) || 
       (file.username && file.username.toLowerCase().includes(query)))
    );
  });
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          文件管理
        </h1>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-700 dark:text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 theme-transition"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">所有类型</option>
              {uniqueFileTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'image' ? '图像' : type}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            type="text"
            placeholder="搜索文件或用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-md theme-transition shadow-sm backdrop-blur-sm">
          {error}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center theme-transition">
          <p className="text-gray-600 dark:text-gray-400 theme-transition">
            {searchQuery || filterType !== 'all' ? '没有找到匹配的文件' : '暂无文件'}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden theme-transition">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 theme-transition">
              <thead className="bg-gray-100 dark:bg-gray-900/50 theme-transition">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    文件名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    上传者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    类型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    大小
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    上传时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 theme-transition">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 theme-transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 overflow-hidden flex items-center justify-center theme-transition">
                          {file.file_type.startsWith('image/') ? (
                            <img 
                              className="h-10 w-10 object-cover" 
                              src={`${process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST}/images/${file.file_name}`} 
                              alt={file.original_name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1pbWFnZSI+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIvPjxwb2x5bGluZSBwb2ludHM9IjIxIDEzLjg1IDE2IDEwLjUgNSAyMSIvPjwvc3ZnPg==';
                                target.style.opacity = '0.5';
                                target.style.padding = '2px';
                              }}
                            />
                          ) : (
                            <div className="text-gray-600 dark:text-gray-400 flex items-center justify-center theme-transition">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-800 dark:text-white theme-transition">{file.original_name}</div>
                          <div className="text-xs text-gray-500 theme-transition truncate max-w-xs">
                            {file.file_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300 theme-transition">{file.username || '未知用户'}</div>
                      <div className="text-xs text-gray-500 theme-transition">ID: {file.user_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 theme-transition">
                        {file.file_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 theme-transition">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300 theme-transition group relative cursor-help">
                        {formatDate(file.uploaded_at)}
                        <span className="absolute bottom-full left-0 mb-2 w-44 rounded bg-black/80 p-1 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2 relative">
                        {file.file_type.startsWith('image/') && (
                          <button
                            onClick={() => handlePreviewImage(file)}
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs transition-all duration-300 theme-transition hover:shadow-md hover:shadow-blue-500/20 hover:scale-105 flex items-center space-x-1 relative overflow-hidden group"
                          >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 group-hover:animate-shimmer bg-200%"></span>
                            <svg 
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 relative z-10"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="relative z-10">预览</span>
                          </button>
                        )}
                        <button
                          onClick={() => toggleShareOptions(file.id)}
                          className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 px-2 py-1 rounded text-xs transition-all duration-300 theme-transition hover:shadow-md hover:shadow-green-500/20 hover:scale-105 flex items-center space-x-1 relative overflow-hidden group share-button"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 group-hover:animate-shimmer bg-200%"></span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 relative z-10"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          <span className="relative z-10">分享</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(file)}
                          className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs transition-all duration-300 theme-transition hover:shadow-md hover:shadow-red-500/20 hover:scale-105 flex items-center space-x-1 relative overflow-hidden group"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 group-hover:animate-shimmer bg-200%"></span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 transition-all duration-300 group-hover:rotate-12 relative z-10"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="relative z-10">删除</span>
                        </button>
                      
                        {/* 分享选项面板 */}
                        {sharingFileId === file.id && (
                          <div className="absolute top-full mt-2 right-0 sm:right-0 lg:left-auto lg:right-full lg:mr-2 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 w-72 text-left theme-transition share-panel">
                            {/* 指示箭头 - 右侧面板时显示在顶部，左侧面板时显示在右侧 */}
                            <div className="absolute block lg:hidden top-0 right-8 transform -translate-y-1/2">
                              <div className="bg-white dark:bg-gray-800 w-3 h-3 rotate-45 border-t border-l border-gray-200 dark:border-gray-700 theme-transition"></div>
                            </div>
                            <div className="absolute hidden lg:block top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                              <div className="bg-white dark:bg-gray-800 w-3 h-3 rotate-45 border-r border-t border-gray-200 dark:border-gray-700 theme-transition"></div>
                            </div>
                            
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 theme-transition">分享链接</h4>
                            
                            {/* 输入框 */}
                            <div className="mb-3">
                              <input 
                                type="text" 
                                readOnly 
                                value={getFileShareLinks(file).url}
                                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded py-1 px-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 theme-transition"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                              />
                            </div>
                            
                            {/* 复制按钮组 - 一行显示三个按钮 */}
                            <div className="flex space-x-2 justify-between">
                              <button 
                                onClick={() => copyToClipboard(getFileShareLinks(file).url, 'url')} 
                                className="flex-1 bg-indigo-500 text-white px-2 py-1.5 rounded text-xs hover:bg-indigo-600 transition-all duration-300 relative overflow-hidden group"
                              >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 group-hover:animate-shimmer bg-200%"></span>
                                <span className="relative z-10">复制链接</span>
                              </button>
                              
                              <button 
                                onClick={() => copyToClipboard(getFileShareLinks(file).htmlCode, 'htmlCode')} 
                                className="flex-1 bg-blue-500 text-white px-2 py-1.5 rounded text-xs hover:bg-blue-600 transition-all duration-300 relative overflow-hidden group"
                              >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 group-hover:animate-shimmer bg-200%"></span>
                                <span className="relative z-10">复制HTML</span>
                              </button>
                              
                              <button 
                                onClick={() => copyToClipboard(getFileShareLinks(file).markdownCode, 'markdownCode')} 
                                className="flex-1 bg-green-500 text-white px-2 py-1.5 rounded text-xs hover:bg-green-600 transition-all duration-300 relative overflow-hidden group"
                              >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-500/0 via-green-500/30 to-green-500/0 group-hover:animate-shimmer bg-200%"></span>
                                <span className="relative z-10">复制MD</span>
                              </button>
                            </div>
                            
                            {/* 关闭按钮 */}
                            <button
                              onClick={() => toggleShareOptions(file.id)}
                              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 删除确认模态框 */}
      {isDeleteModalOpen && selectedFile && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          title="删除文件"
          message={`您确定要删除文件 "${selectedFile.original_name}" 吗？该操作将永久删除此文件，无法恢复。`}
          onCancel={closeDeleteModal}
          onConfirm={handleDeleteFile}
          isLoading={deleteLoading}
        />
      )}
      
      {/* 图片预览模态框 */}
      {showImagePreview && previewUrl && (
        <ImagePreview
          imageUrl={previewUrl}
          alt={previewAlt}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default AdminFilesPage;