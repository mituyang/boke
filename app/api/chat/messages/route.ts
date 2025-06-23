import { NextRequest, NextResponse } from 'next/server';

// 模拟数据库 - 在实际项目中应该使用真实数据库
let messages: any[] = [
  {
    id: 1,
    user_id: 1,
    username: "admin",
    user_name: "管理员",
    content: "欢迎来到聊天室！",
    message_type: "text",
    created_at: "2025-06-23 13:14:46",
    is_edited: false
  },
  {
    id: 2,
    user_id: 1,
    username: "admin", 
    user_name: "管理员",
    content: "这里是一个简单的聊天室示例",
    message_type: "text", 
    created_at: "2025-06-23 13:15:00",
    is_edited: false
  }
];

let messageIdCounter = 3;

// 模拟当前用户
const currentUser = {
  id: 1,
  username: "admin",
  name: "管理员",
  role: "admin"
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId') || '1';
    
    // 返回消息列表
    return NextResponse.json({
      messages: messages,
      hasMore: false
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { roomId = 1, content, messageType = 'text' } = await request.json();

    // 验证消息内容
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }

    if (trimmedContent.length > 500) {
      return NextResponse.json({ error: '消息长度不能超过500字符' }, { status: 400 });
    }

    // 创建新消息
    const newMessage = {
      id: messageIdCounter++,
      user_id: currentUser.id,
      username: currentUser.username,
      user_name: currentUser.name,
      content: trimmedContent,
      message_type: messageType,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      is_edited: false
    };

    messages.push(newMessage);

    return NextResponse.json({
      message: newMessage,
      success: true
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json({ error: '发送消息失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = parseInt(searchParams.get('messageId') || '0');

    if (!messageId) {
      return NextResponse.json({ error: '消息ID无效' }, { status: 400 });
    }

    // 查找消息
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json({ error: '消息不存在' }, { status: 404 });
    }

    const message = messages[messageIndex];

    // 权限检查 - 管理员可以删除任何消息，用户只能删除自己的消息
    if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && message.user_id !== currentUser.id) {
      return NextResponse.json({ error: '没有权限删除此消息' }, { status: 403 });
    }

    // 删除消息
    messages.splice(messageIndex, 1);

    return NextResponse.json({
      success: true,
      message: '消息已删除'
    });
  } catch (error) {
    console.error('删除消息失败:', error);
    return NextResponse.json({ error: '删除消息失败' }, { status: 500 });
  }
} 