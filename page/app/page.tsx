'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UploadSection } from './components/UploadSection';
import { ResultsSection } from './components/ResultsSection';
import { Notification, NotificationType } from './components/Notification';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: NotificationType}>>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || '';
  const router = useRouter();

  useEffect(() => {
    // 检查localStorage中是否有保存的JWT token
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (token && user) {
      setIsAuthenticated(true);
      setUserInfo(user);
    } else {
      // 如果没有登录凭据，重定向到登录页面
      router.push('/login');
    }
  }, [router]);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 5秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserInfo(null);
    router.push('/login');
  };

  const resetUpload = () => {
    setCurrentFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setUploadResult(null);
  };

  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0]; // 只处理第一个文件
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      showNotification(`不支持的文件类型: ${file.type}`, 'error');
      return;
    }
    
    // 检查文件大小 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      showNotification(`文件过大: ${formatFileSize(file.size)}，最大支持50MB`, 'error');
      return;
    }
    
    // 保存当前文件并开始上传
    setCurrentFile(file);
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!apiEndpoint) {
      showNotification('系统配置错误，请联系管理员', 'error');
      return;
    }
    
    if (isUploading) return;
    
    // 获取JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('未登录或会话已过期，请重新登录', 'error');
      router.push('/login');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      });
      
      // 设置完成回调
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          handleUploadSuccess(response);
        } else {
          let errorMessage = '上传失败';
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.error || errorMessage;
            
            // 如果是认证错误，可能是token过期
            if (xhr.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              router.push('/login');
            }
          } catch (e) {
            // 解析错误，使用默认错误消息
          }
          handleUploadError(errorMessage);
        }
      });
      
      // 设置错误回调
      xhr.addEventListener('error', () => {
        handleUploadError('网络错误，请检查连接');
      });
      
      // 设置超时回调
      xhr.addEventListener('timeout', () => {
        handleUploadError('上传超时，请重试');
      });
      
      // 使用配置的API端点
      const uploadUrl = `${apiEndpoint}/api/upload`;
      
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 60000;
      xhr.send(formData);
    } catch (error: any) {
      handleUploadError(error.message || '上传过程中发生错误');
    }
  };

  const handleUploadSuccess = (response: any) => {
    setIsUploading(false);
    setUploadResult(response);
    showNotification('图像上传成功', 'success');
  };

  const handleUploadError = (message: string) => {
    setIsUploading(false);
    showNotification(`上传失败: ${message}`, 'error');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (!isAuthenticated) return;
    
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
        
        // 处理文件上传
        handleFiles([file] as unknown as FileList);
      }
    }
  };

  useEffect(() => {
    // 监听粘贴事件
    document.addEventListener('paste', handlePaste as unknown as EventListener);
    return () => {
      document.removeEventListener('paste', handlePaste as unknown as EventListener);
    };
  }, [isAuthenticated]);

  // 如果还在检查认证状态，显示加载中
  if (!isAuthenticated) {
    return null; // 或者显示加载动画
  }

  return (
    <div className="container mx-auto px-4 py-8 relative min-h-screen">
      {/* 标题区域 */}
      <header className="mb-10 text-center relative">
        <div className="tech-circuit absolute top-0 right-10 rotate-12 opacity-20"></div>
        <div className="tech-circuit absolute top-5 left-10 -rotate-12 opacity-20"></div>
        
        <div className="tech-lines-horizontal absolute top-5 left-0 right-0 w-40 mx-auto opacity-40"></div>
        
        <h1 className="text-5xl font-bold mb-3 relative inline-block">
          <span className="text-gradient bg-gradient-cyberpunk neon-text">PicHub</span>
          <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
        </h1>
        
        <div className="flex-center gap-2 mt-3 text-sm text-muted">
          <i className="fas fa-shield-alt text-accent"></i>
          <span>数据安全 · 高速传输 · 智能管理</span>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-4xl mx-auto relative">
        <div className="tech-circle w-200 h-200 absolute -top-50 -left-100 opacity-5"></div>
        <div className="tech-circle w-300 h-300 absolute -bottom-100 -right-150 opacity-3"></div>
        
        {!uploadResult ? (
          <UploadSection 
            onFilesSelected={handleFiles} 
            isUploading={isUploading} 
            uploadProgress={uploadProgress} 
          />
        ) : (
          <ResultsSection 
            result={uploadResult}
            formatFileSize={formatFileSize}
            onUploadAnother={resetUpload}
          />
        )}
        
        {/* 用户信息区域 */}
        {isAuthenticated && userInfo && (
          <div className="card-holographic p-4 max-w-sm mx-auto mt-8 neon-border text-center">
            <h3 className="text-light text-sm mb-2 font-medium opacity-80">
              <i className="fas fa-user-astronaut mr-2 text-primary"></i>
              用户信息
            </h3>
            <div className="text-xs text-muted mb-3">
              <span>账户: {userInfo.email}</span>
              {userInfo.plan && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-transparent-dark border border-accent text-accent">
                  {userInfo.plan}
                </span>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="btn-outline text-xs px-4 py-1 hover:text-error hover:border-error"
            >
              <i className="fas fa-sign-out-alt mr-1"></i> 退出登录
            </button>
          </div>
        )}
      </main>
      
      {/* 页脚区域 */}
      <footer className="text-center text-xs text-muted mt-12 pb-6">
        <div className="tech-lines-horizontal absolute bottom-20 left-0 right-0 w-60 mx-auto opacity-20"></div>
        <p>© {new Date().getFullYear()} PicHub - 安全高效的图像托管服务</p>
      </footer>
      
      {/* 通知区域 */}
      <div 
        ref={notificationsRef}
        className="fixed top-4 right-4 z-max space-y-2"
      >
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          />
        ))}
      </div>
    </div>
  );
}
