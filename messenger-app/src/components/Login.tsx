import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { CSSProperties } from 'react';
import { fetchUsers, GlobalStyles, ThemeUtils } from '../api/chatApi'; // 导入主题配置

const Login = () => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [theme, setTheme] = useState(ThemeUtils.getStyles()); // 主题状态
    const navigate = useNavigate();

    // 监听主题切换
    useEffect(() => {
        const handleThemeChange = () => {
            setTheme(ThemeUtils.getStyles());
        };
        window.addEventListener('storage', handleThemeChange);
        return () => window.removeEventListener('storage', handleThemeChange);
    }, []);

    const handleLogin = async () => {
        if (!username.trim()) {
            alert('请输入用户名');
            return;
        }

        setLoading(true);
        try {
            // 核心登录逻辑不变（仅修改提示文字适配新用户名）
            const users = await fetchUsers();
            const isValidUser = users.some(user => user.name === username);

            if (!isValidUser) {
                alert('用户不存在，请输入正确的用户名（MAN/MANBA/MANBAOUT）');
                return;
            }

            const windowId = uuidv4();
            sessionStorage.setItem('windowId', windowId);
            sessionStorage.setItem('currentUser', username);

            setTimeout(() => {
                navigate('/channels');
                setLoading(false);
            }, 100);
        } catch (error) {
            alert('登录失败，请重试');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 解构主题和布局配置
    const { layout, color } = theme;

    return (
        <div style={loginContainer({ color })}>
            {/* 登录卡片（居中+阴影增强） */}
            <div style={loginBox({ layout, color })}>
                {/* Logo区域（优化样式） */}
                <div style={logoContainer}>
                    <div style={logoStyle({ color })}>MAN</div>
                    <h2 style={titleStyle({ color })}>MAN 聊天系统</h2>
                </div>

                {/* 输入框（主题适配+聚焦效果） */}
                <input
                    type="text"
                    placeholder="输入用户名（MAN/MANBA/MANBAOUT）"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputStyle({ color, isInputFocused })}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    disabled={loading}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                />

                {/* 登录按钮（主题适配+加载状态） */}
                <button
                    onClick={handleLogin}
                    style={buttonStyle({ color, loading })}
                    disabled={loading}
                >
                    {loading ? '登录中...' : '立即登录'}
                </button>

                {/* 主题切换按钮（新增） */}
                <button
                    style={themeToggleButtonStyle({ color })}
                    onClick={ThemeUtils.toggleTheme}
                    disabled={loading}
                >
                    {ThemeUtils.getTheme() === 'light' ? '切换暗黑模式' : '切换亮色模式'}
                </button>
            </div>
        </div>
    );
};

// 样式函数（基于主题动态生成）
const loginContainer = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center' as const,
        minHeight: '100vh',
        backgroundColor: color.background,
        padding: '20px',
        transition: 'background-color 0.3s ease'
    } as CSSProperties);

const loginBox = ({ layout, color }: { layout: typeof GlobalStyles.layout, color: typeof GlobalStyles.light }) => 
    ({
        width: '100%',
        maxWidth: '380px', // 加宽登录框
        padding: '40px 30px',
        backgroundColor: color.cardBg,
        borderRadius: layout.borderRadius,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)', // 增强阴影
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '25px',
        border: `1px solid ${color.border}`
    } as CSSProperties);

const logoContainer: CSSProperties = {
    alignItems: 'center',
    justifyContent: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
    marginBottom: '10px'
};

const logoStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center' as const,
        fontSize: '32px',
        fontWeight: 'bold',
        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.1)`
    } as CSSProperties);

const titleStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        margin: 0,
        color: color.textPrimary,
        fontSize: '24px',
        fontWeight: 600
    } as CSSProperties);

const inputStyle = ({ 
    color, 
    isInputFocused 
}: { 
    color: typeof GlobalStyles.light, 
    isInputFocused: boolean 
}) => 
    ({
        padding: '14px 20px',
        width: '100%',
        borderRadius: layout.borderRadius,
        border: `1px solid ${isInputFocused ? color.primary : color.border}`,
        backgroundColor: color.cardBg,
        color: color.textPrimary,
        fontSize: '16px',
        boxSizing: 'border-box' as const,
        height: '50px',
        outline: 'none',
        transition: 'border-color 0.3s ease'
    } as CSSProperties);

const buttonStyle = ({ 
    color, 
    loading 
}: { 
    color: typeof GlobalStyles.light, 
    loading: boolean 
}) => 
    ({
        padding: '14px 20px',
        backgroundColor: loading ? color.buttonDisabled : color.button,
        color: 'white',
        border: 'none',
        borderRadius: layout.borderRadius,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 600,
        width: '100%',
        height: '50px',
        boxSizing: 'border-box' as const,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`,
        transition: 'background-color 0.3s ease'
    } as CSSProperties);

const themeToggleButtonStyle = ({ color }: { color: typeof GlobalStyles.light }) => 
    ({
        padding: '10px 20px',
        backgroundColor: 'transparent',
        border: `1px solid ${color.border}`,
        borderRadius: layout.borderRadius,
        color: color.textPrimary,
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.3s ease',
        marginTop: '-10px'
    } as CSSProperties);

// 解构布局常量
const { layout } = GlobalStyles;

export default Login;
