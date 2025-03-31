'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Notification, NotificationType } from '../components/Notification';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: NotificationType}>>([]);
  const router = useRouter();
  
  const apiEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || '';

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 5秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const handleRegister = async (e: React.FormEvent) => {
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
      showNotification('正在注册...', 'info');
      
      console.log('注册请求发送到:', `${apiEndpoint}/api/register`);
      
      const response = await fetch(`${apiEndpoint}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          password,
          email: email || undefined 
        })
      });
      
      console.log('注册响应状态:', response.status);
      
      const data = await response.json();
      console.log('注册响应数据:', data);
      
      if (!response.ok) {
        if (data.error === 'Username already exists') {
          showNotification('用户名已存在，请选择其他用户名', 'error');
        } else if (data.error === 'Email already registered') {
          showNotification('该邮箱已被注册', 'error');
        } else {
          showNotification(data.error || '注册失败', 'error');
        }
        return;
      }
      
      showNotification(data.message || '注册成功，请联系管理员激活账号', 'success');
      
      // 注册成功，等待几秒后跳转到登录页
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Register error:', error);
      showNotification('注册请求失败，请检查网络和API配置', 'error');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex-center-col py-12">
      {/* 背景元素 */}
      <div className="stars">
        <div className="small"></div>
        <div className="medium"></div>
        <div className="big"></div>
      </div>
      
      <div className="tech-circuit absolute top-20 right-20 rotate-45 opacity-20"></div>
      <div className="tech-circuit absolute bottom-20 left-20 -rotate-12 opacity-20"></div>
      <div className="tech-lines-horizontal absolute top-10 left-0 right-0 w-60 mx-auto opacity-40"></div>
      <div className="tech-lines-horizontal absolute bottom-10 left-0 right-0 w-60 mx-auto opacity-40"></div>
      
      <header className="text-center mb-10 relative animate-fade-in">
        <div className="tech-circle w-60 h-60 absolute -top-20 -left-20 opacity-10"></div>
        <div className="tech-circle w-80 h-80 absolute -bottom-40 -right-20 opacity-5"></div>
        
        <div className="relative inline-block">
          <div className="text-5xl text-primary mb-2 animate-pulse">
            <i className="fas fa-satellite"></i>
          </div>
          <h1 className="text-4xl font-bold relative inline-block mb-3">
            <span className="text-gradient bg-gradient-cyberpunk neon-text">PicHub</span>
            <span className="text-accent text-sm ml-2">v2.0</span>
            <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
          </h1>
          <p className="text-light max-w-md mx-auto">
            高科技图像云存储与处理平台
          </p>
        </div>
      </header>

      <main className="w-full max-w-md px-6">
        <div className="card-holographic p-8 backdrop-blur-md animate-fade-in relative">
          {/* 角落装饰 */}
          <div className="corner-decoration top-left"></div>
          <div className="corner-decoration top-right"></div>
          <div className="corner-decoration bottom-left"></div>
          <div className="corner-decoration bottom-right"></div>
          
          <div className="tech-lines-horizontal absolute top-0"></div>
          <div className="tech-lines-horizontal absolute bottom-0"></div>
          <div className="tech-lines-vertical absolute left-0"></div>
          <div className="tech-lines-vertical absolute right-0"></div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">
              <span className="text-gradient bg-gradient-neon neon-text">
                <i className="fas fa-user-plus mr-2"></i>
                创建账号
              </span>
            </h2>
            <div className="divider w-32 mx-auto mt-2"></div>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="input-focus-box">
              <label className="text-light block mb-2 flex items-center">
                <i className="fas fa-user text-primary mr-2"></i>
                用户名
              </label>
              <input
                type="text"
                className="w-full p-3 bg-transparent-dark"
                placeholder="输入您的用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className="input-focus-border"></div>
            </div>
            
            <div className="input-focus-box">
              <label className="text-light block mb-2 flex items-center">
                <i className="fas fa-lock text-primary mr-2"></i>
                密码
              </label>
              <input
                type="password"
                className="w-full p-3 bg-transparent-dark"
                placeholder="输入您的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="input-focus-border"></div>
            </div>
            
            <div className="input-focus-box">
              <label className="text-light block mb-2 flex items-center">
                <i className="fas fa-envelope text-primary mr-2"></i>
                邮箱（可选）
              </label>
              <input
                type="email"
                className="w-full p-3 bg-transparent-dark"
                placeholder="输入您的邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="input-focus-border"></div>
            </div>
            
            <button
              type="submit"
              className="w-full btn-3d px-6 py-3 btn-ripple mt-4"
            >
              <i className="fas fa-user-astronaut mr-2"></i>
              注册账号
            </button>
            
            <div className="text-center mt-4 text-light">
              <p className="text-muted">
                已有账号？ 
                <Link href="/login" className="text-primary ml-1 hover-glow hover:underline transition">
                  立即登录
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-auto py-6 text-center w-full text-muted">
        <div className="tech-lines-horizontal absolute bottom-12 left-0 right-0 w-60 mx-auto opacity-20"></div>
        <p>
          <i className="fas fa-meteor mr-2"></i>
          PicHub © {new Date().getFullYear()} | 构建于 Cloudflare R2 分布式存储
        </p>
      
        <div 
          className="fixed top-4 right-4 z-max space-y-2"
        >
          {notifications.map(notification => (
            <Notification 
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => setNotifications(prev => 
                prev.filter(n => n.id !== notification.id)
              )}
            />
          ))}
        </div>
      </footer>
    </div>
  );
} 