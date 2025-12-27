import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, Home, LayoutDashboard, UserPlus, LogOut, User, Mail, Lock, Eye, EyeOff, Bell } from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';
import { API } from '../config/api';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLoginDropdown, setShowLoginDropdown] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check if user is logged in
    const [userData, setUserData] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                return JSON.parse(storedUser);
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
        return null;
    });

    // Notifications state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);

    // Fetch user notifications (commitments)
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!userData?.id) return;
            try {
                const response = await fetch(`${API.BASE_URL}/api/commitments/user/${userData.id}`);
                if (response.ok) {
                    const data = await response.json();
                    // Get read notifications from localStorage
                    const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');

                    // Convert commitments to notifications
                    const notifs = data.filter(c => c.status === 'pending' || c.status === 'overdue').map(c => ({
                        id: c.id,
                        type: 'payment',
                        title: c.concept,
                        message: `Tienes un pago pendiente de $${c.amount}`,
                        reference: c.referenceNumber,
                        amount: c.amount,
                        dueDate: c.dueDate,
                        read: readIds.includes(c.id)
                    }));
                    setNotifications(notifs);
                    setHasUnread(notifs.some(n => !n.read));
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [userData?.id]);

    // Mark all as read when opening dropdown
    const handleOpenNotifications = () => {
        if (!showNotifications) {
            // Mark all as read in localStorage
            const allIds = notifications.map(n => n.id);
            localStorage.setItem('readNotifications', JSON.stringify(allIds));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setHasUnread(false);
        }
        setShowNotifications(!showNotifications);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUserData(null);
        setIsMenuOpen(false);
        navigate('/');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            const response = await fetch(API.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: loginData.email,
                    password: loginData.password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || 'Error al iniciar sesión');
                setIsLoggingIn(false);
                return;
            }

            // Save token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('userId', result.user.id);

            // Update local state
            setUserData(result.user);
            setShowLoginDropdown(false);
            setLoginData({ email: '', password: '' });

            // Navigate based on status
            if (result.user.status === 'pending') {
                navigate('/pending-approval');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Login error:', err);
            alert('Error de conexión. Intenta de nuevo.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Different nav links based on auth state (progressive)
    // New user (not logged in): Only Registro
    // Registered/Pending: Dashboard only
    // Active: Dashboard + full access
    const getNavLinks = () => {
        if (!userData) {
            // Not logged in - show only Registro
            return [
                { name: 'Registro', path: '/register', icon: UserPlus },
            ];
        } else if (userData.status === 'pending') {
            // Registered but pending approval
            return [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            ];
        } else {
            // Active user - full access
            return [
                { name: 'Inicio', path: '/', icon: Home },
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
            ];
        }
    };

    const navLinks = getNavLinks();

    const isActive = (path) => location.pathname === path;

    // Get user initials
    const getUserInitials = () => {
        if (userData?.full_name) {
            const names = userData.full_name.split(' ');
            if (names.length >= 2) {
                return names[0][0] + names[1][0];
            }
            return names[0][0];
        }
        return 'U';
    };

    // Get user profile image URL
    const getUserProfileImage = () => {
        const imageUrl = userData?.profile_image || userData?.selfie_image;
        if (imageUrl) {
            if (imageUrl.startsWith('/')) {
                return `${API.BASE_URL}${imageUrl}`;
            }
            return imageUrl;
        }
        return null;
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center group">
                            <img
                                src={raiteLogo}
                                alt="RAITE Logo"
                                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300 animate-logo-10s rounded-md"
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-2 font-semibold transition-all duration-200 px-3 py-2 rounded-xl ${isActive(link.path)
                                    ? 'text-orange-500 bg-orange-500/10'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-orange-500 hover:bg-orange-500/10 dark:hover:text-orange-400 dark:hover:bg-orange-500/20'
                                    }`}
                            >
                                <link.icon size={18} />
                                {link.name}
                            </Link>
                        ))}

                        {/* User Section - Only when logged in */}
                        {userData && (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-slate-700">
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={handleOpenNotifications}
                                        className={`relative p-2 rounded-lg transition-all ${hasUnread
                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-500 animate-pulse'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-500'
                                            }`}
                                    >
                                        <Bell size={20} />
                                        {notifications.length > 0 && (
                                            <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-bold ${hasUnread ? 'bg-red-500 animate-bounce' : 'bg-gray-400'}`}>
                                                {notifications.length}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 p-4 z-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-bold text-gray-800 dark:text-white">🔔 Notificaciones</h3>
                                                <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {notifications.length > 0 ? (
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {notifications.map(n => (
                                                        <Link
                                                            key={n.id}
                                                            to="/dashboard"
                                                            onClick={() => setShowNotifications(false)}
                                                            className="block p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{n.title}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
                                                                    <p className="text-xs text-orange-500 font-mono mt-1">Ref: {n.reference}</p>
                                                                </div>
                                                                <span className="font-bold text-orange-600">${n.amount}</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                    <Bell className="mx-auto mb-2 opacity-50" size={24} />
                                                    <p className="text-sm">Sin notificaciones</p>
                                                </div>
                                            )}

                                            {notifications.length > 0 && (
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setShowNotifications(false)}
                                                    className="block mt-3 text-center text-sm text-orange-500 font-semibold hover:underline"
                                                >
                                                    Ver todas en Dashboard →
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {getUserProfileImage() ? (
                                        <img
                                            src={getUserProfileImage()}
                                            alt="Perfil"
                                            className="w-8 h-8 rounded-full object-cover border-2 border-orange-500"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {getUserInitials()}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block">
                                        {userData.full_name?.split(' ')[0] || 'Usuario'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        )}

                        {/* Login Section - Only when not logged in */}
                        {!userData && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                                >
                                    <User size={18} />
                                    <span>Iniciar Sesión</span>
                                </button>

                                {/* Login Dropdown */}
                                {showLoginDropdown && (
                                    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 p-4 z-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 dark:text-white">Iniciar Sesión</h3>
                                            <button
                                                onClick={() => setShowLoginDropdown(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleLogin} className="space-y-3">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Email o Teléfono"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-orange-500 dark:text-white"
                                                    required
                                                />
                                            </div>

                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Contraseña"
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-orange-500 dark:text-white"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoggingIn}
                                                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                                            >
                                                {isLoggingIn ? 'Ingresando...' : 'Entrar'}
                                            </button>
                                        </form>

                                        <div className="mt-3 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                ¿No tienes cuenta? <Link to="/register" className="text-orange-500 font-semibold" onClick={() => setShowLoginDropdown(false)}>Regístrate</Link>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:text-orange-500 transition-all duration-300"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 dark:text-gray-300"
                        >
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 border-b dark:border-slate-800' : 'max-h-0'}`}>
                <div className="px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-slate-950 shadow-xl">
                    {/* User Info - Only when logged in */}
                    {userData && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl mb-2">
                            {getUserProfileImage() ? (
                                <img
                                    src={getUserProfileImage()}
                                    alt="Perfil"
                                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-500"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {getUserInitials()}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-bold text-gray-800 dark:text-white text-sm">{userData.full_name || 'Usuario'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userData.member_id || 'Socio'}</p>
                            </div>
                        </div>
                    )}

                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive(link.path)
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <link.icon size={20} />
                            {link.name}
                        </Link>
                    ))}

                    {/* Logout Button - Only when logged in */}
                    {userData && (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full"
                        >
                            <LogOut size={20} />
                            Cerrar Sesión
                        </button>
                    )}

                    {/* Mobile Login Form - Only when NOT logged in */}
                    {!userData && (
                        <div className="mt-2 p-4 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-center">Iniciar Sesión</h3>
                            <form onSubmit={handleLogin} className="space-y-3">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Email o Teléfono"
                                        value={loginData.email}
                                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-orange-500 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Contraseña"
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-orange-500 dark:text-white"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoggingIn}
                                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                                >
                                    {isLoggingIn ? 'Ingresando...' : 'Entrar'}
                                </button>
                            </form>
                            <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                ¿No tienes cuenta? <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-orange-500 font-bold">Regístrate</Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </nav >
    );
};

export default Navbar;

