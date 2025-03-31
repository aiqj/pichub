'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalFiles: 0,
    totalStorage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // 获取用户数据
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // 获取文件数据
        const filesResponse = await fetch('/api/admin/files', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!usersResponse.ok || !filesResponse.ok) {
          throw new Error('获取数据失败');
        }

        const usersData = await usersResponse.json();
        const filesData = await filesResponse.json();

        // 计算统计信息
        const totalUsers = usersData.users.length;
        const activeUsers = usersData.users.filter((user: any) => user.is_active).length;
        const totalFiles = filesData.files.length;
        const totalStorage = filesData.files.reduce((acc: number, file: any) => acc + file.file_size, 0);

        setStats({
          totalUsers,
          activeUsers,
          totalFiles,
          totalStorage
        });
      } catch (error) {
        console.error('获取统计信息失败:', error);
        setError('获取统计信息失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-2 text-light">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-glass p-4 border-error">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gradient bg-gradient-primary neon-text mb-6">控制面板</h1>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-holographic p-5 transition floating-panel">
          <div className="corner-decoration top-left"></div>
          <div className="corner-decoration top-right"></div>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-transparent-dark text-primary animate-pulse">
              <i className="fas fa-users text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-muted text-sm">总用户数</p>
              <p className="text-2xl font-semibold text-light">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="card-holographic p-5 transition floating-panel">
          <div className="corner-decoration top-left"></div>
          <div className="corner-decoration top-right"></div>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-transparent-dark text-success animate-pulse">
              <i className="fas fa-user-check text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-muted text-sm">活跃用户</p>
              <p className="text-2xl font-semibold text-light">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="card-holographic p-5 transition floating-panel">
          <div className="corner-decoration top-left"></div>
          <div className="corner-decoration top-right"></div>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-transparent-dark text-primary animate-pulse">
              <i className="fas fa-images text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-muted text-sm">总文件数</p>
              <p className="text-2xl font-semibold text-light">{stats.totalFiles}</p>
            </div>
          </div>
        </div>
        
        <div className="card-holographic p-5 transition floating-panel">
          <div className="corner-decoration top-left"></div>
          <div className="corner-decoration top-right"></div>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-transparent-dark text-accent animate-pulse">
              <i className="fas fa-database text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-muted text-sm">总存储量</p>
              <p className="text-2xl font-semibold text-light">{formatSize(stats.totalStorage)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 快速操作部分 */}
      <h2 className="text-xl font-semibold text-gradient bg-gradient-accent neon-text mb-4">快速操作</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-glass relative overflow-hidden">
          <div className="px-6 py-5 border-b border-primary border-opacity-20">
            <h3 className="text-lg font-semibold text-primary">
              <i className="fas fa-users mr-2"></i>
              用户管理
            </h3>
          </div>
          <div className="p-6">
            <p className="text-light opacity-80 mb-4">管理系统用户，包括创建、激活、编辑和删除用户。</p>
            <Link href="/admin/users" className="btn-3d inline-flex items-center px-4 py-2 btn-ripple">
              <i className="fas fa-users mr-2"></i> 管理用户
            </Link>
          </div>
          <div className="tech-circuit absolute -bottom-20 right-10 rotate-12 opacity-5"></div>
        </div>
        
        <div className="card-glass relative overflow-hidden">
          <div className="px-6 py-5 border-b border-primary border-opacity-20">
            <h3 className="text-lg font-semibold text-primary">
              <i className="fas fa-images mr-2"></i>
              文件管理
            </h3>
          </div>
          <div className="p-6">
            <p className="text-light opacity-80 mb-4">查看和管理所有用户上传的文件，可以删除或限制文件。</p>
            <Link href="/admin/files" className="btn-3d inline-flex items-center px-4 py-2 btn-ripple">
              <i className="fas fa-images mr-2"></i> 管理文件
            </Link>
          </div>
          <div className="tech-circuit absolute -bottom-20 right-10 rotate-12 opacity-5"></div>
        </div>
      </div>
    </div>
  );
} 