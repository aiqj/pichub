// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
  is_active?: boolean;
  role: 'admin' | 'user';
}

// 文件相关类型
export interface FileItem {
  id: number;
  user_id: number;
  file_name: string;
  original_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  is_public: number; // 0表示私有，1表示公开
  username?: string; // 管理员查看全部文件时包含用户名
}

// 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
  data?: T;
}

// 状态类型
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface FileState {
  files: FileItem[];
  loading: boolean;
  error: string | null;
}

export interface AdminState {
  users: User[];
  files: FileItem[];
  loading: boolean;
  error: string | null;
}

// 共享代码片段类型
export interface CodeSnippet {
  url: string;
  htmlCode: string;
  markdownCode: string;
} 