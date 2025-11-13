import { useEffect, useState } from 'react';
import { CSSProperties } from 'react';
import { fetchChannelMessages, sendMessage, GlobalStyles, ThemeUtils } from '../api/chatApi';
import { Message } from '../api/chatApi';
import { v4 as uuidv4 } from 'uuid';

// 格式化时间工具函数
const formatTime = () => {
    const now = new Date();
    return {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime()
    };
};

interface MessageViewProps {
    currentUser: string;
    channelName: string;
    onBack: () => void;
}

export const MessageView = ({ currentUser, channelName, onBack }: MessageViewProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isButtonActive, setIsButtonActive] = useState(false);
    
    // 1. 直接从 GlobalStyles 获取 layout（确保定义）
    const layout = GlobalStyles.layout;
    // 2. 获取当前主题
    const [theme, setTheme] = useState(ThemeUtils.getTheme() === 'light' ? GlobalStyles.light : GlobalStyles.dark);
    const currentWindowId = uuidv4();

    // 监听主题切换
    useEffect(() => {
        const handleThemeChange = () => {
            setTheme(ThemeUtils.getTheme() === 'light' ? GlobalStyles.light : GlobalStyles.dark);
        };
        window.addEventListener('storage', handleThemeChange);
        return () => window.removeEventListener('storage', handleThemeChange);
    }, []);

    // 加载消息
    const loadCurrentMessages = async () => {
        if (!channelName || !currentUser) return;
        const channelMessages = await fetchChannelMessages(currentUser, channelName);
        setMessages(channelMessages);
    };

    // 发送消息
    const handleSend = async () => {
        if (!newMessage.trim() || !channelName || !currentUser || loading) return;

        const { time, timestamp } = formatTime();
        const message: Message = {
            id: uuidv4(),
            sender: currentUser,
            receiver: channelName,
            text: newMessage.trim(),
            time,
            timestamp,
            windowId: currentWindowId
        };

        setLoading(true);
        try {
            await sendMessage(message);
            loadCurrentMessages();
            setNewMessage('');
        } catch (error) {
            console.error('发送消息失败:', error);
        } finally {
            setLoading(false);
            setIsButtonActive(false);
        }
    };

    // 初始化和监听消息变化
    useEffect(() => {
        loadCurrentMessages();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'allMessages') {
                loadCurrentMessages();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [channelName, currentUser]);

    return (
        <>
            {/* 背景层 */}
            <div style={backgroundStyle(theme, layout)}></div>

            {/* 主容器 */}
            <div style={mainContainerStyle(theme, layout)}>
                {/* 标题栏 */}
                <div style={headerStyle(theme, layout)}>
                    {/* 3. 关键修复：调用样式函数时必须传递 layout 参数 */}
                    <button 
                        style={backButtonStyle(theme, layout)}  
                        onClick={onBack}
                    >
                        ← 返回
                    </button>
                    <span style={headerTitleStyle(theme)}>与 {channelName} 聊天</span>
                </div>

                {/* 消息列表 */}
                <div style={messageListStyle(theme, layout)}>
                    {messages.length === 0 ? (
                        <p style={emptyStateStyle(theme, layout)}>暂无消息，开始聊天吧~</p>
                    ) : (
                        messages.map(msg => (
                            <div
                                key={msg.id}
                                style={msg.sender === currentUser 
                                    ? myMessageBubble(theme, layout) 
                                    : othersMessageBubble(theme, layout)
                                }
                            >
                                <span style={senderNameStyle(theme, msg.sender === currentUser)}>
                                    {msg.sender}
                                </span>
                                <p style={messageTextStyle(theme, msg.sender === currentUser)}>
                                    {msg.text}
                                </p>
                                <span style={messageTimeStyle(theme, msg.sender === currentUser)}>
                                    {msg.time}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* 输入区域 */}
                <div style={inputContainerStyle(theme, layout)}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入消息..."
                        disabled={loading}
                        style={isInputFocused 
                            ? inputFocusedStyle(theme, layout) 
                            : inputDefaultStyle(theme, layout)
                        }
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !newMessage.trim()}
                        style={
                            loading || !newMessage.trim()
                                ? sendButtonDisabledStyle(theme, layout)
                                : isButtonActive
                                    ? sendButtonPressedStyle(theme, layout)
                                    : sendButtonDefaultStyle(theme, layout)
                        }
                        onMouseDown={() => setIsButtonActive(true)}
                        onMouseUp={() => setIsButtonActive(false)}
                        onMouseLeave={() => setIsButtonActive(false)}
                    >
                        {loading ? '发送中...' : '发送'}
                    </button>
                </div>
            </div>
        </>
    );
};

// 所有样式函数必须接收 theme 和 layout 参数
const backgroundStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.hover} 100%)`,
    filter: 'blur(5px)',
    opacity: 0.9
});

const mainContainerStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    maxWidth: layout.maxWidth,
    height: '100vh',
    margin: '0 auto',
    backgroundColor: theme.cardBg,
    boxShadow: layout.boxShadow,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
});

const headerStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    height: layout.headerHeight,
    padding: `0 ${layout.paddingX}`,
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
});

// 修复 backButtonStyle 函数定义
const backButtonStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout  // 必须声明 layout 参数
): CSSProperties => ({
    position: 'absolute',
    left: layout.paddingX,  // 现在能正确访问 layout
    top: '50%',
    transform: 'translateY(-50%)',
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: layout.borderRadius,  // 现在能正确访问 layout
    color: theme.primary,
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
});

const headerTitleStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark
): CSSProperties => ({
    fontSize: '18px',
    fontWeight: 600,
    color: theme.textPrimary
});

const messageListStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    flex: 1,
    padding: `${layout.paddingY} ${layout.paddingX}`,
    overflowY: 'auto',
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: layout.messageGap
});

const emptyStateStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    color: theme.textSecondary,
    textAlign: 'center',
    padding: '40px 20px',
    margin: 'auto',
    backgroundColor: theme.hover,
    borderRadius: layout.borderRadius,
    width: '80%',
    fontSize: '15px'
});

const myMessageBubble = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    alignSelf: 'flex-end',
    maxWidth: '75%',
    padding: '12px 16px',
    backgroundColor: theme.sentMsg,
    borderRadius: `${layout.borderRadius} ${layout.borderRadius} 4px ${layout.borderRadius}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    margin: '4px 0'
});

const othersMessageBubble = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    alignSelf: 'flex-start',
    maxWidth: '75%',
    padding: '12px 16px',
    backgroundColor: theme.receivedMsg,
    border: `1px solid ${theme.border}`,
    borderRadius: `${layout.borderRadius} ${layout.borderRadius} ${layout.borderRadius} 4px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    margin: '4px 0'
});

const senderNameStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    isMine: boolean
): CSSProperties => ({
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '4px',
    display: 'block',
    color: isMine ? 'rgba(255,255,255,0.9)' : theme.textPrimary
});

const messageTextStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    isMine: boolean
): CSSProperties => ({
    margin: '0 0 6px 0',
    fontSize: '15px',
    lineHeight: 1.5,
    color: isMine ? 'white' : theme.textPrimary
});

const messageTimeStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    isMine: boolean
): CSSProperties => ({
    fontSize: '11px',
    textAlign: 'right',
    display: 'block',
    color: isMine ? 'rgba(255,255,255,0.7)' : theme.textSecondary
});

const inputContainerStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    display: 'flex',
    gap: '10px',
    padding: `${layout.paddingY} ${layout.paddingX}`,
    borderTop: `1px solid ${theme.border}`,
    backgroundColor: theme.background
});

const inputDefaultStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    flex: 1,
    padding: '12px 18px',
    border: `1px solid ${theme.border}`,
    borderRadius: layout.borderRadius,
    fontSize: '15px',
    outline: 'none',
    backgroundColor: theme.cardBg,
    color: theme.textPrimary,
    boxSizing: 'border-box'
});

const inputFocusedStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    ...inputDefaultStyle(theme, layout),
    borderColor: theme.primary,
    boxShadow: `0 0 0 3px rgba(${hexToRgb(theme.primary)}, 0.1)`
});

const sendButtonDefaultStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    padding: '12px 22px',
    backgroundColor: theme.button,
    color: 'white',
    border: 'none',
    borderRadius: layout.borderRadius,
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    minWidth: '80px'
});

const sendButtonPressedStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    ...sendButtonDefaultStyle(theme, layout),
    backgroundColor: theme.buttonHover,
    transform: 'translateY(1px)'
});

const sendButtonDisabledStyle = (
    theme: typeof GlobalStyles.light | typeof GlobalStyles.dark,
    layout: typeof GlobalStyles.layout
): CSSProperties => ({
    ...sendButtonDefaultStyle(theme, layout),
    backgroundColor: theme.buttonDisabled,
    cursor: 'not-allowed'
});

// 颜色转换工具
const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};