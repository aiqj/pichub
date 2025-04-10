import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import StorageChart from '../../components/StorageChart';

const AdminPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'files'>('dashboard');
  
  // 特性卡片组件
  interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
  }
  
  const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, href, color }) => (
    <Link href={href} className="block">
      <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-${color}-500/50 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-900/20`}>
        <div className={`inline-flex items-center justify-center p-3 bg-${color}-900/30 rounded-lg mb-4`}>
          {icon}
        </div>
        <h3 className="text-xl font-medium text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </Link>
  );
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          管理面板
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          title="用户管理"
          description="激活用户账号，管理用户权限，重置密码"
          href="/admin/users"
          color="purple"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        
        <FeatureCard
          title="文件管理"
          description="查看和管理所有用户上传的文件"
          href="/admin/files"
          color="cyan"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          }
        />
        
        <FeatureCard
          title="系统设置"
          description="站点配置、存储管理、安全设置"
          href="/admin/settings"
          color="amber"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>
      
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          系统状态
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-green-900/30 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">服务器状态</h3>
                <p className="text-green-400 font-medium">在线</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-900/30 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">活跃用户</h3>
                <p className="text-indigo-400 font-medium">12</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-900/30 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">总上传量</h3>
                <p className="text-purple-400 font-medium">1.2 GB</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-200 mb-3">最近活动</h3>
          <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <p className="text-gray-300">用户 <span className="text-indigo-400">admin</span> 登录了系统</p>
              <p className="text-xs text-gray-500 mt-1">今天 10:23</p>
            </div>
            <div className="p-4 border-b border-gray-700">
              <p className="text-gray-300">用户 <span className="text-indigo-400">john</span> 上传了新图片</p>
              <p className="text-xs text-gray-500 mt-1">今天 09:41</p>
            </div>
            <div className="p-4">
              <p className="text-gray-300">系统执行了自动备份</p>
              <p className="text-xs text-gray-500 mt-1">昨天 23:00</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 添加存储变化图表 */}
      <StorageChart />
    </div>
  );
};

export default AdminPage; 