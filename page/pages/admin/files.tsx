import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FileItem } from '../../types';
import { adminApi, fileApi } from '../../utils/api';
import ImagePreview from '../../components/ImagePreview';
import { toast } from 'react-toastify';

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
  
  // 切换分享选项的显示
  const toggleShareOptions = (fileId: number) => {
    setSharingFileId(sharingFileId === fileId ? null : fileId);
  };
  
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
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-md theme-transition">
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
                      <div className="text-sm text-gray-700 dark:text-gray-300 theme-transition">
                        {new Date(file.upload_time).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 theme-transition">
                        {new Date(file.upload_time).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {file.file_type.startsWith('image/') && (
                          <button
                            onClick={() => handlePreviewImage(file)}
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs transition theme-transition"
                          >
                            预览
                          </button>
                        )}
                        <button
                          onClick={() => toggleShareOptions(file.id)}
                          className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 px-2 py-1 rounded text-xs transition theme-transition"
                        >
                          分享
                        </button>
                        <button
                          onClick={() => openDeleteModal(file)}
                          className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs transition theme-transition"
                        >
                          删除
                        </button>
                      </div>
                      
                      {/* 分享选项面板 */}
                      {sharingFileId === file.id && (
                        <div className="absolute mt-2 right-8 rounded-md bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10 w-72 text-left theme-transition">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 theme-transition">直接链接</label>
                              <div className="flex">
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={getFileShareLinks(file).url}
                                  className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-l py-1 px-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 theme-transition"
                                />
                                <button 
                                  onClick={() => copyToClipboard(getFileShareLinks(file).url, 'url')} 
                                  className="bg-indigo-500 text-white px-2 py-1 rounded-r text-xs hover:bg-indigo-600 transition-colors"
                                >
                                  {copyStatus['url'] ? '已复制' : '复制'}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 theme-transition">HTML 代码</label>
                              <div className="flex">
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={getFileShareLinks(file).htmlCode} 
                                  className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-l py-1 px-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 theme-transition"
                                />
                                <button 
                                  onClick={() => copyToClipboard(getFileShareLinks(file).htmlCode, 'htmlCode')} 
                                  className="bg-indigo-500 text-white px-2 py-1 rounded-r text-xs hover:bg-indigo-600 transition-colors"
                                >
                                  {copyStatus['htmlCode'] ? '已复制' : '复制'}
                                </button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 theme-transition">Markdown 代码</label>
                              <div className="flex">
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={getFileShareLinks(file).markdownCode} 
                                  className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-l py-1 px-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 theme-transition"
                                />
                                <button 
                                  onClick={() => copyToClipboard(getFileShareLinks(file).markdownCode, 'markdownCode')} 
                                  className="bg-indigo-500 text-white px-2 py-1 rounded-r text-xs hover:bg-indigo-600 transition-colors"
                                >
                                  {copyStatus['markdownCode'] ? '已复制' : '复制'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden theme-transition">
            <div className="bg-red-500 px-6 py-4">
              <h3 className="text-white text-lg font-medium">删除文件</h3>
              <p className="text-red-200 text-sm">此操作不可撤销</p>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 theme-transition">
                您确定要删除文件 <span className="font-bold">{selectedFile.original_name}</span> 吗？该操作将永久删除此文件，无法恢复。
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteFile}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? '处理中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
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