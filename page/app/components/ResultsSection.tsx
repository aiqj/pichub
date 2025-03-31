'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type ClipboardJS from 'clipboard';

interface ResultsSectionProps {
  result: {
    url: string;
    originalName: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
  };
  formatFileSize: (bytes: number) => string;
  onUploadAnother: () => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  result,
  formatFileSize,
  onUploadAnother
}) => {
  const imageUrlRef = useRef<HTMLInputElement>(null);
  const htmlCodeRef = useRef<HTMLInputElement>(null);
  const markdownCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 初始化剪贴板功能
    const initClipboard = async () => {
      try {
        // 在客户端动态导入clipboard.js
        const ClipboardJS = (await import('clipboard')).default;
        
        const clipboard = new ClipboardJS('.copy-btn');
        
        clipboard.on('success', (e: ClipboardJS.Event) => {
          // 显示复制成功的视觉反馈
          const button = e.trigger as HTMLElement;
          const originalContent = button.innerHTML;
          button.innerHTML = '<i class="fas fa-check"></i>';
          
          setTimeout(() => {
            button.innerHTML = originalContent;
          }, 1000);
          
          e.clearSelection();
        });
      } catch (error) {
        console.error('剪贴板功能初始化失败:', error);
      }
    };
    
    initClipboard();
  }, []);

  // 格式化上传时间
  const formatUploadTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch (e) {
      return timeString;
    }
  };

  return (
    <section className="card-holographic p-6 w-full max-w-container mb-8 relative animate-fade-in">
      {/* 角落装饰 */}
      <div className="corner-decoration top-left"></div>
      <div className="corner-decoration top-right"></div>
      <div className="corner-decoration bottom-left"></div>
      <div className="corner-decoration bottom-right"></div>
      
      {/* 科技装饰元素 */}
      <div className="tech-circuit absolute -top-20 right-20 rotate-45"></div>
      <div className="tech-circuit absolute -bottom-20 left-20 -rotate-12"></div>
      
      <div className="tech-lines-horizontal absolute top-0"></div>
      <div className="tech-lines-horizontal absolute top-15 left-20 w-30 opacity-40"></div>
      <div className="tech-lines-horizontal absolute bottom-0"></div>
      <div className="tech-lines-horizontal absolute bottom-15 right-20 w-40 opacity-30"></div>
      <div className="tech-lines-vertical absolute left-0"></div>
      <div className="tech-lines-vertical absolute right-0"></div>
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">
          <i className="fas fa-check-circle mr-2 text-success animate-pulse"></i>
          <span className="text-gradient bg-gradient-neon neon-text">上传成功</span>
        </h2>
        <div className="divider w-48 mx-auto mt-2"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-circuitry relative min-h-200 p-4 flex-center animate-fade-in neon-border">
          {/* 图片装饰效果 */}
          <div className="tech-circle w-40 h-40 absolute -top-10 -left-10 opacity-10"></div>
          <div className="tech-circle w-60 h-60 absolute -bottom-20 -right-20 opacity-5"></div>
          
          {/* 图片角标装饰 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent opacity-80"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent opacity-80"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent opacity-80"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent opacity-80"></div>
          
          {/* 图片显示区域 */}
          <div className="relative z-10 w-full h-full flex-center p-2">
            <div className="relative w-full max-h-300 flex-center border border-primary border-opacity-20 rounded overflow-hidden transition floating-panel bg-transparent-dark">
              <img 
                src={result.url} 
                alt={result.originalName} 
                className="max-w-full max-h-300 object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-transparent-dark text-xs p-2 text-light opacity-0 hover:opacity-100 transition">
                {result.originalName}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-col gap-6">
          <div className="divider-with-text mb-4">
            <span className="neon-text-accent text-sm"><i className="fas fa-link mr-1"></i> 分享链接</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-light mb-2 flex items-center">
                <i className="fas fa-link mr-2 text-primary animate-pulse"></i>
                <span>图像链接</span>
              </label>
              <div className="input-group input-focus-box">
                <input
                  ref={imageUrlRef}
                  type="text"
                  className="p-3"
                  value={result.url}
                  readOnly
                />
                <button 
                  className="copy-btn btn-accent btn-ripple"
                  data-clipboard-text={result.url}
                >
                  <i className="fas fa-copy"></i>
                </button>
                <div className="input-focus-border"></div>
              </div>
            </div>
            
            <div>
              <label className="block text-light mb-2 flex items-center">
                <i className="fas fa-code mr-2 text-primary"></i>
                <span>HTML 代码</span>
              </label>
              <div className="input-group input-focus-box">
                <input
                  ref={htmlCodeRef}
                  type="text"
                  className="p-3"
                  value={`<img src="${result.url}" alt="${result.originalName}" />`}
                  readOnly
                />
                <button 
                  className="copy-btn btn-accent btn-ripple"
                  data-clipboard-text={`<img src="${result.url}" alt="${result.originalName}" />`}
                >
                  <i className="fas fa-copy"></i>
                </button>
                <div className="input-focus-border"></div>
              </div>
            </div>
            
            <div>
              <label className="block text-light mb-2 flex items-center">
                <i className="fas fa-markdown mr-2 text-primary"></i>
                <span>Markdown 代码</span>
              </label>
              <div className="input-group input-focus-box">
                <input
                  ref={markdownCodeRef}
                  type="text"
                  className="p-3"
                  value={`![${result.originalName}](${result.url})`}
                  readOnly
                />
                <button 
                  className="copy-btn btn-accent btn-ripple"
                  data-clipboard-text={`![${result.originalName}](${result.url})`}
                >
                  <i className="fas fa-copy"></i>
                </button>
                <div className="input-focus-border"></div>
              </div>
            </div>
          </div>
          
          <div className="card-glass p-4 mt-4 neon-border animate-fade-in">
            <h3 className="text-gradient bg-gradient-primary text-lg font-medium mb-3 flex items-center">
              <i className="fas fa-info-circle mr-2 icon-pulse"></i>
              文件信息
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="flex items-center p-2 hover:bg-transparent-dark transition rounded">
                <i className="fas fa-file-alt text-primary mr-2"></i>
                <span className="text-muted">文件名:</span>
                <span className="ml-2 text-light truncate">{result.originalName}</span>
              </div>
              <div className="flex items-center p-2 hover:bg-transparent-dark transition rounded">
                <i className="fas fa-weight text-primary mr-2"></i>
                <span className="text-muted">大小:</span>
                <span className="ml-2 text-light">{formatFileSize(result.fileSize)}</span>
              </div>
              <div className="flex items-center p-2 hover:bg-transparent-dark transition rounded">
                <i className="fas fa-file-image text-primary mr-2"></i>
                <span className="text-muted">类型:</span>
                <span className="ml-2 text-light">{result.contentType}</span>
              </div>
              <div className="flex items-center p-2 hover:bg-transparent-dark transition rounded">
                <i className="fas fa-clock text-primary mr-2"></i>
                <span className="text-muted">时间:</span>
                <span className="ml-2 text-light">{formatUploadTime(result.uploadedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-center mt-6">
            <button 
              className="btn-3d px-6 py-2 btn-ripple"
              onClick={onUploadAnother}
            >
              <i className="fas fa-upload mr-2"></i>
              上传新图像
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}; 