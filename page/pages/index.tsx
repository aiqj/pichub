import React, { useState, useRef, useEffect } from 'react';
import Button from '../components/ui/Button';
import { useRouter } from 'next/router';
import { CodeSnippet } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ImagePreview from '../components/ImagePreview';

const Home = () => {
  const router = useRouter();
  const { isAuthenticated, user, login, loading } = useAuth();
  const apiEndpoint = process.env.NEXT_PUBLIC_API_HOST || '';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<CodeSnippet | null>(null);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 检查认证状态并重定向
  useEffect(() => {
    if (!loading && !isAuthenticated && typeof window !== 'undefined') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 处理文件粘贴上传
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith('image/')) {
          setSelectedFile(pastedFile);
          handleUpload(pastedFile);
        }
      }
    };
    
    window.addEventListener('paste', handlePaste);
    
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);
  
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
      setSelectedFile(droppedFile);
      setErrorMsg('');
      
      // 生成预览URL
      const objectUrl = URL.createObjectURL(droppedFile);
      setPreviewUrl(objectUrl);
    }
  };
  
  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setSelectedFile(selectedFile);
        setErrorMsg('');
        
        // 生成预览URL
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);
        
        // 返回一个清理函数，在组件卸载时释放URL
        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      }
    }
  };
  
  // 处理文件上传
  const handleUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setErrorMsg(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${apiEndpoint}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }
      
      const result = await response.json();
      setUploadResult(result);
      setSelectedFile(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };
  
  // 复制URL
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        setErrorMsg('复制失败，请手动复制');
      });
  };
  
  // 重置状态，准备下一次上传
  const handleReset = () => {
    setUploadResult(null);
    setSelectedFile(null);
    setErrorMsg(null);
    setPreviewUrl(null);
    setShowImagePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 清理预览URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
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
  
  // 图片预览模态框
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400">加载中...</p>
      </div>
    );
  }
  
  // 如果未认证，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            PicHub
          </h1>
          <p className="text-xl md:text-2xl text-center mb-12 text-gray-300">
            简单、安全、高效的图片托管服务
          </p>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-8 w-full max-w-md mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-6 text-gray-200">未登录</h2>
              <p className="text-gray-400 mb-8">请登录后使用图片上传功能</p>
              {errorMsg && (
                <div className="mb-6 p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-400">
                  {errorMsg}
                </div>
              )}
            </div>
            
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
          </div>
        </div>
      </div>
    );
  }
  
  // 以下是已认证用户的界面
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-6">
        文件上传
      </h1>
      
      <div className="w-full max-w-3xl bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
        {!uploadResult ? (
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
            
            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-200 font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {selectedFile.type} - {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {previewUrl && (
                      <Button
                        variant="secondary"
                        onClick={() => setShowImagePreview(true)}
                      >
                        预览
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      onClick={() => handleUpload(selectedFile)}
                      loading={isUploading}
                      disabled={isUploading}
                    >
                      {isUploading ? '上传中...' : '上传'}
                    </Button>
                  </div>
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
            
            {/* 图片预览模态框 */}
            {showImagePreview && previewUrl && (
              <ImagePreview 
                imageUrl={previewUrl} 
                onClose={() => setShowImagePreview(false)}
                alt={selectedFile?.name || '预览图片'}
              />
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
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => {
                        setPreviewUrl(uploadedData.url);
                        setShowImagePreview(true);
                      }}
                    >
                      放大查看
                    </Button>
                  </div>
                  <div 
                    className="flex justify-center bg-gray-900 p-4 rounded-md cursor-zoom-in"
                    onClick={() => {
                      setPreviewUrl(uploadedData.url);
                      setShowImagePreview(true);
                    }}
                  >
                    <img
                      src={uploadedData.url}
                      alt="上传预览"
                      className="max-h-64 max-w-full object-contain"
                    />
                  </div>
                </div>
                
                {/* 图片预览模态框 */}
                {showImagePreview && previewUrl && (
                  <ImagePreview 
                    imageUrl={previewUrl} 
                    onClose={() => setShowImagePreview(false)}
                    alt="上传图片预览"
                  />
                )}
                
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 font-medium">直接链接</span>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => copyToClipboard(uploadedData.url)}
                    >
                      {copied ? '已复制！' : '复制'}
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
                      onClick={() => copyToClipboard(uploadedData.htmlCode)}
                    >
                      {copied ? '已复制！' : '复制'}
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
                      onClick={() => copyToClipboard(uploadedData.markdownCode)}
                    >
                      {copied ? '已复制！' : '复制'}
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