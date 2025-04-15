import React, { useState, useEffect, useRef } from 'react';
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

// 赛博朋克风格的数字雨效果
const DigitalRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];
    
    // 初始化雨滴位置
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
    
    // 可用的字符集 - 赛博朋克风格的混合字符
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*<=>/\\';
    
    // 绘制数字雨
    const draw = () => {
      // 半透明黑色背景，形成拖尾效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 设置文本样式
      ctx.fillStyle = '#0ff'; // 青色
      ctx.font = `${fontSize}px monospace`;
      
      // 逐列绘制字符
      for (let i = 0; i < drops.length; i++) {
        // 随机选择字符
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // 计算x坐标
        const x = i * fontSize;
        
        // 计算y坐标
        const y = drops[i] * fontSize;
        
        // 随机改变一些字符的颜色
        if (Math.random() > 0.98) {
          ctx.fillStyle = '#f0f'; // 紫色
        } else if (Math.random() > 0.95) {
          ctx.fillStyle = '#ff0'; // 黄色
        } else {
          ctx.fillStyle = '#0ff'; // 默认青色
        }
        
        // 绘制字符
        ctx.fillText(char, x, y);
        
        // 随机重置一些雨滴的位置
        if (y > canvas.height && Math.random() > 0.99) {
          drops[i] = 0;
        }
        
        // 雨滴下落
        drops[i]++;
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
    
    // 响应窗口大小变化
    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />;
};

// 电路板图案组件
const CircuitPattern = () => {
  return (
    <div className="absolute inset-0 opacity-10">
      <div className="absolute w-full h-full bg-circuit-pattern"></div>
      {/* 电路节点 */}
      <div className="absolute top-1/4 left-1/5 w-2 h-2 bg-cyan-500 rounded-full shadow-glow-cyan"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-500 rounded-full shadow-glow-purple"></div>
      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-cyan-500 rounded-full shadow-glow-cyan"></div>
      <div className="absolute bottom-1/3 right-1/5 w-2 h-2 bg-pink-500 rounded-full shadow-glow-pink animate-pulse-slow"></div>
    </div>
  );
};

// 扫描线动画
const ScanLine = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-70 animate-scan-line"></div>
    </div>
  );
};

// 标题动画文字效果
const GlitchText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 text-pink-500 animate-glitch-1 opacity-70">{text}</span>
      <span className="absolute top-0 left-0 -z-20 text-cyan-500 animate-glitch-2 opacity-70">{text}</span>
    </span>
  );
};

// 高科技UI框
const TechFrame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`relative border border-cyan-500/30 bg-black/60 backdrop-blur-md rounded-md overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
      <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
      
      {/* 角落装饰 */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-500"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500"></div>
      
      {children}
    </div>
  );
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
  const [typedText, setTypedText] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const fullText = "PicHub 超越云端的图像托管平台";
  const statistics = [
    { label: "已上传图片", value: "134,582", icon: "📊" },
    { label: "全球用户", value: "25,471", icon: "🌐" },
    { label: "传输速度", value: "12ms", icon: "⚡" },
    { label: "可用率", value: "99.9%", icon: "��️" },
  ];
  
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

  // 初始加载和打字机效果
  useEffect(() => {
    loadPublicFiles();
    
    // 打字机效果
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        // 光标闪烁效果继续
      }
    }, 100);
    
    // 设置时钟
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    
    // 立即更新一次
    updateClock();
    
    // 每秒更新一次
    const clockInterval = setInterval(updateClock, 1000);
    
    return () => {
      clearInterval(typingInterval);
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* 科技感十足的顶部横幅 */}
      <div className="relative overflow-hidden bg-black min-h-[90vh] flex items-center">
        {/* 底层背景效果 */}
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-black to-black z-0"></div>
        
        {/* 数字雨背景 */}
        <DigitalRain />
        
        {/* 电路图案 */}
        <CircuitPattern />
        
        {/* 扫描线 */}
        <ScanLine />
        
        {/* 主内容 */}
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 赛博朋克风格的状态栏 */}
          <div className="flex items-center justify-between text-xs text-cyan-500 font-mono mb-12">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse mr-2"></span>
                <span>SYS.STATUS: ONLINE</span>
              </div>
              <div className="hidden md:flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span>ENCRYPTION: ACTIVE</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span>{new Date().toISOString().split('T')[0]}</span>
              <span id="digitalClock" className="tabular-nums">
                {currentTime}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
            {/* 左侧内容区域 (占3列) */}
            <div className="lg:col-span-3 space-y-8">
              {/* 主标题 */}
              <div>
                <div className="inline-flex items-center px-3 py-1 mb-4 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 rounded-full">
                  <span className="text-cyan-500 text-xs font-mono">V2.0.4_CYBERHUB</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-white mb-2 leading-tight tracking-tight">
                  <GlitchText text="PICHUB" className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" />
                  <span className="block text-3xl md:text-4xl mt-2 font-light">
                    {typedText}
                    <span className="inline-block w-2 h-6 bg-cyan-400 animate-blink align-text-bottom ml-1"></span>
                  </span>
                </h1>
                
                <p className="text-cyan-100 text-lg max-w-xl mt-6 font-light leading-relaxed">
                  突破传统存储限制，采用量子级加密技术，毫秒级全球传输，
                  <span className="text-cyan-400">重新定义</span>
                  图片托管的未来形态。
                </p>
              </div>
              
              {/* 数据统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statistics.map((stat, index) => (
                  <TechFrame key={index} className="p-4 group hover:bg-cyan-900/20 transition-all duration-300">
                    <div className="text-center">
                      <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{stat.icon}</div>
                      <div className="text-cyan-400 font-mono text-xl font-bold">{stat.value}</div>
                      <div className="text-cyan-100 text-sm">{stat.label}</div>
                    </div>
                  </TechFrame>
                ))}
              </div>
              
              {/* 功能卡片 */}
              <TechFrame className="p-6 mt-8">
                <h3 className="text-cyan-400 text-lg mb-4 font-mono tracking-wider flex items-center">
                  <span className="inline-block w-1 h-6 bg-cyan-400 mr-3"></span>
                  系统核心功能
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-black to-blue-900/30 p-4 rounded-md border border-blue-500/20 hover:border-blue-500/50 transition-all">
                    <div className="text-blue-400 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      量子级加密
                    </div>
                    <p className="text-gray-400 text-sm">采用前沿加密算法，提供无与伦比的安全性能</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-black to-pink-900/30 p-4 rounded-md border border-pink-500/20 hover:border-pink-500/50 transition-all">
                    <div className="text-pink-400 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      闪电传输
                    </div>
                    <p className="text-gray-400 text-sm">全球边缘节点分发，毫秒级响应，极致体验</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-black to-purple-900/30 p-4 rounded-md border border-purple-500/20 hover:border-purple-500/50 transition-all">
                    <div className="text-purple-400 mb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                      AI增强
                    </div>
                    <p className="text-gray-400 text-sm">智能图像处理，自动标签分类，强大搜索功能</p>
                  </div>
                </div>
              </TechFrame>
              
              {/* 行动按钮区 */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Button 
                  variant="primary"
                  onClick={() => router.push('/upload')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 border-0 text-white py-3 px-8 shadow-glow-cyan hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="flex items-center">
                    开始上传
                    <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </span>
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard')}
                  className="bg-transparent border border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/20 py-3 px-6 transition-all duration-300"
                >
                  进入控制台
                </Button>
              </div>
            </div>
            
            {/* 右侧全息图区域 (占2列) */}
            <div className="lg:col-span-2 flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* 全息投影效果 */}
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-purple-500/20 blur-xl rounded-full"></div>
                
                {/* 主要显示内容 */}
                <TechFrame className="rounded-lg overflow-hidden">
                  {/* 顶部状态栏 */}
                  <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-4 py-2 flex justify-between items-center border-b border-cyan-500/30">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-cyan-400 font-mono">IMAGE-VIEWER.SYS</div>
                  </div>
                  
                  {/* 图片显示区 */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-md overflow-hidden border border-cyan-500/30 hover:border-cyan-500/70 transition-all group">
                        <img 
                          src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                          alt="抽象科技图" 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        />
                      </div>
                      <div className="aspect-square bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-md overflow-hidden border border-pink-500/30 hover:border-pink-500/70 transition-all group">
                        <img 
                          src="https://images.unsplash.com/photo-1624913503273-5f9c4e980dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                          alt="科技图像" 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        />
                      </div>
                    </div>
                    
                    {/* 控制面板 */}
                    <div className="mb-4 p-3 bg-cyan-900/20 rounded-md border border-cyan-500/30">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-cyan-400 text-xs font-mono">系统状态</div>
                        <div className="text-green-400 text-xs font-mono flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                          在线
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                          <div className="h-full w-4/5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                          <div className="h-full w-3/5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                          <div className="h-full w-9/10 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 命令行区域 */}
                    <div className="bg-black/70 rounded-md border border-cyan-500/30 p-3 font-mono text-xs text-cyan-300">
                      <div className="mb-1">$ initialize_system --secure</div>
                      <div className="mb-1 text-green-400">{"> "}系统初始化完成</div>
                      <div className="mb-1">$ connect --global_nodes</div>
                      <div className="mb-1 text-green-400">{"> "}已连接全球38个节点</div>
                      <div className="mb-1">$ status --uptime</div>
                      <div className="text-yellow-400">{"> "}系统运行时间: 382天14小时</div>
                    </div>
                  </div>
                  
                  {/* 底部控制栏 */}
                  <div className="px-4 py-3 border-t border-cyan-500/30 flex justify-between items-center bg-gradient-to-r from-black to-blue-900/20">
                    <div className="flex space-x-3">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    
                    <div className="text-xs bg-cyan-900/30 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-400">
                      <span className="animate-pulse">●</span> LIVE
                    </div>
                  </div>
                </TechFrame>
                
                {/* 装饰性浮动小元素 */}
                <div className="absolute top-0 -right-8 animate-float-slow">
                  <div className="w-24 h-24 rounded-lg border border-cyan-500/30 backdrop-blur-sm bg-gradient-to-br from-cyan-500/5 to-blue-500/10 rotate-12 flex items-center justify-center">
                    <svg className="w-10 h-10 text-cyan-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-6 animate-float">
                  <div className="w-16 h-16 rounded-full border border-pink-500/30 backdrop-blur-sm bg-gradient-to-br from-pink-500/10 to-purple-500/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-pink-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 为什么选择 PicHub */}
      <div className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            为什么选择 <span className="text-purple-600">PicHub</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white shadow-md rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-purple-100 rounded-full">
                <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">快速上传</h3>
              <p className="text-gray-600">上传速度快，无需等待，支持拖拽、粘贴、点击多种上传方式。</p>
            </div>
            
            <div className="bg-white shadow-md rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-blue-100 rounded-full">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">安全可靠</h3>
              <p className="text-gray-600">采用先进的加密和存储技术，确保您的图片安全存储，不会丢失。</p>
            </div>
            
            <div className="bg-white shadow-md rounded-xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-indigo-100 rounded-full">
                <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">灵活分享</h3>
              <p className="text-gray-600">多种分享方式，支持直接链接、HTML和Markdown格式，适用于各种场景。</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 最新公开图片 */}
      <div className="w-full bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">
            最新公开图片
          </h2>
          <p className="text-center text-gray-600 mb-12">
            探索用户分享的精彩图片，获取灵感，发现美好
          </p>
          
          {loading && files.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="aspect-video bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600">{error}</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {files.map((file) => {
                  const imageUrl = `${apiEndpoint}/images/${file.file_name}`;
                  return (
                    <div 
                      key={file.id} 
                      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => openPreview(file)}
                    >
                      <div className="aspect-video bg-gray-100 overflow-hidden relative">
                        <img 
                          src={imageUrl} 
                          alt={file.original_name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <FileTypeIcon type={file.file_type} />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 truncate" title={file.original_name}>
                          {file.original_name}
                        </h3>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.file_size)}</span>
                          <span 
                            className="group relative cursor-help"
                            title={file.uploaded_at}
                          >
                            {formatUploadTime(file.uploaded_at)}
                            <span className="absolute bottom-full right-0 mb-2 w-44 rounded bg-black/80 p-1 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                              {new Date(file.uploaded_at).toLocaleString('zh-CN')}
                            </span>
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{file.username}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {pagination.hasMore && (
                <div className="flex justify-center mt-10">
                  <Button 
                    variant="secondary" 
                    onClick={loadMore}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? '加载中...' : '加载更多图片'}
                  </Button>
                </div>
              )}
              
              {files.length === 0 && !loading && (
                <div className="text-center p-12 bg-white border border-gray-200 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 text-lg">还没有公开的图片</p>
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
      
      {/* 底部行动号召 */}
      <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始使用了吗？</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            现在就开始上传您的图片，获取更好的托管体验，安全、高效、便捷。
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => router.push('/upload')}
              className="bg-white text-indigo-600 hover:bg-gray-100"
            >
              立即上传
            </Button>
            {!isAuthenticated && (
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => router.push('/register')}
                className="bg-transparent border-2 border-white hover:bg-white/10"
              >
                注册账号
              </Button>
            )}
          </div>
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