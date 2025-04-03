import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/*
 * bcrypt 加密
 * 注意：它每次加密都会生成不同的密文，所以不能直接比较
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(password, hashedPassword) {
  // 如果存储的是明文密码，直接比较
  if (process.env.STORE_PLAIN_PASSWORD === 'true') {
    return password === hashedPassword;
  }
  // 否则使用bcrypt比较
  return bcrypt.compare(password, hashedPassword);
}

// PBKDF2 加密
export async function hashPasswordSecureDeterministic(password) {
  // 固定盐值 - 在生产环境中应该是复杂且保密的值
  const FIXED_SALT = 'vlllo.com';
  
  // 将密码转换为ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(FIXED_SALT);
  
  // 从密码生成密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw', 
    passwordBuffer, 
    { name: 'PBKDF2' }, 
    false, 
    ['deriveBits']
  );
  
  // 使用PBKDF2派生密钥
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证密码
export async function verifyPasswordSecureDeterministic(password, storedHash) {
  const hashedPassword = await hashPasswordSecureDeterministic(password);
  return hashedPassword === storedHash;
}

// 生成JWT令牌
export function generateToken(user, env) {
  // 包含必要的用户信息：ID、角色和激活状态
  const tokenData = {
    id: user.id,
    role: user.role,
    is_active: user.is_active
  };
  
  return jwt.sign(
    tokenData,
    env.JWT_SECRET,
    { expiresIn: '7d' } // 令牌有效期7天
  );
}

// 验证JWT令牌
export function verifyToken(token, env) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 中间件：验证用户身份
export async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token, env);
  
  if (!decoded) {
    return null;
  }
  
  return decoded;
}

// 中间件：验证管理员身份
export async function requireAdmin(request, env) {
  const user = await authenticate(request, env);
  
  if (!user || user.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized' }, 403, request, env);
  }
  
  return user;
}
