import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../utils/api';

// 通知类型定义
type NotificationType = 'info' | 'success' | 'warning' | 'error';

// 标记此页面不使用布局
Login.noLayout = true;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: NotificationType}>>([]);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  // API配置
  const apiEndpoint = process.env.NEXT_PUBLIC_API_HOST || '';
  
  // 防止重复渲染
  React.useEffect(() => {
    // 清理组件卸载时可能未完成的操作
    return () => {
      // 清除所有可能的定时器
      notifications.forEach(notification => {
        const timeoutId = parseInt(notification.id);
        if (!isNaN(timeoutId)) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, [notifications]);
  
  // 加载时检查认证状态
  useEffect(() => {
    // 如果已登录，重定向到首页
    if (isAuthenticated && typeof window !== 'undefined') {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 5秒后自动移除通知
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      showNotification('请输入用户名和密码', 'warning');
      return;
    }
    
    if (!apiEndpoint) {
      showNotification('系统配置错误，请联系管理员', 'error');
      return;
    }
    
    try {
      showNotification('正在验证身份...', 'info');

      const response = await authApi.login({ username, password });
      const data = response.data;
      
      if (!data.token || !data.user) {
        showNotification('服务器响应格式错误，请联系管理员', 'error');
        return;
      }
      
      // 保存登录信息并更新认证状态
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.token, data.user);
      
      showNotification('验证成功，正在进入系统...', 'success');
      
      // 登录成功，跳转到主页
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error: any) {
      // 处理不同类型的错误
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            showNotification('用户名或密码错误', 'error');
            break;
          case 403:
            showNotification(data.message || '账号未激活，请联系管理员', 'error');
            break;
          case 500:
            showNotification('服务器错误，请稍后重试', 'error');
            break;
          default:
            showNotification(data.error || '登录失败，请重试', 'error');
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        showNotification('无法连接到服务器，请检查网络连接', 'error');
      } else {
        // 请求配置出错
        showNotification('请求配置错误，请重试', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* 通知组件 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`px-4 py-3 rounded-md shadow-lg max-w-md backdrop-blur-sm border ${
              notification.type === 'error' ? 'bg-red-900/30 border-red-800 text-red-400' :
              notification.type === 'success' ? 'bg-green-900/30 border-green-800 text-green-400' :
              notification.type === 'warning' ? 'bg-amber-900/30 border-amber-800 text-amber-400' :
              'bg-blue-900/30 border-blue-800 text-blue-400'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 bg-gray-800/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            PicHub
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            高效、安全的图片管理平台
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />
            
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={notifications.some(n => n.message === '正在验证身份...')}
            >
              登录
            </Button>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
                没有账号？立即注册
              </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>登录即表示您同意我们的服务条款和隐私政策</p>
          </div>
        </div>
      </div>
    </div>
  );
} 