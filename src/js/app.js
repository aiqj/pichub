/**
 * PicHub - 前端主应用代码
 * 实现UI交互、图片上传和预览功能
 */

class PicHubApp {
  constructor() {
    // API配置 - 只从安全来源读取
    this.config = {
      apiEndpoint: window.ENV && window.ENV.API_ENDPOINT ? window.ENV.API_ENDPOINT : null
    };
    
    // DOM 元素
    this.elements = {
      // 认证相关
      authSection: document.getElementById('authSection'),
      apiTokenInput: document.getElementById('apiTokenInput'),
      authButton: document.getElementById('authButton'),
      
      // 上传相关
      uploadSection: document.getElementById('uploadSection'),
      dropArea: document.getElementById('dropArea'),
      fileInput: document.getElementById('fileInput'),
      progressContainer: document.getElementById('progressContainer'),
      progressBar: document.getElementById('progressBar'),
      progressText: document.getElementById('progressText'),
      
      // 结果相关
      resultsSection: document.getElementById('resultsSection'),
      resultImage: document.getElementById('resultImage'),
      imageUrl: document.getElementById('imageUrl'),
      htmlCode: document.getElementById('htmlCode'),
      markdownCode: document.getElementById('markdownCode'),
      fileName: document.getElementById('fileName'),
      fileSize: document.getElementById('fileSize'),
      fileType: document.getElementById('fileType'),
      uploadTime: document.getElementById('uploadTime'),
      uploadAnother: document.getElementById('uploadAnother'),
      
      // 通知
      notificationsContainer: document.getElementById('notificationsContainer')
    };
    
    // 应用状态
    this.state = {
      apiToken: localStorage.getItem('apiToken') || '',
      isAuthenticated: Boolean(localStorage.getItem('apiToken')),
      isUploading: false,
      currentFile: null,
      uploadProgress: 0,
      uploadResult: null
    };
    
    // 如果有保存的令牌，自动显示上传界面
    if (this.state.isAuthenticated) {
      this.showUploadInterface();
    }
    
    // 初始化事件监听器
    this.initEventListeners();
    
    // 初始化剪贴板功能
    this.initClipboard();
  }
  
  /**
   * 初始化所有事件监听器
   */
  initEventListeners() {
    // 认证相关
    this.elements.authButton.addEventListener('click', () => this.authenticate());
    this.elements.apiTokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.authenticate();
    });
    
    // 文件选择和拖放
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    // 拖放区域事件
    this.elements.dropArea.addEventListener('click', () => this.elements.fileInput.click());
    
    // 修复拖拽处理 - 使用preventDefault确保事件可以正确触发
    this.elements.dropArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropArea.classList.add('drag-over');
    });
    
    this.elements.dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropArea.classList.add('drag-over');
    });
    
    this.elements.dropArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropArea.classList.remove('drag-over');
    });
    
    this.elements.dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.elements.dropArea.classList.remove('drag-over');
      
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleFiles(e.dataTransfer.files);
      }
    });
    
    // 剪贴板粘贴事件
    document.addEventListener('paste', (e) => {
      if (!this.state.isAuthenticated || this.elements.uploadSection.classList.contains('hidden')) {
        return; // 只在上传界面处理粘贴事件
      }
      
      this.handlePaste(e);
    });
    
    // 结果页面返回按钮
    this.elements.uploadAnother.addEventListener('click', () => {
      this.resetUpload();
      this.showUploadInterface();
    });
  }
  
  /**
   * 初始化剪贴板功能
   */
  initClipboard() {
    try {
      const clipboard = new ClipboardJS('.copy-btn');
      
      clipboard.on('success', (e) => {
        this.showNotification('成功复制到剪贴板', 'success');
        e.clearSelection();
      });
      
      clipboard.on('error', () => {
        this.showNotification('复制失败，请手动选择并复制', 'error');
      });
    } catch (error) {
      console.warn('剪贴板功能初始化失败:', error);
    }
  }
  
  /**
   * 处理认证过程
   */
  authenticate() {
    const token = this.elements.apiTokenInput.value.trim();
    
    if (!token) {
      this.showNotification('请输入API Token', 'warning');
      return;
    }
    
    // 保存令牌到localStorage和应用状态
    localStorage.setItem('apiToken', token);
    this.state.apiToken = token;
    this.state.isAuthenticated = true;
    
    // 显示上传界面
    this.showNotification('认证成功', 'success');
    this.showUploadInterface();
  }
  
  /**
   * 显示上传界面
   */
  showUploadInterface() {
    this.elements.authSection.classList.add('hidden');
    this.elements.uploadSection.classList.remove('hidden');
    this.elements.resultsSection.classList.add('hidden');
  }
  
  /**
   * 显示结果界面
   */
  showResultsInterface() {
    this.elements.authSection.classList.add('hidden');
    this.elements.uploadSection.classList.add('hidden');
    this.elements.resultsSection.classList.remove('hidden');
  }
  
  /**
   * 处理文件选择
   */
  handleFileSelect(event) {
    if (event.target.files && event.target.files.length > 0) {
      this.handleFiles(event.target.files);
    }
  }
  
  /**
   * 处理文件(验证并上传)
   */
  handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0]; // 只处理第一个文件
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      this.showNotification(`不支持的文件类型: ${file.type}`, 'error');
      return;
    }
    
    // 检查文件大小 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showNotification(`文件过大: ${this.formatFileSize(file.size)}，最大支持50MB`, 'error');
      return;
    }
    
    // 保存当前文件并开始上传
    this.state.currentFile = file;
    this.uploadFile(file);
  }
  
  /**
   * 验证API端点是否配置
   */
  validateApiConfig() {
    if (!this.config.apiEndpoint) {
      this.showNotification('系统配置错误，请联系管理员', 'error');
      return false;
    }
    return true;
  }
  
  /**
   * 上传文件到服务器
   */
  async uploadFile(file) {
    if (!this.validateApiConfig()) return;
    if (this.state.isUploading) return;
    
    this.state.isUploading = true;
    this.showProgress();
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          this.updateProgress(progress);
        }
      });
      
      // 设置完成回调
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          this.handleUploadSuccess(response);
        } else {
          let errorMessage = '上传失败';
          try {
            const error = JSON.parse(xhr.responseText);
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // 解析错误，使用默认错误消息
          }
          this.handleUploadError(errorMessage);
        }
      });
      
      // 设置错误回调
      xhr.addEventListener('error', () => {
        this.handleUploadError('网络错误，请检查连接');
      });
      
      // 设置超时回调
      xhr.addEventListener('timeout', () => {
        this.handleUploadError('上传超时，请重试');
      });
      
      // 使用配置的API端点
      const uploadUrl = `${this.config.apiEndpoint}/upload`;
      
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${this.state.apiToken}`);
      xhr.timeout = 60000;
      xhr.send(formData);
    } catch (error) {
      this.handleUploadError(error.message || '上传过程中发生错误');
    }
  }
  
  /**
   * 处理上传成功
   */
  handleUploadSuccess(response) {
    this.state.isUploading = false;
    this.state.uploadResult = response;
    
    // 更新结果界面
    this.elements.resultImage.src = response.url;
    this.elements.imageUrl.value = response.url;
    this.elements.htmlCode.value = `<img src="${response.url}" alt="${response.originalName}" />`;
    this.elements.markdownCode.value = `![${response.originalName}](${response.url})`;
    
    this.elements.fileName.textContent = response.originalName;
    this.elements.fileSize.textContent = this.formatFileSize(response.fileSize);
    this.elements.fileType.textContent = response.contentType;
    
    // 格式化上传时间
    const uploadDate = new Date(response.uploadedAt);
    this.elements.uploadTime.textContent = uploadDate.toLocaleString();
    
    // 显示结果界面
    this.showResultsInterface();
    this.showNotification('图片上传成功', 'success');
  }
  
  /**
   * 处理上传错误
   */
  handleUploadError(message) {
    this.state.isUploading = false;
    this.hideProgress();
    this.showNotification(`上传失败: ${message}`, 'error');
  }
  
  /**
   * 显示进度条
   */
  showProgress() {
    this.elements.progressContainer.classList.remove('hidden');
    this.updateProgress(0);
  }
  
  /**
   * 隐藏进度条
   */
  hideProgress() {
    this.elements.progressContainer.classList.add('hidden');
  }
  
  /**
   * 更新进度条
   */
  updateProgress(percent) {
    this.state.uploadProgress = percent;
    this.elements.progressBar.style.setProperty('--progress', `${percent}%`);
    this.elements.progressText.textContent = `上传中... ${percent}%`;
  }
  
  /**
   * 重置上传状态
   */
  resetUpload() {
    this.state.currentFile = null;
    this.state.uploadProgress = 0;
    this.state.isUploading = false;
    this.hideProgress();
    this.elements.fileInput.value = '';
  }
  
  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 根据类型选择图标
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
      <span class="notification-icon"><i class="fas fa-${icon}"></i></span>
      <span class="notification-message">${message}</span>
      <span class="notification-close"><i class="fas fa-times"></i></span>
    `;
    
    // 添加关闭按钮功能
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
    
    // 添加到容器
    this.elements.notificationsContainer.appendChild(notification);
    
    // 自动消失
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
  
  /**
   * 处理粘贴事件
   */
  handlePaste(event) {
    const clipboardItems = event.clipboardData.items;
    let imageItem = null;
    
    // 检查剪贴板内容
    for (let i = 0; i < clipboardItems.length; i++) {
      if (clipboardItems[i].type.indexOf('image') !== -1) {
        imageItem = clipboardItems[i];
        break;
      }
    }
    
    // 如果有图片，处理它
    if (imageItem) {
      const blob = imageItem.getAsFile();
      const timestamp = new Date().getTime();
      // 创建一个伪File对象，因为部分浏览器粘贴的是blob
      const file = new File([blob], `screenshot-${timestamp}.png`, { type: 'image/png' });
      
      // 显示粘贴提示
      this.showPasteAnimation();
      
      // 处理文件上传
      this.handleFiles([file]);
    }
  }
  
  /**
   * 显示粘贴动画提示
   */
  showPasteAnimation() {
    // 创建粘贴提示元素
    const pasteIndicator = document.createElement('div');
    pasteIndicator.className = 'paste-indicator';
    pasteIndicator.innerHTML = `
      <div class="paste-icon">
        <i class="fas fa-paste"></i>
      </div>
      <div class="paste-text">已粘贴截图</div>
    `;
    
    // 添加到上传区域
    this.elements.dropArea.appendChild(pasteIndicator);
    
    // 短暂显示后移除
    setTimeout(() => {
      pasteIndicator.classList.add('fade-out');
      setTimeout(() => {
        if (pasteIndicator.parentNode) {
          pasteIndicator.remove();
        }
      }, 300);
    }, 1500);
  }
}

// 在DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.picHubApp = new PicHubApp();
}); 