import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CSSProperties } from 'react';
import { fetchUsers, User, Message, fetchAllMessages, GlobalStyles, ThemeUtils } from '../api/chatApi';
import ClearDataButton from './ClearDataButton'; // 引入组件

const ChannelList = () => {
    const currentUser = sessionStorage.getItem('currentUser');
    const [users, setUsers] = useState<User[]>([]);
    const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
    const [hoveredUserId, setHoveredUserId] = useState<string | null>(null); // 替代inline hover样式
    const [theme, setTheme] = useState(ThemeUtils.getStyles()); // 主题状态
    const navigate = useNavigate();

    // 从API拉取并更新所有用户的最新消息
    const updateLatestMessages = async () => {
        if (!currentUser) return;

        try {
            const allMessages = await fetchAllMessages(currentUser);
            const userLatestMap: Record<string, string> = {};

            users.forEach(user => {
                if (user.name === currentUser) return;
                const userMessages = allMessages.filter(msg =>
                    (msg.sender === currentUser && msg.receiver === user.name) ||
                    (msg.sender === user.name && msg.receiver === currentUser)
                );
                if (userMessages.length > 0) {
                    const sorted = userMessages.sort((a, b) => a.timestamp - b.timestamp);
                    userLatestMap[user.name] = sorted[sorted.length - 1].text;
                }
            });

            setLatestMessages(userLatestMap);
        } catch (error) {
            console.error('更新最新消息失败:', error);
        }
    };

    // 清理数据后的回调：重新加载消息（显示空状态）
    const handleClearComplete = () => {
        updateLatestMessages();
    };

    // 监听主题切换（storage变化时更新）
    useEffect(() => {
        const handleThemeChange = () => {
            setTheme(ThemeUtils.getStyles());
        };
        window.addEventListener('storage', handleThemeChange);
        return () => window.removeEventListener('storage', handleThemeChange);
    }, []);

    // 初始化+实时同步逻辑
    useEffect(() => {
        // 加载用户列表
        const loadUsers = async () => {
            const data = await fetchUsers();
            setUsers(data);
        };
        loadUsers();

        // 初始加载最新消息
        updateLatestMessages();

        // 1. 定时拉取API（每5秒，确保实时性）
        const apiInterval = setInterval(updateLatestMessages, 5000);

        // 2. 监听localStorage变化（本地发送消息时立即同步）
        const handleStorageChange = () => {
            updateLatestMessages();
        };
        window.addEventListener('storage', handleStorageChange);

        // 清理资源
        return () => {
            clearInterval(apiInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [currentUser, users]);

    // 退出登录
    const handleLogout = () => {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('windowId');
        navigate('/');
    };

    // 切换主题
    const handleToggleTheme = () => {
        ThemeUtils.toggleTheme();
    };

    // 过滤可聊天用户
    const chatUsers = users.filter(user => user.name !== currentUser);

    // 解构主题和布局配置
    const { layout, color } = theme;

    return (
        <div style={containerStyle({ layout, color })}>
            {/* 头部（含标题、主题切换、退出按钮） */}
            <div style={headerStyle({ layout, color })}>
                <h2 style={headerTitleStyle({ color })}>消息列表</h2>
                <div style={headerActionStyle}>
                    <button 
                        onClick={handleToggleTheme}
                        style={themeToggleButtonStyle({ color })}
                    >
                        {ThemeUtils.getTheme() === 'light' ? '暗黑模式' : '亮色模式'}
                    </button>
                    <button 
                        onClick={handleLogout} 
                        style={logoutButtonStyle({ color })}
                    >
                        退出
                    </button>
                </div>
            </div>

            {/* 清空数据按钮（调整位置和样式） */}
            <div style={clearButtonContainerStyle({ layout })}>
                <ClearDataButton onClearComplete={handleClearComplete} />
            </div>

            {/* 频道列表（卡片式布局） */}
            <div style={channelListStyle}>
                {chatUsers.length === 0 ? (
                    <div style={emptyUserStyle({ color, layout })}>
                        暂无可聊天用户
                    </div>
                ) : (
                    chatUsers.map(user => (
                        <div
                            key={user.id}
                            style={channelItemStyle({ 
                                color, 
                                isHovered: hoveredUserId === user.id 
                            })}
                            onClick={() => navigate(`/channels/${user.name}`)}
                            onMouseEnter={() => setHoveredUserId(user.id)}
                            onMouseLeave={() => setHoveredUserId(null)}
                        >
                            <div style={avatarStyle({ layout, color })}>
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={infoStyle}>
                                <div style={nameStyle({ color })}>{user.name}</div>
                                <div style={messageStyle({ color })}>
                                    {latestMessages[user.name] || '点击开始聊天'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// 样式函数（基于主题动态生成）
const containerStyle = ({ layout, color }: { layout: typeof GlobalStyles.layout, color: typeof GlobalStyles.light }) => 
    ({
        padding: '0',
        maxWidth: layout.maxWidth,
        margin: '0 auto',
        height: '100vh',
        boxSizing: 'border-box' as const,
        boxShadow: layout.boxShadow,
        backgroundColor: color.background,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'background-color 0.3s ease'
    } as CSSProperties);

const headerStyle = ({ layout, color }: { layout: typeof GlobalStyles.layout, color: typeof GlobalStyles.light }) => 
    ({
        display: 'flex',
        justifyContent: 'space-between' as const,
        alignItems: 'center',
        padding: `0 ${layout.paddingX}`,
        height: layout.headerHeight,
        borderBottom: `1px solid ${color.border}`,
        backgroundColor: color.cardBg,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    } as CSSProperties);

const headerTitleStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        margin: 0,
        color: color.textPrimary,
        fontSize: '18px',
        fontWeight: 600
    } as CSSProperties);

const headerActionStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
};

const themeToggleButtonStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        padding: '6px 12px',
        backgroundColor: color.cardBg,
        border: `1px solid ${color.border}`,
        borderRadius: '8px',
        color: color.textPrimary,
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'background-color 0.2s'
    } as CSSProperties);

const logoutButtonStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        padding: '6px 12px',
        backgroundColor: color.logout,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'background-color 0.2s'
    } as CSSProperties);

const clearButtonContainerStyle = ({ layout }: { layout: typeof GlobalStyles.layout }) => 
    ({
        padding: `${layout.paddingY} ${layout.paddingX}`,
        backgroundColor: 'transparent'
    } as CSSProperties);

const channelListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    overflowY: 'auto' as const,
    paddingBottom: '10px'
};

const channelItemStyle = ({ 
    color, 
    isHovered 
}: { 
    color: typeof GlobalStyles.light, 
    isHovered: boolean 
}) => 
    ({
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: `${layout.paddingY} ${layout.paddingX}`,
        borderRadius: '12px',
        margin: '0 12px 8px',
        backgroundColor: isHovered ? color.hover : color.cardBg,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'background-color 0.2s'
    } as CSSProperties);

const avatarStyle = ({ layout, color }: { layout: typeof GlobalStyles.layout, color: typeof GlobalStyles.light }) => 
    ({
        width: layout.avatarSize,
        height: layout.avatarSize,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center' as const,
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
    } as CSSProperties);

const infoStyle: CSSProperties = { 
    flex: 1, 
    overflow: 'hidden' 
};

const nameStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        fontWeight: 600,
        marginBottom: '4px',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        color: color.textPrimary,
        fontSize: '16px'
    } as CSSProperties);

const messageStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        color: color.textSecondary,
        fontSize: '14px',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const
    } as CSSProperties);

const emptyUserStyle = ({ color, layout }: { color: typeof GlobalStyles.light, layout: typeof GlobalStyles.layout }) => 
    ({
        color: color.textSecondary,
        textAlign: 'center' as const,
        padding: `${layout.paddingY} ${layout.paddingX}`,
        marginTop: '20px',
        fontSize: '14px'
    } as CSSProperties);

// 解构布局常量（供样式函数使用）
const { layout } = GlobalStyles;

export default ChannelList;
