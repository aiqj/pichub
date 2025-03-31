/**
 * PicHub - Cloudflare Worker for R2 image hosting
 * 
 * 功能包括:
 * - 文件上传和验证
 * - 基于魔数的文件类型检测
 * - 安全的API令牌验证
 * - 元数据存储
 * - 缓存优化
 */

import { hashPassword, verifyPassword, generateToken, authenticate, requireAdmin } from './auth.js';

// 已知文件类型的魔数签名
const FILE_SIGNATURES = {
  // JPEG: SOI marker followed by FF
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF]
  ],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  ],
  // GIF: either GIF87a or GIF89a
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  // WebP: RIFF....WEBP
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50]
  ],
  // SVG: starts with <?xml or <svg
  'image/svg+xml': [
    [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml
    [0x3C, 0x73, 0x76, 0x67]       // <svg
  ]
};

/**
 * 检测文件类型是否与声明的MIME类型匹配
 * - 修改后仅检查MIME类型，不进行魔数验证
 */
async function validateFileType(buffer, mimeType, env) {
  // 检查MIME类型是否在允许列表中
  const allowedTypes = env.ALLOWED_FILE_TYPES.split(',');
  if (!allowedTypes.includes(mimeType)) {
    console.log(`MIME type ${mimeType} not in allowed list: ${allowedTypes}`);
    return false;
  }

  // 直接返回true，不进行魔数验证
  return true;
}

/**
 * 安全的API令牌比较，防止时序攻击
 * 
 * @param {string} providedToken - 提供的API令牌
 * @param {string} validToken - 有效的API令牌
 * @returns {boolean} - 令牌是否匹配
 */
function secureCompare(providedToken, validToken) {
  if (!providedToken || !validToken || providedToken.length !== validToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < providedToken.length; i++) {
    result |= providedToken.charCodeAt(i) ^ validToken.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 生成UUID v4
 * @returns {string} - UUID字符串
 */
function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

/**
 * 从文件对象生成哈希名称
 * 
 * @param {File} file - 文件对象
 * @returns {Promise<string>} - 哈希名称
 */
async function generateHashFilename(fileBuffer, extension) {
  const hash = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 生成格式: 前8位哈希-4位随机数.扩展名
  return `${hashHex.substring(0, 8)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}${extension}`;
}

/**
 * 构造带有详细错误信息的JSON响应
 */
function jsonResponse(data, status = 200, request, env) {
  const origin = request.headers.get('Origin') || '*';
  const allowOrigin = env.CORS_ALLOW_ORIGIN === '*' ? 
    origin : 
    env.CORS_ALLOW_ORIGIN.split(',').includes(origin) ? 
      origin : null;
      
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowOrigin || env.CORS_ALLOW_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

/**
 * 构造图像文件响应
 */
function imageResponse(file, mimeType, cacheControl, env) {
  const headers = {
    'Content-Type': mimeType,
    'Cache-Control': cacheControl,
    'Access-Control-Allow-Origin': env.CORS_ALLOW_ORIGIN,
    'Etag': `"${file.httpEtag}"`,
  };
  
  return new Response(file.body, { headers });
}

/**
 * 处理跨域预检请求
 */
function handleCors(request, env) {
  // 获取请求的 Origin
  const origin = request.headers.get('Origin') || '*';
  
  // 如果 CORS_ALLOW_ORIGIN 是 *，则允许任何来源
  // 否则检查请求的 Origin 是否在允许列表中
  const allowOrigin = env.CORS_ALLOW_ORIGIN === '*' ? 
    origin : 
    env.CORS_ALLOW_ORIGIN.split(',').includes(origin) ? 
      origin : null;
      
  // 如果没有匹配的允许来源，返回 403
  if (!allowOrigin) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

/**
 * 处理图片获取请求并进行防盗链检查
 */
async function handleImageRequest(path, request, env) {
  const imageName = path.replace('/images/', '');
  if (!imageName || imageName === '' || imageName.includes('..')) {
    return jsonResponse({ error: 'Invalid image name' }, 400, request, env);
  }
  
  // 防盗链检查
  const referer = request.headers.get('Referer') || '';
  const allowedReferers = (env.ALLOWED_REFERERS || '*').split(',').map(r => r.trim());
  
  // 如果不是通配符 *，则进行引用检查
  if (allowedReferers.length > 0 && !allowedReferers.includes('*')) {
    const refererHost = (() => {
      try {
        if (!referer) return null;
        return new URL(referer).hostname;
      } catch {
        return null;
      }
    })();
    
    const refererAllowed = refererHost && allowedReferers.some(domain => 
      refererHost === domain || refererHost.endsWith(`.${domain}`)
    );
    
    if (!refererAllowed) {
      console.log(`Hotlinking blocked for ${imageName}, referer: ${referer}`);
      
      // 如果配置了默认图片，返回默认图片，否则返回403错误
      if (env.DEFAULT_IMAGE) {
        try {
          const defaultFile = await env.R2_BUCKET.get(env.DEFAULT_IMAGE);
          if (defaultFile) {
            const mimeType = defaultFile.httpMetadata?.contentType || 'image/png';
            return imageResponse(defaultFile, mimeType, env.CACHE_CONTROL, env);
          }
        } catch (error) {
          console.error("Error fetching default image:", error);
        }
      }
      
      return jsonResponse({ error: 'Hotlinking not allowed' }, 403, request, env);
    }
  }
  
  try {
    // 添加调试日志
    console.log(`Retrieving image: ${imageName}`);
    
    const file = await env.R2_BUCKET.get(imageName);
    if (!file) {
      return jsonResponse({ 
        error: 'Image not found',
        imageName: imageName,
        bucketName: env.R2_BUCKET.name || 'unknown'
      }, 404, request, env);
    }
    
    // 从文件元数据获取MIME类型，如果没有则使用默认
    const mimeType = file.httpMetadata?.contentType || 'application/octet-stream';
    return imageResponse(file, mimeType, env.CACHE_CONTROL, env);
  } catch (error) {
    return jsonResponse({ 
      error: 'Failed to retrieve image',
      message: error.message,
      imageName: imageName,
      stack: error.stack
    }, 500, request, env);
  }
}

/**
 * 处理用户注册
 */
async function handleRegister(request, env) {
  try {
    const { username, password, email, avatar } = await request.json();
    
    // 验证必填字段
    if (!username || !password) {
      return jsonResponse({ error: 'Missing required fields' }, 400, request, env);
    }
    
    // 检查用户名是否已存在
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();
    
    if (existingUser) {
      return jsonResponse({ error: 'Username already exists' }, 409, request, env);
    }
    
    // 检查邮箱是否已存在(如果提供了邮箱)
    if (email) {
      const existingEmail = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();
      
      if (existingEmail) {
        return jsonResponse({ error: 'Email already registered' }, 409, request, env);
      }
    }
    
    // 处理密码 - 这里可以根据需要加密或直接存储
    let finalPassword = password;
    if (process.env.STORE_PLAIN_PASSWORD !== 'true') {
      finalPassword = await hashPassword(password);
    }
    
    // 创建用户记录（默认未激活）
    const result = await env.DB.prepare(
      'INSERT INTO users (username, password, email, avatar) VALUES (?, ?, ?, ?)'
    ).bind(username, finalPassword, email || null, avatar || null).run();
    
    return jsonResponse({ 
      success: true,
      message: '注册成功，请联系管理员激活您的账号' 
    }, 201, request, env);
  } catch (error) {
    return jsonResponse({ error: 'Registration failed', message: error.message }, 500, request, env);
  }
}

/**
 * 处理用户登录
 */
async function handleLogin(request, env) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return jsonResponse({ error: 'Missing username or password' }, 400, request, env);
    }
    
    // 查询用户
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();
    
    if (!user) {
      return jsonResponse({ error: 'Invalid credentials' }, 401, request, env);
    }
    
    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return jsonResponse({ error: 'Invalid credentials' }, 401, request, env);
    }
    
    // 检查账号是否已激活
    if (!user.is_active) {
      return jsonResponse({ 
        error: 'Account not activated',
        message: '您的账号尚未激活，请联系管理员' 
      }, 403, request, env);
    }
    
    // 更新最后登录时间
    await env.DB.prepare(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // 生成JWT令牌
    const token = generateToken(user, env);
    
    return jsonResponse({ 
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      },
      token
    }, 200, request, env);
  } catch (error) {
    return jsonResponse({ error: 'Login failed', message: error.message }, 500, request, env);
  }
}

/**
 * 获取用户信息
 */
async function handleGetUserInfo(request, env) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }
  
  // 获取最新的用户信息
  const userData = await env.DB.prepare(
    'SELECT id, username, email, avatar, created_at, updated_at, is_active, role FROM users WHERE id = ?'
  ).bind(user.id).first();
  
  return jsonResponse({ user: userData }, 200, request, env);
}

/**
 * 管理员：获取所有用户
 */
async function handleGetAllUsers(request, env) {
  const admin = await requireAdmin(request, env);
  
  if (!admin) {
    return; // requireAdmin已处理错误响应
  }
  
  const users = await env.DB.prepare(
    'SELECT id, username, email, avatar, created_at, updated_at, is_active, role FROM users'
  ).all();
  
  return jsonResponse({ users: users.results }, 200, request, env);
}

/**
 * 管理员：激活/停用用户
 */
async function handleActivateUser(request, env) {
  const admin = await requireAdmin(request, env);
  
  if (!admin) {
    return; // requireAdmin已处理错误响应
  }
  
  try {
    const { userId, isActive } = await request.json();
    
    if (userId === undefined) {
      return jsonResponse({ error: 'User ID is required' }, 400, request, env);
    }
    
    const result = await env.DB.prepare(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(isActive === false ? 0 : 1, userId).run();
    
    if (result.changes === 0) {
      return jsonResponse({ error: 'User not found' }, 404, request, env);
    }
    
    return jsonResponse({ 
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully` 
    }, 200, request, env);
  } catch (error) {
    return jsonResponse({ error: 'Failed to update user', message: error.message }, 500, request, env);
  }
}

/**
 * 更新用户资料
 */
async function handleUpdateUserProfile(request, env) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }
  
  try {
    const { email, avatar, currentPassword, newPassword } = await request.json();
    
    // 准备更新数据
    let updateFields = [];
    let bindParams = [];
    
    if (email !== undefined) {
      // 检查邮箱是否已被其他用户使用
      const existingEmail = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).bind(email, user.id).first();
      
      if (existingEmail) {
        return jsonResponse({ error: 'Email already used by another account' }, 409, request, env);
      }
      
      updateFields.push('email = ?');
      bindParams.push(email);
    }
    
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      bindParams.push(avatar);
    }
    
    // 如果要更新密码，先验证当前密码
    if (newPassword && currentPassword) {
      const userData = await env.DB.prepare(
        'SELECT password FROM users WHERE id = ?'
      ).bind(user.id).first();
      
      const isValidPassword = await verifyPassword(currentPassword, userData.password);
      if (!isValidPassword) {
        return jsonResponse({ error: 'Current password is incorrect' }, 401, request, env);
      }
      
      // 处理新密码
      let finalPassword = newPassword;
      if (process.env.STORE_PLAIN_PASSWORD !== 'true') {
        finalPassword = await hashPassword(newPassword);
      }
      
      updateFields.push('password = ?');
      bindParams.push(finalPassword);
    }
    
    // 添加更新时间
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // 如果没有要更新的字段，直接返回成功
    if (updateFields.length === 0) {
      return jsonResponse({ success: true, message: 'No changes to update' }, 200, request, env);
    }
    
    // 更新用户资料
    bindParams.push(user.id);
    const result = await env.DB.prepare(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    ).bind(...bindParams).run();
    
    return jsonResponse({ 
      success: true,
      message: '用户资料更新成功'
    }, 200, request, env);
  } catch (error) {
    return jsonResponse({ error: 'Failed to update profile', message: error.message }, 500, request, env);
  }
}

/**
 * 处理图片上传
 */
async function handleFileUpload(request, env) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }
  
  // 检查账号是否已激活
  if (!user.is_active) {
    return jsonResponse({ 
      error: 'Account not activated',
      message: '您的账号尚未激活，请联系管理员' 
    }, 403, request, env);
  }
  
  try {
    const contentType = request.headers.get('Content-Type') || '';
    
    // 检查是否为multipart/form-data
    if (!contentType.includes('multipart/form-data')) {
      return jsonResponse({ error: 'Content-Type must be multipart/form-data' }, 400, request, env);
    }
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: 'No file uploaded' }, 400, request, env);
    }
    
    // 检查文件大小
    const maxSize = parseInt(env.MAX_FILE_SIZE || '52428800'); // 默认50MB
    if (file.size > maxSize) {
      return jsonResponse({ 
        error: 'File too large', 
        maxSize: `${maxSize / 1024 / 1024}MB`,
        uploadedSize: `${file.size / 1024 / 1024}MB`
      }, 413, request, env);
    }
    
    // 获取文件Buffer用于类型验证和哈希生成
    const fileBuffer = await file.arrayBuffer();
    
    // 验证文件类型
    const mimeType = file.type;
    const isValidType = await validateFileType(fileBuffer, mimeType, env);
    if (!isValidType) {
      return jsonResponse({ 
        error: 'Invalid file type', 
        providedType: mimeType,
        allowedTypes: env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
      }, 415, request, env);
    }
    
    // 提取原始文件名
    const originalName = file.name;
    const extension = originalName.includes('.') ? 
      originalName.substring(originalName.lastIndexOf('.')) : '';
    
    // 生成安全的文件名
    const filename = await generateHashFilename(fileBuffer, extension);
    
    // 准备元数据
    const metadata = {
      contentType: mimeType,
      uploadedAt: new Date().toISOString(),
      originalName: originalName,
      fileSize: file.size,
      uuid: uuidv4()
    };
    
    // 上传到R2
    await env.R2_BUCKET.put(filename, fileBuffer, {
      httpMetadata: { contentType: mimeType },
      customMetadata: metadata
    });
    
    // 构建图像URL
    const url = new URL(request.url);
    const imageUrl = `${url.origin}/images/${filename}`;
    
    // 记录上传到files表
    await env.DB.prepare(
      'INSERT INTO files (user_id, file_name, original_name, file_size, file_type) VALUES (?, ?, ?, ?, ?)'
    ).bind(user.id, filename, originalName, file.size, mimeType).run();
    
    // 返回结果
    return jsonResponse({ 
      success: true, 
      filename, 
      url: imageUrl,
      ...metadata
    }, 200, request, env);
  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({ 
      error: 'Upload failed', 
      message: error.message || 'Unknown error during file upload',
      stack: error.stack
    }, 500, request, env);
  }
}

/**
 * 获取用户上传历史
 */
async function handleGetUserFiles(request, env) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }
  
  // 默认查询用户自己的文件
  let userId = user.id;
  
  // 允许管理员查询任何用户的文件
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('userId');
  
  if (queryUserId && user.role === 'admin') {
    userId = queryUserId;
  }
  
  const files = await env.DB.prepare(
    'SELECT * FROM files WHERE user_id = ? ORDER BY uploaded_at DESC'
  ).bind(userId).all();
  
  return jsonResponse({ files: files.results }, 200, request, env);
}

/**
 * 管理员：获取所有文件
 */
async function handleGetAllFiles(request, env) {
  const admin = await requireAdmin(request, env);
  
  if (!admin) {
    return; // requireAdmin已处理错误响应
  }
  
  const files = await env.DB.prepare(
    `SELECT files.*, users.username
     FROM files
     JOIN users ON files.user_id = users.id
     ORDER BY files.uploaded_at DESC`
  ).all();
  
  return jsonResponse({ files: files.results }, 200, request, env);
}

/**
 * 删除文件
 */
async function handleDeleteFile(request, env) {
  const user = await authenticate(request, env);
  
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }
  
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return jsonResponse({ error: 'File ID is required' }, 400, request, env);
    }
    
    // 查询文件信息
    const file = await env.DB.prepare(
      'SELECT * FROM files WHERE id = ?'
    ).bind(fileId).first();
    
    if (!file) {
      return jsonResponse({ error: 'File not found' }, 404, request, env);
    }
    
    // 验证权限：只能删除自己的文件，除非是管理员
    if (file.user_id !== user.id && user.role !== 'admin') {
      return jsonResponse({ error: 'Permission denied' }, 403, request, env);
    }
    
    // 从R2存储中删除文件
    await env.R2_BUCKET.delete(file.file_name);
    
    // 从数据库中删除记录
    await env.DB.prepare(
      'DELETE FROM files WHERE id = ?'
    ).bind(fileId).run();
    
    return jsonResponse({ 
      success: true,
      message: '文件已成功删除'
    }, 200, request, env);
  } catch (error) {
    return jsonResponse({ error: 'Failed to delete file', message: error.message }, 500, request, env);
  }
}

/**
 * 管理员：修改用户密码
 */
async function handleUpdateUserPassword(request, env) {
  const admin = await requireAdmin(request, env);
  
  if (!admin) {
    return; // requireAdmin已处理错误响应
  }
  
  try {
    const { userId, newPassword } = await request.json();
    
    if (!userId || !newPassword) {
      return jsonResponse({ error: '用户ID和新密码是必填项' }, 400, request, env);
    }
    
    // 检查用户是否存在
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return jsonResponse({ error: '用户不存在' }, 404, request, env);
    }
    
    // 处理新密码
    let finalPassword = newPassword;
    if (process.env.STORE_PLAIN_PASSWORD !== 'true') {
      finalPassword = await hashPassword(newPassword);
    }
    
    // 更新密码
    const result = await env.DB.prepare(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(finalPassword, userId).run();
    
    return jsonResponse({ 
      success: true,
      message: '用户密码已成功修改' 
    }, 200, request, env);
  } catch (error) {
    return jsonResponse({ error: '修改密码失败', message: error.message }, 500, request, env);
  }
}

/**
 * 管理员：删除用户
 */
async function handleDeleteUser(request, env) {
  const admin = await requireAdmin(request, env);
  
  if (!admin) {
    return; // requireAdmin已处理错误响应
  }
  
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return jsonResponse({ error: '用户ID是必填项' }, 400, request, env);
    }
    
    // 不允许管理员删除自己
    if (userId === admin.id) {
      return jsonResponse({ error: '不能删除自己的账号' }, 400, request, env);
    }
    
    // 检查用户是否存在
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return jsonResponse({ error: '用户不存在' }, 404, request, env);
    }
    
    // 获取该用户的所有文件
    const files = await env.DB.prepare(
      'SELECT file_name FROM files WHERE user_id = ?'
    ).bind(userId).all();
    
    // 删除该用户的所有文件
    if (files.results && files.results.length > 0) {
      // 从R2中删除文件
      for (const file of files.results) {
        await env.R2_BUCKET.delete(file.file_name);
      }
      
      // 从数据库中删除文件记录
      await env.DB.prepare(
        'DELETE FROM files WHERE user_id = ?'
      ).bind(userId).run();
    }
    
    // 删除用户
    const result = await env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(userId).run();
    
    return jsonResponse({ 
      success: true,
      message: '用户及其所有文件已成功删除' 
    }, 200, request, env);
  } catch (error) {
    return jsonResponse({ error: '删除用户失败', message: error.message }, 500, request, env);
  }
}

/**
 * 主要请求处理函数
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 处理OPTIONS请求（CORS预检）
    if (request.method === 'OPTIONS') {
      return handleCors(request, env);
    }
    
    // 处理根路径
    if (path === '/' || path === '') {
      return jsonResponse({
        name: 'PicHub API',
        description: 'Image hosting service API',
        endpoints: {
          upload: '/upload',
          images: '/images/{filename}',
          health: '/health'
        }
      }, 200, request, env);
    }
    
    // 图片获取请求 - 路径格式: /images/filename.ext
    if (path.startsWith('/images/') && request.method === 'GET') {
      return handleImageRequest(path, request, env);
    }
    
    // 图片上传请求 - POST到/upload
    if (path === '/upload' && request.method === 'POST') {
      // 验证API令牌
      const authHeader = request.headers.get('Authorization') || '';
      const providedToken = authHeader.replace('Bearer ', '');
      
      if (!secureCompare(providedToken, env.UPLOAD_API_TOKEN)) {
        return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
      }
      
      try {
        const contentType = request.headers.get('Content-Type') || '';
        
        // 检查是否为multipart/form-data
        if (!contentType.includes('multipart/form-data')) {
          return jsonResponse({ error: 'Content-Type must be multipart/form-data' }, 400, request, env);
        }
        
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file || !(file instanceof File)) {
          return jsonResponse({ error: 'No file uploaded' }, 400, request, env);
        }
        
        // 检查文件大小
        const maxSize = parseInt(env.MAX_FILE_SIZE);
        if (file.size > maxSize) {
          return jsonResponse({ 
            error: 'File too large', 
            maxSize: `${maxSize / 1024 / 1024}MB`,
            uploadedSize: `${file.size / 1024 / 1024}MB`
          }, 413, request, env);
        }
        
        // 获取文件Buffer用于类型验证和哈希生成
        const fileBuffer = await file.arrayBuffer();
        
        // 验证文件类型
        const mimeType = file.type;
        const isValidType = await validateFileType(fileBuffer, mimeType, env);
        if (!isValidType) {
          return jsonResponse({ 
            error: 'Invalid file type', 
            providedType: mimeType,
            allowedTypes: env.ALLOWED_FILE_TYPES
          }, 415, request, env);
        }
        
        // 提取扩展名
        const originalName = file.name;
        const extension = originalName.includes('.') ? 
          originalName.substring(originalName.lastIndexOf('.')) : '';
        
        // 生成安全的文件名
        const filename = await generateHashFilename(fileBuffer, extension);
        
        // 准备元数据
        const metadata = {
          contentType: mimeType,
          uploadedAt: new Date().toISOString(),
          originalName: originalName,
          fileSize: file.size,
          uuid: uuidv4()
        };
        
        // 上传到R2
        await env.R2_BUCKET.put(filename, fileBuffer, {
          httpMetadata: { contentType: mimeType },
          customMetadata: metadata
        });
        
        // 构建图像URL并返回
        const imageUrl = `${url.origin}/images/${filename}`;
        
        // 修改：记录上传到files表
        await env.DB.prepare(
          'INSERT INTO files (user_id, file_name, original_name, file_size, file_type) VALUES (?, ?, ?, ?, ?)'
        ).bind(user.id, filename, originalName, file.size, mimeType).run();
        
        return jsonResponse({ 
          success: true, 
          filename, 
          url: imageUrl,
          ...metadata
        }, 200, request, env);
      } catch (error) {
        return jsonResponse({ error: 'Upload failed', message: error.message }, 500, request, env);
      }
    }
    
    // 健康检查端点
    if (path === '/health') {
      return jsonResponse({ status: 'OK', version: '1.0.0' }, 200, request, env);
    }
    
    // API路由
    if (path.startsWith('/api/')) {
      // 认证相关API
      if (path === '/api/register' && request.method === 'POST') {
        return handleRegister(request, env);
      }
      
      if (path === '/api/login' && request.method === 'POST') {
        return handleLogin(request, env);
      }
      
      if (path === '/api/user' && request.method === 'GET') {
        return handleGetUserInfo(request, env);
      }
      
      if (path === '/api/user' && request.method === 'PUT') {
        return handleUpdateUserProfile(request, env);
      }
      
      // 管理员API
      if (path === '/api/admin/users' && request.method === 'GET') {
        return handleGetAllUsers(request, env);
      }
      
      if (path === '/api/admin/users/activate' && request.method === 'POST') {
        return handleActivateUser(request, env);
      }
      
      if (path === '/api/admin/files' && request.method === 'GET') {
        return handleGetAllFiles(request, env);
      }
      
      // 文件管理API
      if (path === '/api/upload' && request.method === 'POST') {
        return handleFileUpload(request, env);
      }
      
      if (path === '/api/files' && request.method === 'GET') {
        return handleGetUserFiles(request, env);
      }
      
      if (path === '/api/files' && request.method === 'DELETE') {
        return handleDeleteFile(request, env);
      }
      
      if (path === '/api/admin/users/update-password' && request.method === 'POST') {
        return handleUpdateUserPassword(request, env);
      }
      
      if (path === '/api/admin/users/delete' && request.method === 'POST') {
        return handleDeleteUser(request, env);
      }
    }
    
    // 所有其他路径返回404
    return jsonResponse({ error: 'Not found' }, 404, request, env);
  }
}; 