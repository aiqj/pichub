class PicHubAuth {
  constructor() {
    this.config = {
      apiEndpoint: window.ENV && window.ENV.API_ENDPOINT ? window.ENV.API_ENDPOINT : null
    };
    
    // 检查配置
    if (!this.config.apiEndpoint) {
      this.showNotification('系统配置错误，请联系管理员', 'error', true);
      return;
    }
    
    // 初始化元素
    this.initElements();
    
    // 初始化事件
    this.initEvents();
    
    // 检查已保存的登录状态
    this.checkAuth();
  }
  
  initElements() {
    // 登录页面元素
    this.elements = {
      loginSection: document.getElementById('loginSection'),
      usernameInput: document.getElementById('usernameInput'),
      passwordInput: document.getElementById('passwordInput'),
      loginButton: document.getElementById('loginButton'),
      notificationsContainer: document.getElementById('notificationsContainer')
    };
  }
  
  initEvents() {
    // 登录按钮点击
    if (this.elements.loginButton) {
      this.elements.loginButton.addEventListener('click', () => this.handleLogin());
    }
    
    // 密码输入框回车
    if (this.elements.passwordInput) {
      this.elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    }
  }
  
  // 检查是否已登录
  checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (token && user) {
      // 已登录，重定向到主页
      window.location.href = 'index.html';
    }
  }
  
  // 处理登录
  async handleLogin() {
    const username = this.elements.usernameInput.value.trim();
    const password = this.elements.passwordInput.value.trim();
    
    if (!username || !password) {
      this.showNotification('请输入用户名和密码', 'warning');
      return;
    }
    
    try {
      const response = await fetch(`${this.config.apiEndpoint}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'Account not activated') {
          this.showNotification(data.message || '账号未激活，请联系管理员', 'error');
        } else {
          this.showNotification(data.error || '登录失败', 'error');
        }
        return;
      }
      
      // 保存登录信息
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // 登录成功，跳转到主页
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Login error:', error);
      this.showNotification('登录请求失败，请检查网络', 'error');
    }
  }
  
  // 显示通知
  showNotification(message, type = 'info', persistent = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
      </div>
      <div class="notification-message">${message}</div>
    `;
    
    this.elements.notificationsContainer.appendChild(notification);
    
    if (!persistent) {
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  }
}

// 初始化认证功能
document.addEventListener('DOMContentLoaded', () => {
  new PicHubAuth();
});
