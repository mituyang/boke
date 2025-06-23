import { NextRequest, NextResponse } from 'next/server';

// 模拟当前用户数据
const mockUser = {
  id: 1,
  username: "admin",
  name: "管理员",
  email: "admin@example.com",
  role: "admin"
};

export async function GET(request: NextRequest) {
  try {
    // 在实际项目中，这里会验证JWT token或session
    // 现在返回模拟用户数据用于开发测试
    return NextResponse.json({
      user: mockUser,
      success: true
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
} 