import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState(''); // email or phone
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al iniciar sesión');
            }

            // Save token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('userId', result.user.id);

            // Check user status
            if (result.user.status === 'pending') {
                navigate('/pending-approval');
            } else if (result.user.status === 'approved' || result.user.status === 'active') {
                navigate('/dashboard');
            } else {
                throw new Error('Tu cuenta no está activa. Contacta al administrador.');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-8">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img src={raiteLogo} alt="RAITE" className="h-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Iniciar Sesión</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Bienvenido de vuelta</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Mail className="w-4 h-4" />
                            Email o Teléfono
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="tucorreo@ejemplo.com o 5512345678"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Lock className="w-4 h-4" />
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-600">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Iniciando sesión...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>

                {/* Register Link */}
                <div className="mt-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-orange-500 font-semibold hover:text-orange-600">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
