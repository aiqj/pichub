import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import FileCard from '../components/FileCard';
import { fileApi } from '../utils/api';
import { FileItem } from '../types';
import ImagePreview from '../components/ImagePreview';
import FileSkeleton from '../components/FileSkeleton';

const FilesPage = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [previewAlt, setPreviewAlt] = useState<string>('图片预览');
  
  // 加载文件列表
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fileApi.getUserFiles();
        if (response.data && response.data.files) {
          setFiles(response.data.files);
        }
      } catch (err: any) {
        setError('获取文件列表失败，请刷新页面重试。');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, []);
  
  // 处理图片预览
  const handlePreviewImage = (file: FileItem) => {
    const apiHost = process.env.NEXT_PUBLIC_API_HOST || process.env.API_HOST;
    setPreviewUrl(`${apiHost}/images/${file.file_name}`);
    setPreviewAlt(file.original_name);
    setShowImagePreview(true);
  };
  
  // 关闭预览
  const handleClosePreview = () => {
    setShowImagePreview(false);
    setPreviewUrl(null);
  };
  
  // 处理文件删除
  const handleDeleteFile = (id: number) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  // 渲染骨架屏
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <FileSkeleton key={`skeleton-${index}`} />
    ));
  };
  
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-6">
        我的文件
      </h1>
      
      <div className="w-full max-w-7xl bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 shadow-2xl">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeletons()}
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-800 text-red-400 px-6 py-4 rounded-md">
            {error}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xl">您尚未上传任何文件</p>
            <a
              href="/"
              className="mt-4 text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              上传您的第一个文件
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <FileCard 
                key={file.id} 
                file={file} 
                onDelete={handleDeleteFile} 
                onPreview={file.file_type.startsWith('image/') ? () => handlePreviewImage(file) : undefined} 
              />
            ))}
          </div>
        )}
        
        {files.length > 0 && (
          <div className="mt-8 text-sm text-gray-400 text-center">
            总共 {files.length} 个文件
          </div>
        )}
      </div>
      
      {/* 图片预览模态框 */}
      {showImagePreview && previewUrl && (
        <ImagePreview 
          imageUrl={previewUrl} 
          onClose={handleClosePreview}
          alt={previewAlt}
        />
      )}
    </div>
  );
};

export default FilesPage; 