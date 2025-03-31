'use client';

import { useRef, useState } from 'react';

interface UploadSectionProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ 
  onFilesSelected, 
  isUploading, 
  uploadProgress 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteAnimation, setPasteAnimation] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFilesSelected(event.target.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const showPasteAnimation = () => {
    setPasteAnimation(true);
    setTimeout(() => setPasteAnimation(false), 1500);
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
      <div className="tech-lines-horizontal absolute top-10 left-10 w-20 opacity-40"></div>
      <div className="tech-lines-horizontal absolute bottom-0"></div>
      <div className="tech-lines-horizontal absolute bottom-10 right-10 w-30 opacity-30"></div>
      <div className="tech-lines-vertical absolute left-0"></div>
      <div className="tech-lines-vertical absolute right-0"></div>
      
      {/* <h3 className="text-xl font-semibold mb-4 text-center flex-center gap-3">
        <span className="text-gradient bg-gradient-primary neon-text">
          <i className="fas fa-satellite-dish mr-2"></i>
          智能图像上传
        </span>
      </h3> */}
      
      <div 
        className={`upload-zone p-8 text-center transition cursor-pointer relative min-h-220 flex-center-col gap-4 ${
          isDragOver ? 'neon-border active' : ''
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {pasteAnimation && (
          <div className="absolute inset-0 flex-center-col bg-transparent-dark rounded z-10 animate-scale-in card-glass">
            <div className="text-4xl text-primary mb-2 animate-pulse">
              <i className="fas fa-paste"></i>
            </div>
            <div className="text-lg text-light neon-text">图像已粘贴</div>
          </div>
        )}
        
        <div className="relative p-4">
          <div className="text-5xl text-primary mb-4 animate-pulse">
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <div className="absolute inset-0 blur-sm opacity-50 animate-glow"></div>
        </div>
        
        <p className="text-light mb-6">将图像拖放到上传区域，或</p>
        
        <button className="btn-3d px-6 py-3 btn-ripple">
          <i className="fas fa-image mr-2"></i>选择图像
          <span className="absolute inset-0 overflow-hidden"></span>
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={handleFileSelect}
        />
        
        <div className="flex-center gap-4 mt-6">
          <div className="flex-center text-muted">
            <i className="fas fa-keyboard mr-2 icon-pulse"></i> 
            <span>支持快捷键Ctrl+V粘贴</span>
          </div>
          <div className="w-px h-4 bg-primary opacity-30"></div>
          <div className="flex-center text-muted">
            <i className="fas fa-info-circle mr-2"></i>
            <span>最大文件大小: 50MB</span>
          </div>
        </div>
        
        <div className="text-xs text-muted mt-4">
          支持格式: JPEG, PNG, WebP, GIF, SVG
        </div>
      </div>
      
      {isUploading && (
        <div className="mt-6 p-4 card-glass animate-fade-in">
          <div className="title-decorated text-light mb-3 text-center">
            <span className="neon-text-accent">数据传输中</span>
          </div>
          <div className="flex-between mb-2">
            <span className="text-sm text-light">上传进度</span>
            <span className="text-sm text-accent">{uploadProgress}%</span>
          </div>
          <div className="progress-container">
            <div 
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            >
              <div className="progress-glow"></div>
              <div className="progress-dots"></div>
            </div>
          </div>
          <div className="text-center py-2 text-muted text-sm animate-blink">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            正在上传您的图像...
          </div>
        </div>
      )}
    </section>
  );
}; 