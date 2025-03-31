'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 检查用户是否登录并且是管理员
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('未授权');
        }

        const data = await response.json();
        if (data.user.role !== 'admin') {
          router.push('/');
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error('验证失败:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg text-light">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dark">
      {/* 星空背景 */}
      <div className="stars fixed inset-0 z-0">
        <div className="small"></div>
        <div className="medium"></div>
        <div className="big"></div>
      </div>
      
      {/* 侧边栏导航 */}
      <div className="w-64 bg-transparent-dark backdrop-blur-lg shadow-lg border-r border-primary border-opacity-20 z-10 relative">
        <div className="tech-circuit absolute -top-20 right-10 rotate-12 opacity-10"></div>
        <div className="tech-circuit absolute -bottom-20 left-10 -rotate-12 opacity-10"></div>
        
        <div className="p-4 border-b border-primary border-opacity-20">
          <h2 className="text-xl font-bold text-gradient bg-gradient-primary neon-text">PicHub 管理中心</h2>
          <p className="text-sm text-light mt-1">欢迎, {user?.username || '管理员'}</p>
        </div>
        
        <nav className="mt-4">
          <ul className="space-y-1">
            <li>
              <Link href="/admin" className="flex items-center px-4 py-3 text-light opacity-80 hover:bg-primary hover:bg-opacity-10 hover:text-primary transition">
                <i className="fas fa-tachometer-alt w-5 mr-2"></i>
                <span>控制面板</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="flex items-center px-4 py-3 text-light opacity-80 hover:bg-primary hover:bg-opacity-10 hover:text-primary transition">
                <i className="fas fa-users w-5 mr-2"></i>
                <span>用户管理</span>
              </Link>
            </li>
            <li>
              <Link href="/admin/files" className="flex items-center px-4 py-3 text-light opacity-80 hover:bg-primary hover:bg-opacity-10 hover:text-primary transition">
                <i className="fas fa-images w-5 mr-2"></i>
                <span>文件管理</span>
              </Link>
            </li>
            <li>
              <Link href="/" className="flex items-center px-4 py-3 text-light opacity-80 hover:bg-primary hover:bg-opacity-10 hover:text-primary transition">
                <i className="fas fa-home w-5 mr-2"></i>
                <span>返回前台</span>
              </Link>
            </li>
            <li>
              <button 
                onClick={() => {
                  localStorage.removeItem('auth_token');
                  router.push('/login');
                }}
                className="flex items-center w-full px-4 py-3 text-light opacity-80 hover:bg-error hover:bg-opacity-10 hover:text-error transition"
              >
                <i className="fas fa-sign-out-alt w-5 mr-2"></i>
                <span>退出登录</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0">
          <div className="tech-lines-horizontal w-full opacity-30"></div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-6 relative z-10">
        <div className="tech-circuit absolute top-20 right-20 rotate-45 opacity-5"></div>
        <div className="tech-circuit absolute bottom-20 left-20 -rotate-12 opacity-5"></div>
        {children}
      </div>
    </div>
  );
} 