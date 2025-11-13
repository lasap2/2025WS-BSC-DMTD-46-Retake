export interface User {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  text: string;
  time: string;
  timestamp: number;
  windowId: string;
}

// 内置兜底用户
const DEFAULT_USERS: User[] = [
  { id: '1', name: 'MAN' },
  { id: '2', name: 'MANBA' },
  { id: '3', name: 'MANBAOUT' }
];

const API_BASE_URL = 'http://localhost:3001';

// 本地消息管理工具
const LocalMessageHelper = {
  getMessages: (): Message[] => {
    const cached = localStorage.getItem('allMessages');
    return cached ? JSON.parse(cached) : [];
  },

  saveMessages: (messages: Message[]) => {
    const uniqueMessages = Array.from(
      new Map(messages.map(msg => [msg.id, msg])).values()
    );
    uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem('allMessages', JSON.stringify(uniqueMessages));
  },

  addMessage: (newMsg: Message) => {
    const current = LocalMessageHelper.getMessages();
    if (!current.some(msg => msg.id === newMsg.id)) {
      current.push(newMsg);
      LocalMessageHelper.saveMessages(current);
    }
  }
};

// 获取用户列表
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    if (!response.ok) throw new Error('用户请求失败');
    const data = await response.json();
    return Array.isArray(data) ? data : DEFAULT_USERS;
  } catch (error) {
    console.warn('使用内置用户:', error);
    return DEFAULT_USERS;
  }
};

// 获取所有消息（本地+接口合并）
export const fetchAllMessages = async (currentUser: string): Promise<Message[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages?user=${currentUser}`);
    if (!response.ok) throw new Error('消息请求失败');
    const apiMessages = await response.json();

    const localMessages = LocalMessageHelper.getMessages();
    const mergedMessages = [...localMessages, ...(apiMessages || [])];
    LocalMessageHelper.saveMessages(mergedMessages);

    return mergedMessages;
  } catch (error) {
    console.warn('从本地获取消息:', error);
    return LocalMessageHelper.getMessages();
  }
};

// 获取指定频道消息
export const fetchChannelMessages = async (
  currentUser: string,
  channelName: string
): Promise<Message[]> => {
  try {
    const allMessages = LocalMessageHelper.getMessages();
    return allMessages.filter(msg =>
      (msg.sender === currentUser && msg.receiver === channelName) ||
      (msg.sender === channelName && msg.receiver === currentUser)
    );
  } catch (error) {
    console.error('获取频道消息失败:', error);
    return [];
  }
};

// 发送消息（本地优先）
export const sendMessage = async (message: Message): Promise<Message> => {
  LocalMessageHelper.addMessage(message);

  try {
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('发送失败');

    const savedMessage = await response.json();
    LocalMessageHelper.addMessage(savedMessage);
    return savedMessage;
  } catch (error) {
    console.warn('接口同步失败，依赖本地:', error);
    return message;
  }
};

// 全局样式配置（整合指定的布局和主题）
export const GlobalStyles = {
  // 布局常量（使用指定配置）
  layout: {
    maxWidth: '550px',
    headerHeight: '60px',
    inputAreaHeight: '70px',
    avatarSize: '52px',
    messageGap: '15px',
    paddingX: '20px',
    paddingY: '20px',
    borderRadius: '18px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
  },
  // 亮色主题
  light: {
    primary: '#2563eb',
    secondary: '#10b981',
    background: '#f8fafc',
    cardBg: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    hover: '#f1f5f9',
    sentMsg: '#2563eb',
    receivedMsg: '#f1f5f9',
    button: '#2563eb',
    buttonDisabled: '#bfdbfe',
    buttonHover: '#1d4ed8',
    logout: '#ef4444'
  },
  // 暗黑主题（补全完整定义）
  dark: {
    primary: '#3b82f6',
    secondary: '#34d399',
    background: '#0f172a',
    cardBg: '#1e293b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    hover: '#27364b',
    sentMsg: '#3b82f6',
    receivedMsg: '#27364b',
    button: '#3b82f6',
    buttonDisabled: '#1e3a8a',
    buttonHover: '#2563eb',
    logout: '#f87171'
  }
};

// 主题工具类
export const ThemeUtils = {
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem('chatTheme') as 'light' | 'dark') || 'light';
  },
  toggleTheme: () => {
    const newTheme = ThemeUtils.getTheme() === 'light' ? 'dark' : 'light';
    localStorage.setItem('chatTheme', newTheme);
    window.dispatchEvent(new Event('storage'));
  },
  getStyles: () => {
    const theme = ThemeUtils.getTheme();
    return {
      layout: GlobalStyles.layout,
      color: GlobalStyles[theme]
    };
  }
};
