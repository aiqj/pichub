'use client';
import { useState, useEffect } from 'react';
import AdminNotification from '../../components/AdminNotification';

interface File {
  id: number;
  user_id: number;
  username: string;
  file_name: string;
  original_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export default function AdminFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [filter, setFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/admin/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取文件列表失败');
      }

      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error('获取文件列表失败:', error);
      setError('获取文件列表失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId: fileToDelete.id })
      });

      if (!response.ok) {
        throw new Error('删除文件失败');
      }

      setNotification({
        show: true,
        type: 'success',
        message: '文件已成功删除'
      });
      
      // 更新文件列表
      setFiles(files.filter(file => file.id !== fileToDelete.id));
      setShowDeleteModal(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('删除文件失败:', error);
      setNotification({
        show: true,
        type: 'error',
        message: '删除文件失败，请重试'
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setNotification({
        show: true,
        type: 'success',
        message: '已复制到剪贴板'
      });
    }).catch(() => {
      setNotification({
        show: true,
        type: 'error',
        message: '复制失败，请手动复制'
      });
    });
  };

  // 过滤文件列表
  const filteredFiles = files.filter(file => {
    const matchesFilter = filter ? 
      file.original_name.toLowerCase().includes(filter.toLowerCase()) || 
      file.file_name.toLowerCase().includes(filter.toLowerCase()) ||
      file.file_type.toLowerCase().includes(filter.toLowerCase()) 
      : true;
    
    const matchesUser = userFilter ? 
      file.username.toLowerCase().includes(userFilter.toLowerCase()) : true;
    
    return matchesFilter && matchesUser;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">文件管理</h1>
      
      {/* 过滤器 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="file-filter" className="block text-sm font-medium text-gray-700 mb-1">按文件名/类型过滤</label>
            <input
              type="text"
              id="file-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入文件名或类型..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-1">按用户名过滤</label>
            <input
              type="text"
              id="user-filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入用户名..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <p className="text-sm text-gray-600">
            显示 {filteredFiles.length} 个文件（共 {files.length} 个）
          </p>
          <button 
            className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            onClick={fetchFiles}
          >
            <i className="fas fa-sync-alt mr-1"></i> 刷新
          </button>
        </div>
      </div>
      
      {/* 文件列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文件
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上传者
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  大小
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上传时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <tr key={file.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {file.file_type.startsWith('image/') ? (
                          <img 
                            className="h-10 w-10 object-cover" 
                            src={`/images/${file.file_name}`} 
                            alt={file.original_name} 
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded">
                            <i className="fas fa-file text-gray-400"></i>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file.original_name}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                          {file.file_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{file.username}</div>
                    <div className="text-xs text-gray-500">ID: {file.user_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatSize(file.file_size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {file.file_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.uploaded_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/images/${file.file_name}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="复制链接"
                      >
                        <i className="fas fa-link"></i>
                      </button>
                      <a
                        href={`/images/${file.file_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                        title="查看文件"
                      >
                        <i className="fas fa-eye"></i>
                      </a>
                      <button
                        onClick={() => {
                          setFileToDelete(file);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="删除文件"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 删除文件确认对话框 */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="mb-4 text-gray-600">
              您确定要删除文件 <span className="font-medium text-gray-900">{fileToDelete.original_name}</span> 吗？此操作不可逆。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setShowDeleteModal(false);
                  setFileToDelete(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                onClick={handleDeleteFile}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通知组件 */}
      <AdminNotification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
} 