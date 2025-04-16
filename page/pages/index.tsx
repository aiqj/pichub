import React, { useState, useEffect, useMemo } from 'react';
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

  // 生成固定的图片纵横比映射，确保每次渲染使用相同的值
  const aspectRatioMap = useMemo(() => {
    return new Map();
  }, []);

  // 获取图片真实纵横比的函数
  const getImageAspectRatio = (url, fileId) => {
    if (aspectRatioMap.has(fileId)) {
      return aspectRatioMap.get(fileId);
    }
    
    // 默认纵横比，在图片加载前使用
    let defaultRatio = 'auto';
    
    // 确保代码只在客户端执行
    if (typeof window !== 'undefined') {
      // 创建一个图片对象来获取实际尺寸
      const img = new window.Image();
      img.src = url;
      
      img.onload = () => {
        // 计算真实的纵横比
        const realRatio = `${img.width}/${img.height}`;
        aspectRatioMap.set(fileId, realRatio);
        
        // 强制重新渲染以应用新的纵横比
        // 注意：在实际应用中这可能导致性能问题，理想情况下应该使用更精细的状态更新方式
        setFiles(prevFiles => [...prevFiles]);
      };
    }
    
    return defaultRatio;
  };

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
            <div className="md:w-7/12 relative top-[3.5rem]">
              {/* 模拟无框窗口 */}
              <div className="bg-black dark:bg-white rounded-xl shadow-xl overflow-hidden max-w-md mx-auto border border-gray-950 dark:border-gray-400 theme-transition">
                {/* 窗口标题栏 */}
                <div className="bg-black dark:bg-gray-100 px-3 py-1.5 border-b border-gray-950 dark:border-gray-400 flex items-center theme-transition">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  </div>
                </div>
                
                {/* 窗口内容区 - 极简设计 */}
                <div className="relative">
                  {/* 单张图片全屏展示 */}
                  <img 
                    src="https://pichub.8008893.workers.dev/images/d96edca3-5083.png"
                    alt="Cat portrait" 
                    className="w-full h-72 object-cover"
                  />
                  
                  {/* 悬浮分享按钮 */}
                  <div className="absolute bottom-4 right-4 flex items-center space-x-2 transition-opacity duration-300 group">
                    <div className="bg-black/70 dark:bg-white/70 backdrop-blur-sm rounded-full p-2 flex items-center space-x-2 theme-transition">
                      <button className="w-8 h-8 rounded-full bg-white/10 dark:bg-gray-100/80 flex items-center justify-center hover:bg-white/20 dark:hover:bg-gray-200/80 transition-colors">
                        <svg className="w-4 h-4 text-white dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                    
                      <button className="w-8 h-8 rounded-full bg-white/10 dark:bg-gray-100/80 flex items-center justify-center hover:bg-white/20 dark:hover:bg-gray-200/80 transition-colors">
                        <svg className="w-4 h-4 text-white dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </button>
                    
                      <button className="w-8 h-8 rounded-full bg-white/10 dark:bg-gray-100/80 flex items-center justify-center hover:bg-white/20 dark:hover:bg-gray-200/80 transition-colors">
                        <svg className="w-4 h-4 text-white dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </button>
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

        {/* 向下滚动提示 */}
        <div 
          className="absolute bottom-8 left-0 right-0 mx-auto w-max flex flex-col items-center text-gray-600 dark:text-gray-400 animate-bounce cursor-pointer"
          onClick={() => {
            const gallerySection = document.getElementById('gallery');
            if (gallerySection) {
              gallerySection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-md mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <span className="text-sm font-medium">向下滚动，发现美好</span>
        </div>
      </div>
      
      {/* 图片展示 */}
      <div id="gallery" className="w-full bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200">
            拾光计划：发现每一刻的精彩
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            探索用户分享的精彩图片，获取灵感，发现美好
          </p>
          
          {loading && files.length === 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse break-inside-avoid mb-6">
                  <div className={`aspect-${index % 2 === 0 ? 'video' : 'square'} bg-gray-200 dark:bg-gray-700`}></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400">{error}</p>
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
              {/* 图片瀑布流容器 - 添加相对定位以便定位遮罩层 */}
              <div className="relative"> {/* 添加底部内边距为遮罩层留出空间 */}
                {/* 图片瀑布流 */}
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance] space-y-0">
                {files.map((file) => {
                  const imageUrl = `${apiEndpoint}/images/${file.file_name}`;
                    
                    // 使用真实图片的纵横比
                    const aspectRatio = getImageAspectRatio(imageUrl, file.id);
                    
                  return (
                    <div 
                      key={file.id} 
                        className="mb-3 overflow-hidden rounded-md group break-inside-avoid cursor-pointer relative inline-block w-full"
                      onClick={() => openPreview(file)}
                    >
                        <img 
                          src={imageUrl} 
                          alt={file.original_name}
                          className="w-full object-cover transition-all duration-500 hover:brightness-110 group-hover:scale-110 group-hover:shadow-lg"
                          style={{ aspectRatio }}
                          loading="lazy"
                          onLoad={(e) => {
                            // 图片加载完成后，设置正确的宽高比
                            const img = e.target as HTMLImageElement;
                            if (img.naturalWidth && img.naturalHeight) {
                              img.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`;
                            }
                          }}
                        />
                        
                        {/* 分享按钮组 - 提高 z-index，放在最上层 */}
                        <div 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2 z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          {/* URL 链接 */}
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              try {
                                navigator.clipboard.writeText(`${apiEndpoint}/images/${file.file_name}`);
                                
                                // 显示复制成功提示
                                const target = e.currentTarget;
                                const originalContent = target.innerHTML;
                                target.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
                                
                                setTimeout(() => {
                                  target.innerHTML = originalContent;
                                }, 1000);
                              } catch (err) {
                                console.error('Failed to copy:', err);
                              }
                            }}
                            title="复制URL链接"
                          >
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>

                          {/* HTML 代码 */}
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              try {
                                navigator.clipboard.writeText(`<img src="${apiEndpoint}/images/${file.file_name}" alt="${file.original_name}" />`);
                                
                                // 显示复制成功提示
                                const target = e.currentTarget;
                                const originalContent = target.innerHTML;
                                target.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
                                
                                setTimeout(() => {
                                  target.innerHTML = originalContent;
                                }, 1000);
                              } catch (err) {
                                console.error('Failed to copy:', err);
                              }
                            }}
                            title="复制HTML代码"
                          >
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          </button>

                          {/* Markdown 代码 */}
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              try {
                                navigator.clipboard.writeText(`![${file.original_name}](${apiEndpoint}/images/${file.file_name})`);
                                
                                // 显示复制成功提示
                                const target = e.currentTarget;
                                const originalContent = target.innerHTML;
                                target.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
                                
                                setTimeout(() => {
                                  target.innerHTML = originalContent;
                                }, 1000);
                              } catch (err) {
                                console.error('Failed to copy:', err);
                              }
                            }}
                            title="复制Markdown代码"
                          >
                            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Hover overlay with subtle info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                          <div className="flex items-center justify-between text-white text-opacity-90 text-xs">
                            <div className="flex items-center space-x-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                              <span className="truncate max-w-[100px]">{file.username}</span>
                            </div>
                            <div className="flex items-center">
                              <FileTypeIcon type={file.file_type} />
                            </div>
                          </div>
                        </div>
                        
                        {/* NSFW tag if needed */}
                        {file.tags && file.tags.includes('nsfw') && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                            NSFW
                      </div>
                        )}
                    </div>
                  );
                })}
              </div>
              
                {/* 底部渐变遮罩层 - 只在有更多数据时显示 */}
                {pagination.hasMore && (
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50/95 via-gray-50/70 to-transparent dark:from-gray-900/95 dark:via-gray-900/70 pointer-events-none"></div>
                )}
                
                {/* 加载更多按钮 - 放置在渐变遮罩层上 */}
              {pagination.hasMore && (
                  <div className="absolute bottom-10 left-0 right-0 text-center z-10">
                    <button
                    onClick={loadMore}
                    disabled={loading}
                      className="inline-flex items-center justify-center px-8 py-2.5 text-sm font-medium text-gray-600 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 transition-colors focus:outline-none backdrop-blur-sm"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>加载中...</span>
                        </>
                      ) : (
                        <span>加载更多</span>
                      )}
                    </button>
                </div>
              )}
              </div>
              
              {files.length === 0 && !loading && (
                <div className="text-center p-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">还没有公开的图片</p>
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