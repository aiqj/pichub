import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FileItem } from '../../types';
import { adminApi, fileApi } from '../../utils/api';

const AdminFilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
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
        console.error('获取文件失败:', err);
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
      closeDeleteModal();
    } catch (err: any) {
      console.error('删除文件失败:', err);
      setError('删除文件失败，请重试');
    } finally {
      setDeleteLoading(false);
    }
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
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <div className="bg-red-900/30 border border-red-800 text-red-400 px-6 py-4 rounded-md">
          {error}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">
            {searchQuery || filterType !== 'all' ? '没有找到匹配的文件' : '暂无文件'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    文件名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    用户
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    类型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    大小
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    上传时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/10 divide-y divide-gray-700">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-900 overflow-hidden">
                          {file.file_type.startsWith('image/') ? (
                            <img 
                              src={`${process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST}/images/${file.file_name}`} 
                              alt="" 
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center bg-gray-800">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-200 truncate max-w-xs" title={file.original_name}>
                            {file.original_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={file.file_name}>
                            {file.file_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {file.username || '未知用户'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/50 text-blue-300">
                        {file.file_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(file.uploaded_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST}/images/${file.file_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 mr-4"
                      >
                        查看
                      </a>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openDeleteModal(file)}
                      >
                        删除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {isDeleteModalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-gray-200 mb-4">
              删除文件
            </h3>
            
            <p className="text-gray-300 mb-6">
              您确定要删除文件 <span className="font-semibold text-red-400">{selectedFile.original_name}</span> 吗？此操作无法撤销。
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={closeDeleteModal}>
                取消
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteFile}
                loading={deleteLoading}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {filteredFiles.length > 0 && (
        <div className="mt-4 text-sm text-gray-400 text-center">
          显示 {filteredFiles.length} 个文件
        </div>
      )}
    </div>
  );
};

export default AdminFilesPage;