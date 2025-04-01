import React, { useState, useRef, useEffect } from 'react';
import Button from '../components/ui/Button';
import { useRouter } from 'next/router';
import { CodeSnippet } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  console.log('渲染Home组件');
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedData, setUploadedData] = useState<CodeSnippet | null>(null);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const apiEndpoint = process.env.NEXT_PUBLIC_API_HOST || '';
  const { isAuthenticated, user, loading, login } = useAuth();
  
  console.log('Home状态：', { isAuthenticated, loading });
  
  // 验证文件类型和大小
  const isValidFile = React.useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!validTypes.includes(file.type)) {
      setErrorMsg('不支持的文件类型。请上传JPEG, PNG, WebP, GIF或SVG图片。');
      return false;
    }
    
    if (file.size > maxSize) {
      setErrorMsg(`文件大小超过限制（最大50MB）。当前文件大小：${formatFileSize(file.size)}`);
      return false;
    }
    
    return true;
  }, [setErrorMsg]);
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 添加额外的DEBUG信息
  useEffect(() => {
    const info = `
      API端点: ${apiEndpoint}
      是否已认证: ${isAuthenticated}
      认证状态加载中: ${loading}
      用户信息: ${user ? JSON.stringify(user) : '无'}
      本地Token: ${typeof window !== 'undefined' ? localStorage.getItem('token') ? '存在' : '不存在' : 'SSR模式'}
      本地User数据: ${typeof window !== 'undefined' ? localStorage.getItem('user') ? '存在' : '不存在' : 'SSR模式'}
      环境: ${process.env.NODE_ENV}
    `;
    setDebugInfo(info);
    
    // 检查并打印重要信息到控制台
    console.log('=============== DEBUG INFO ===============');
    console.log('API端点:', apiEndpoint);
    console.log('是否已认证:', isAuthenticated);
    console.log('认证状态加载中:', loading);
    console.log('用户信息:', user);
    if (typeof window !== 'undefined') {
      console.log('本地Token:', localStorage.getItem('token'));
      try {
        const savedUser = localStorage.getItem('user');
        console.log('本地User数据:', savedUser ? JSON.parse(savedUser) : null);
      } catch (e) {
        console.error('解析用户数据失败:', e);
      }
    }
    console.log('环境:', process.env.NODE_ENV);
    console.log('========================================');
  }, [apiEndpoint, isAuthenticated, loading, user]);
  
  // 认证检查
  useEffect(() => {
    // 只有当认证状态加载完成且确认未认证时才重定向
    if (!loading && !isAuthenticated && typeof window !== 'undefined') {
      console.log('认证状态检查：未登录，正在重定向到登录页');
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);
  
  // 处理粘贴上传
  const handlePaste = React.useCallback((event: ClipboardEvent) => {
    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) return;
    
    let imageItem = null;
    
    // 检查剪贴板内容
    for (let i = 0; i < clipboardItems.length; i++) {
      if (clipboardItems[i].type.indexOf('image') !== -1) {
        imageItem = clipboardItems[i];
        break;
      }
    }
    
    // 如果有图片，处理它
    if (imageItem) {
      const blob = imageItem.getAsFile();
      if (blob) {
        const timestamp = new Date().getTime();
        // 创建一个伪File对象，因为部分浏览器粘贴的是blob
        const file = new File([blob], `screenshot-${timestamp}.png`, { type: 'image/png' });
        
        // 处理文件
        if (isValidFile(file)) {
          setFile(file);
          setErrorMsg('');
        }
      }
    }
  }, [isValidFile, setFile, setErrorMsg]);  // 添加相关依赖
  
  // 监听粘贴事件 - 这个useEffect应该总是被调用，不能放在条件渲染后面
  useEffect(() => {
    // 只有当用户已登录且非加载状态时，才添加粘贴事件监听
    if (isAuthenticated && !loading && typeof window !== 'undefined') {
      console.log('添加粘贴事件监听');
      document.addEventListener('paste', handlePaste as unknown as EventListener);
      
      return () => {
        console.log('移除粘贴事件监听');
        document.removeEventListener('paste', handlePaste as unknown as EventListener);
      };
    }
    return undefined; // 当条件不满足时返回空清理函数
  }, [isAuthenticated, loading, handlePaste]); // 添加所有相关依赖
  
  // 处理文件拖放
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
      setErrorMsg('');
    }
  };
  
  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
        setErrorMsg('');
      }
    }
  };
  
  // 处理文件上传
  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('请先选择一个文件');
      return;
    }
    
    // 获取JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('未登录或会话已过期，请重新登录');
      return;
    }
    
    try {
      setIsUploading(true);
      setErrorMsg('');
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });
      
      // 创建Promise来处理XHR响应
      const uploadPromise = new Promise<any>((resolve, reject) => {
        // 设置完成回调
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('上传成功但响应格式错误'));
            }
          } else {
            let errorMessage = '上传失败';
            try {
              const error = JSON.parse(xhr.responseText);
              errorMessage = error.error || errorMessage;
              
              // 如果是认证错误，可能是token过期
              if (xhr.status === 401) {
                reject(new Error('认证已过期，请重新登录'));
              }
            } catch (e) {
              // 解析错误，使用默认错误消息
            }
            reject(new Error(errorMessage));
          }
        });
        
        // 设置错误回调
        xhr.addEventListener('error', () => {
          reject(new Error('网络错误，请检查连接'));
        });
        
        // 设置超时回调
        xhr.addEventListener('timeout', () => {
          reject(new Error('上传超时，请重试'));
        });
      });
      
      // 使用API端点
      const uploadUrl = `${apiEndpoint}/api/upload`;
      
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 60000; // 60秒超时
      xhr.send(formData);
      
      // 等待上传完成
      const response = await uploadPromise;
      
      setUploadSuccess(true);
      const imageUrl = response.url || response.fileUrl || response.data?.url;
      
      // 创建代码片段
      const snippets: CodeSnippet = {
        url: imageUrl,
        htmlCode: `<img src="${imageUrl}" alt="${file.name}" />`,
        markdownCode: `![${file.name}](${imageUrl})`,
      };
      
      setUploadedData(snippets);
      
      // 重置文件选择
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('上传错误:', error);
      setErrorMsg(error.message || '上传过程中发生错误');
      
      // 如果是认证错误，跳转到登录页
      if (error.message === '认证已过期，请重新登录') {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } finally {
      setIsUploading(false);
    }
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
      console.error('复制失败:', err);
    }
  };
  
  // 重置状态，准备下一次上传
  const handleReset = () => {
    setUploadSuccess(false);
    setUploadedData(null);
    setFile(null);
    setErrorMsg('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 只有在认证状态完成加载后才能进行正常渲染，否则显示加载器
  if (loading) {
    console.log('显示加载中状态');
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-400">正在验证登录状态...</p>
      </div>
    );
  }
  
  // 在认证状态确认后，未认证时只渲染此内容，不再重复重定向
  if (!isAuthenticated) {
    console.log('显示未认证内容');
    return (
      <div className="flex items-center justify-center min-h-screen flex-col">
        <div className="text-center p-6 max-w-md bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-4">
            需要登录
          </h2>
          <p className="text-gray-400 mb-4">您需要登录才能访问此页面</p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="primary" 
              onClick={() => router.push('/login')}
            >
              前往登录
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => {
                const savedToken = localStorage.getItem('token');
                const savedUser = localStorage.getItem('user');
                
                if (savedToken && savedUser) {
                  try {
                    const userData = JSON.parse(savedUser);
                    login(savedToken, userData);
                    window.location.reload(); // 强制刷新页面
                  } catch (e) {
                    console.error('恢复会话失败:', e);
                    setErrorMsg('无法恢复会话，请重新登录');
                  }
                } else {
                  setErrorMsg('无本地登录信息，请重新登录');
                }
              }}
            >
              尝试恢复会话
            </Button>
          </div>
          
          <div className="mt-8 text-xs text-gray-500 text-left">
            <h3 className="font-medium mb-2">调试信息:</h3>
            <pre className="whitespace-pre-wrap overflow-x-auto bg-gray-900/50 p-3 rounded">
              {debugInfo}
            </pre>
          </div>
        </div>
      </div>
    );
  }
  
  // 以下是已认证用户的界面
  console.log('显示已认证用户界面');
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-6">
        文件上传
      </h1>
      
      {/* 调试信息，仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-3xl mb-4 p-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl text-xs">
          <details>
            <summary className="cursor-pointer text-gray-400 hover:text-gray-300">显示调试信息</summary>
            <pre className="mt-2 whitespace-pre-wrap overflow-x-auto bg-gray-900/50 p-3 rounded text-gray-400">
              {debugInfo}
            </pre>
          </details>
        </div>
      )}
      
      <div className="w-full max-w-3xl bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
        {!uploadSuccess ? (
          <>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-gray-600 hover:border-indigo-400 hover:bg-gray-700/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-16 w-16 ${isDragging ? 'text-indigo-400' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="text-lg text-gray-300 font-medium">
                  {isDragging ? '释放文件以上传' : '拖放文件或点击此处选择'}
                </p>
                <p className="text-sm text-gray-500">
                  支持 JPEG, PNG, WebP, GIF, SVG 格式，最大50MB
                </p>
              </div>
            </div>
            
            {file && (
              <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-200 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {file.type} - {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    loading={isUploading}
                    disabled={isUploading}
                  >
                    {isUploading ? '上传中...' : '上传'}
                  </Button>
                </div>
                
                {isUploading && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}
            
            {errorMsg && (
              <div className="mt-4 p-4 bg-red-900/30 rounded-lg border border-red-800 text-red-400">
                {errorMsg}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-green-900/30 p-4 border border-green-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-100">上传成功！</h2>
            
            {uploadedData && (
              <div className="w-full space-y-4 mt-4">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">预览</span>
                  </div>
                  <div className="flex justify-center bg-gray-900 p-4 rounded-md">
                    <img
                      src={uploadedData.url}
                      alt="上传预览"
                      className="max-h-64 max-w-full object-contain"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">直接链接</span>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => copyToClipboard(uploadedData.url, 'url')}
                    >
                      {copyStatus.url ? '已复制！' : '复制'}
                    </Button>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-md">
                    <p className="text-gray-400 break-all text-sm">{uploadedData.url}</p>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">HTML代码</span>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => copyToClipboard(uploadedData.htmlCode, 'html')}
                    >
                      {copyStatus.html ? '已复制！' : '复制'}
                    </Button>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-md">
                    <p className="text-gray-400 break-all text-sm">{uploadedData.htmlCode}</p>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">Markdown代码</span>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => copyToClipboard(uploadedData.markdownCode, 'markdown')}
                    >
                      {copyStatus.markdown ? '已复制！' : '复制'}
                    </Button>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-md">
                    <p className="text-gray-400 break-all text-sm">{uploadedData.markdownCode}</p>
                  </div>
                </div>
              </div>
            )}
            
            <Button variant="primary" onClick={handleReset}>
              上传新图像
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-gray-800/30 backdrop-blur-sm p-4 max-w-sm rounded-xl border border-gray-700 text-center">
        <h3 className="text-gray-300 font-medium mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          用户信息
        </h3>
        {user && (
          <div className="text-sm text-gray-400 mb-2">
            <p>账户: {user.username}</p>
            <p>角色: {user.role === 'admin' ? '管理员' : '普通用户'}</p>
          </div>
        )}
      </div>
      
      <div className="mt-12 max-w-3xl w-full text-center">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-4">
          关于PicHub
        </h2>
        <p className="text-gray-300 mb-4">
          PicHub是一个高效、安全的图像管理平台，支持多种图像格式，提供便捷的图像分享和管理功能。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-200">多格式支持</h3>
            <p className="text-gray-400 text-sm mt-1">支持JPEG, PNG, WebP, GIF, SVG等多种图像格式</p>
          </div>
          
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-200">安全存储</h3>
            <p className="text-gray-400 text-sm mt-1">使用先进的加密技术确保您的图像安全存储</p>
          </div>
          
          <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-indigo-400 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-200">便捷分享</h3>
            <p className="text-gray-400 text-sm mt-1">一键复制多种格式的链接代码，方便在各种平台分享</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;