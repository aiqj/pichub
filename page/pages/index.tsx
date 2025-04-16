import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Button from '../components/ui/Button';
import { fileApi } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import dynamic from 'next/dynamic';

// 动态导入图片预览组件
const ImagePreview = dynamic(() => import('../components/ImagePreview'), {
  loading: () => <div className="w-full h-64 bg-gray-800 animate-pulse rounded-lg"></div>,
  ssr: false
});

// 文件类型图标
const FileTypeIcon = ({ type }: { type: string }) => {
  const getIconByType = (fileType: string) => {
    const type = fileType.split('/')[1]?.toUpperCase() || 'FILE';
    
    return (
      <div className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-700 theme-transition">
        {type}
      </div>
    );
  };
  
  return getIconByType(type);
};

const Home = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0, hasMore: false });
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewName, setPreviewName] = useState('');
  const apiEndpoint = process.env.NEXT_PUBLIC_API_HOST || '';

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化上传日期
  const formatUploadTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      return `星期${weekdays[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
        date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
  };

  // 加载公开文件
  const loadPublicFiles = async (offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fileApi.getPublicFiles(10, offset);
      if (response.data && response.data.files) {
        if (offset === 0) {
          setFiles(response.data.files);
        } else {
          setFiles(prev => [...prev, ...response.data.files]);
        }
        setPagination(response.data.pagination);
      } else {
        setError('获取图片列表失败');
      }
    } catch (err) {
      setError('无法加载图片，请稍后再试');
      console.error('Failed to load public files:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载更多文件
  const loadMore = () => {
    if (pagination.hasMore) {
      loadPublicFiles(pagination.offset + pagination.limit);
    }
  };

  // 打开图片预览
  const openPreview = (file: any) => {
    const imageUrl = `${apiEndpoint}/images/${file.file_name}`;
    setPreviewUrl(imageUrl);
    setPreviewName(file.original_name);
    setShowPreview(true);
  };

  // 初始加载
  useEffect(() => {
    loadPublicFiles();
  }, []);

  return (
    <div className="min-h-screen">
      {/* 顶部横幅 - 简约现代风格 */}
      <div className="relative w-full bg-[#fafafa] dark:bg-gray-900 min-h-[85vh] overflow-hidden">
        {/* 背景网格 */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] dark:bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)]" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            {/* 左侧内容区 */}
            <div className="md:w-5/12 space-y-8 md:pt-16">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                PicHub
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
                简单、高效的图片托管服务，让分享更轻松。
              </p>

              {/* 特性展示 */}
              <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="flex items-start space-x-3 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">快速上传</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">支持拖拽、粘贴、点击多种上传方式</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">安全可靠</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">采用先进加密技术，确保图片安全存储</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">灵活分享</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">支持多种分享格式，一键复制使用</p>
                  </div>
                </div>
              </div>
            </div>
            {/* 右侧内容区 */}            
            <div className="md:w-7/12 relative">
              {/* 模拟macOS窗口 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden max-w-lg mx-auto border border-gray-200 dark:border-gray-700 theme-transition">
                {/* 窗口标题栏 */}
                <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <div className="flex space-x-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  </div>
                </div>
                
                {/* 窗口内容区 */}
                <div className="p-6">
                  {/* 照片展示 */}
                  <div className="relative h-64 mx-auto mb-10">
                    {/* 底层照片 */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-60 h-44 bg-blue-100 dark:bg-blue-900/30 rounded-md shadow-lg rotate-[-8deg] transition-all duration-300 hover:rotate-[-10deg] hover:scale-105">
                      <div className="w-full h-full bg-cover bg-center rounded-md" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579353977828-2a4eab540b9a')" }}></div>
                    </div>
                    
                    {/* 中层照片 */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-60 h-44 bg-purple-100 dark:bg-purple-900/30 rounded-md shadow-lg rotate-[-2deg] transition-all duration-300 hover:rotate-[0deg] hover:scale-105">
                      <div className="w-full h-full bg-cover bg-center rounded-md" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518791841217-8f162f1e1131')" }}></div>
                    </div>
                    
                    {/* 顶层照片 */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-60 h-44 bg-indigo-100 dark:bg-indigo-900/30 rounded-md shadow-lg rotate-[4deg] transition-all duration-300 hover:rotate-[8deg] hover:scale-105">
                      <div className="w-full h-full bg-cover bg-center rounded-md" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1615220368123-9be743f0cfa9')" }}></div>
                    </div>
                  </div>
                  
                  {/* 简单分享图标展示 */}
                  <div className="flex justify-center space-x-8">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 shadow-md">
                        <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">URL</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 shadow-md">
                        <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">HTML</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 shadow-md">
                        <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <span className="mt-2 text-xs text-gray-600 dark:text-gray-400">Markdown</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 装饰性元素 */}
              <div className="absolute -bottom-16 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 为什么选择 PicHub */}
      <div className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            为什么选择 <span className="text-purple-600">PicHub</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white shadow-md rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-purple-100 rounded-full">
                <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">快速上传</h3>
              <p className="text-gray-600">上传速度快，无需等待，支持拖拽、粘贴、点击多种上传方式。</p>
            </div>
            
            <div className="bg-white shadow-md rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-blue-100 rounded-full">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">安全可靠</h3>
              <p className="text-gray-600">采用先进的加密和存储技术，确保您的图片安全存储，不会丢失。</p>
            </div>
            
            <div className="bg-white shadow-md rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-indigo-100 rounded-full">
                <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">灵活分享</h3>
              <p className="text-gray-600">多种分享方式，支持直接链接、HTML和Markdown格式，适用于各种场景。</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 最新公开图片 */}
      <div className="w-full bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">
            最新公开图片
          </h2>
          <p className="text-center text-gray-600 mb-12">
            探索用户分享的精彩图片，获取灵感，发现美好
          </p>
          
          {loading && files.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => loadPublicFiles()}
              >
                重试
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {files.map((file) => {
                  const imageUrl = `${apiEndpoint}/images/${file.file_name}`;
                  return (
                    <div 
                      key={file.id} 
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => openPreview(file)}
                    >
                      <div className="aspect-video bg-gray-100 overflow-hidden relative">
                        <img 
                          src={imageUrl} 
                          alt={file.original_name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <FileTypeIcon type={file.file_type} />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 truncate" title={file.original_name}>
                          {file.original_name}
                        </h3>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span 
                            className="group relative cursor-help"
                            title={file.uploaded_at}
                          >
                            {formatUploadTime(file.uploaded_at)}
                            <span className="absolute bottom-full right-0 mb-2 w-44 rounded bg-black/80 p-1 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                              {new Date(file.uploaded_at).toLocaleString('zh-CN')}
                            </span>
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{file.username}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {pagination.hasMore && (
                <div className="flex justify-center mt-10">
                  <Button 
                    variant="secondary" 
                    onClick={loadMore}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? '加载中...' : '加载更多图片'}
                  </Button>
                </div>
              )}
              
              {files.length === 0 && !loading && (
                <div className="text-center p-12 bg-white border border-gray-200 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 text-lg">还没有公开的图片</p>
                  <Button 
                    variant="primary" 
                    className="mt-4"
                    onClick={() => router.push('/upload')}
                  >
                    上传第一张图片
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 底部行动号召 */}
      <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始使用了吗？</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            现在就开始上传您的图片，获取更好的托管体验，安全、高效、便捷。
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => router.push('/upload')}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              立即上传
            </Button>
            {!isAuthenticated && (
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-transparent border-2 border-white hover:bg-white/10"
              >
                注册账号
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* 图片预览 */}
      {showPreview && (
        <ImagePreview 
          imageUrl={previewUrl} 
          onClose={() => setShowPreview(false)}
          alt={previewName}
        />
      )}
    </div>
  );
};

export default Home;