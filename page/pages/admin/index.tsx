import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import StorageChart from '../../components/StorageChart';
import { adminApi } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 日志接口定义
interface LogEntry {
  id: number;
  user_id: number | null;
  username: string | null;
  action_type: string;
  action_detail: string;
  is_system: boolean;
  timestamp: string;
}

const AdminPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'files'>('dashboard');
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [userStats, setUserStats] = useState<{
    activeUsers: number;
    totalUsers: number;
    recentUsers: number;
    recentActiveUsers: number;
    activeRate: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // 获取最近的日志
  useEffect(() => {
    const fetchRecentLogs = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getLogs({ limit: 3, sort: 'desc' });
        setRecentLogs(response.data.logs || []);
        setError(null);
      } catch (err) {
        setError('获取最近活动失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecentLogs();
  }, []);
  
  // 获取用户统计数据
  useEffect(() => {
    const fetchUserStats = async () => {
      setIsStatsLoading(true);
      try {
        const response = await adminApi.getUserStats();
        setUserStats(response.data.stats);
        setStatsError(null);
      } catch (err) {
        setStatsError('获取用户统计失败');
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    fetchUserStats();
  }, []);
  
  // 格式化日期
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
    } catch (err) {
      return dateString;
    }
  };
  
  // 格式化日志文本，将用户名替换为高亮显示
  const formatLogDetail = (detail: string, isSystem: boolean, username: string | null): React.ReactNode => {
    // 获取操作颜色的辅助函数
    const getActionColor = (action: string): string => {
      if (action === "激活") return "text-green-400";
      if (action === "停用") return "text-yellow-400";
      if (action === "删除") return "text-red-500";
      if (action === "修改") return "text-blue-400";
      return "text-red-400"; // 默认颜色
    };
    
    // 如果是系统操作，添加系统标签
    if (isSystem) {
      return (
        <>
          <span className="text-amber-400 font-medium">系统</span> {detail}
        </>
      );
    }
    
    // 匹配各种可能的用户名格式
    // 1. "用户: username, " 或 "用户: username，"
    // 2. "用户:username," 没有空格的情况
    // 3. "用户：username" 使用中文冒号的情况
    const userPatterns = [
      /用户:\s*([^,，]+)([,，])\s*/,
      /用户:([^,，]+)([,，])\s*/,
      /用户：\s*([^,，]+)([,，])\s*/,
      /用户：([^,，]+)([,，])\s*/
    ];
    
    for (const pattern of userPatterns) {
      const match = detail.match(pattern);
      if (match) {
        const [fullMatch, username, comma] = match;
        const parts = detail.split(fullMatch);
        
        return (
          <>
            {parts[0]}用户 <span className="text-indigo-400">{username}</span> {comma} {parts[1]}
          </>
        );
      }
    }
    
    // 精确匹配"管理员停用用户(uid:4)。"格式
    const adminExactPattern = /管理员([\u4e00-\u9fa5]+)用户\(uid:(\d+)\)([.。]?)/;
    const adminExactMatch = detail.match(adminExactPattern);
    if (adminExactMatch) {
      const [fullMatch, action, uid, punctuation] = adminExactMatch;
      return (
        <>
          管理员<span className={getActionColor(action)}>{action}</span>用户(uid:<span className="text-indigo-400">{uid}</span>){punctuation}
        </>
      );
    }
    
    // 匹配"管理员激活用户(uid:5)。"变体
    const adminVariantPattern = /管理员([\u4e00-\u9fa5]+)(了一个)?用户.*?\(uid:(\d+)\)([.。]?)/;
    const adminVariantMatch = detail.match(adminVariantPattern);
    if (adminVariantMatch) {
      const [fullMatch, action, middle, uid, punctuation] = adminVariantMatch;
      return (
        <>
          管理员<span className={getActionColor(action)}>{action}</span>{middle || ''}用户(uid:<span className="text-indigo-400">{uid}</span>){punctuation}
        </>
      );
    }
    
    // 尝试匹配行尾的(uid:数字)格式，把数字部分也高亮显示
    const uidPattern = /\(uid:(\d+)\)([.。]?)$/;
    const uidMatch = detail.match(uidPattern);
    if (uidMatch) {
      const [fullMatch, uid, punctuation] = uidMatch;
      const prefix = detail.substring(0, detail.indexOf(fullMatch));
      
      return (
        <>
          {prefix}(uid:<span className="text-indigo-400">{uid}</span>){punctuation}
        </>
      );
    }
    
    // 如果有username但没匹配到特定格式，展示高亮用户名
    if (username && detail.indexOf(username) === -1) {
      return (
        <>
          <span className="text-indigo-400">{username}</span> {detail}
        </>
      );
    }
    
    return detail;
  };
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {isStatsLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full border-2 border-indigo-400 border-l-transparent animate-spin"></div>
                    <span className="text-gray-500 text-xs">加载中...</span>
                  </div>
                ) : statsError ? (
                  <p className="text-red-400 text-xs">加载失败</p>
                ) : (
                  <p className="text-indigo-400 font-medium">{userStats?.activeUsers || 0}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 添加用户统计卡片 */}
          {userStats && !isStatsLoading && !statsError && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 mt-4 md:mt-0 hidden">
              <div className="flex flex-col">
                <h3 className="text-gray-300 text-sm font-medium mb-2">用户统计</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500">总用户数</p>
                    <p className="text-white font-medium">{userStats.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">活跃率</p>
                    <p className="text-green-400 font-medium">{userStats.activeRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">新增用户(7天)</p>
                    <p className="text-blue-400 font-medium">{userStats.recentUsers}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">活跃用户(7天)</p>
                    <p className="text-purple-400 font-medium">{userStats.recentActiveUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-200 mb-3">最近活动</h3>
          <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-gray-400 text-center">
                <svg className="animate-spin h-5 w-5 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>加载中...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-red-400 text-center">
                <p>{error}</p>
                <button 
                  onClick={() => router.reload()}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  重新加载
                </button>
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                <p>暂无活动记录</p>
              </div>
            ) : (
              recentLogs.map((log, index) => (
                <div 
                  key={log.id} 
                  className={`p-4 ${index < recentLogs.length - 1 ? 'border-b border-gray-700' : ''}`}
                >
                  <p className="text-gray-300">
                    {formatLogDetail(log.action_detail, log.is_system, log.username)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(log.timestamp)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* 添加存储变化图表 */}
      <StorageChart />
    </div>
  );
};

export default AdminPage; 