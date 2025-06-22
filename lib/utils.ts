import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化日期为上海时区 (UTC+8)
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  
  // 转换为上海时区 (UTC+8)
  const shanghaiTime = new Date(d.getTime() + (8 * 60 * 60 * 1000) - (d.getTimezoneOffset() * 60 * 1000));
  
  return shanghaiTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
}

// 获取当前上海时区时间的ISO字符串
export function getShanghaiTimeISO(): string {
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return shanghaiTime.toISOString().replace('Z', '+08:00');
}

// 前端加密函数（用于敏感数据传输）
export async function encryptData(data: string, key?: string): Promise<string> {
  if (typeof window === 'undefined') return data; // 服务端不处理
  
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // 生成随机盐值
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // 使用简单的异或加密（实际项目应使用更强的加密）
    const encrypted = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      encrypted[i] = dataBuffer[i] ^ salt[i % salt.length];
    }
    
    // 组合盐值和加密数据
    const combined = new Uint8Array(salt.length + encrypted.length);
    combined.set(salt);
    combined.set(encrypted, salt.length);
    
    // 转换为base64
    let binaryString = '';
    for (let i = 0; i < combined.length; i++) {
      binaryString += String.fromCharCode(combined[i]);
    }
    return btoa(binaryString);
  } catch (error) {
    console.error('Encryption error:', error);
    return data; // 加密失败时返回原数据
  }
}

// 前端解密函数
export async function decryptData(encryptedData: string): Promise<string> {
  if (typeof window === 'undefined') return encryptedData; // 服务端不处理
  
  try {
    // 从base64解码
    const binaryString = atob(encryptedData);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // 提取盐值和加密数据
    const salt = combined.slice(0, 16);
    const encrypted = combined.slice(16);
    
    // 解密
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ salt[i % salt.length];
    }
    
    // 转换为字符串
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // 解密失败时返回原数据
  }
} 