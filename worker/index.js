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
    
    // 所有其他路径返回404
    return jsonResponse({ error: 'Not found' }, 404, request, env);
  }
}; 