import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Handshake, Car, DollarSign, Vote, Shield, ChevronRight, Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, X, Wrench, CircleDollarSign, Truck, Building, Stethoscope, LogOut, User, CheckCircle, LayoutDashboard } from 'lucide-react';
import choferesDuenosImg from '../assets/choferes-duenos.png';
import raiteLogo from '../assets/raite-logo.png';

const Welcome = () => {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

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

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setUserData(null);
    };

    // Get user profile image URL
    const getUserProfileImage = () => {
        const imageUrl = userData?.profile_image || userData?.selfie_image;
        if (imageUrl) {
            if (imageUrl.startsWith('/')) {
                return `http://localhost:3000${imageUrl}`;
            }
            return imageUrl;
        }
        return null;
    };

    const servicesData = [
        { icon: '🛞', label: 'Llantera', color: 'orange', desc: 'Neumáticos de calidad con montaje y balanceo GRATIS para socios.' },
        { icon: '🔧', label: 'Taller', color: 'blue', desc: 'Servicio mecánico integral con 30% de descuento en mano de obra.' },
        { icon: '🔩', label: 'Refacciones', color: 'red', desc: 'Autopartes a precios de flotilla (costo + 5%).' },
        { icon: '🏗️', label: 'Grúas', color: 'yellow', desc: 'Remolque y asistencia vial 24/7. 2 servicios gratis al año.' },
        { icon: '💰', label: 'Préstamos', color: 'green', desc: 'Liquidez inmediata para emergencias. Aprobación en 24 horas.' },
        { icon: '🚑', label: 'Seguro', color: 'teal', desc: 'Protección total para ti, tu unidad y pasaje. Deducible $0.' },
        { icon: '🔌', label: 'Financiamiento EV', color: 'purple', desc: 'Créditos para transición a vehículos eléctricos. Tasa 4% anual.' },
        { icon: '🏡', label: 'Hipotecario', color: 'indigo', desc: 'El camino a tu patrimonio familiar. Enganche financiado.' }
    ];

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Floating particles
    const particles = Array(8).fill(null).map((_, i) => ({
        id: i,
        size: Math.random() * 6 + 4,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        duration: Math.random() * 3 + 4,
    }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
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

    const handleGoogleLogin = () => {
        // Implement Google OAuth
        console.log('Google login clicked');
        // For now, navigate to dashboard
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors duration-500">
            {/* Header - Minimalist */}
            <header className={`py-4 px-6 fixed top-0 w-full z-50 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                {/* Header content removed to avoid duplication with Navbar */}
            </header>

            {/* Main Hero Section */}
            <main className="flex-1 relative">
                {/* Compact Animated Gradient Background Card */}
                <div className={`mx-4 mt-4 rounded-2xl overflow-hidden relative transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="bg-hero-gradient p-4 pb-6 relative flex flex-col items-center justify-center">

                        {/* Content Section - Compact */}
                        <div className="max-w-4xl mx-auto px-2 py-4 flex flex-col items-center">
                            {/* Compact Hero Logo & Branding */}
                            <div className={`text-center mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <img
                                    src={raiteLogo}
                                    alt="RAITE"
                                    className="h-14 w-auto mx-auto mb-3 object-contain animate-logo-10s rounded-lg"
                                />
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                                    Los Choferes Son <span className="text-orange-400" style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>Dueños</span>
                                </h2>
                                <p className="text-white/90 text-sm md:text-base max-w-md mx-auto">
                                    Primera cooperativa digital de transporte donde tú tomas el control.
                                </p>
                            </div>

                            {/* Compact Orbit with Services Animation */}
                            <div className={`relative w-64 h-64 md:w-72 md:h-72 mb-4 transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                                {/* Central Character - BEHIND icons with pointer-events-none */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <div className="relative w-32 h-32 md:w-36 md:h-36 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-full flex items-center justify-center shadow-xl">
                                        <img
                                            src={choferesDuenosImg}
                                            alt="Choferes Dueños"
                                            className="w-28 h-28 md:w-32 md:h-32 object-contain animate-float"
                                        />
                                    </div>
                                </div>

                                {/* Outer Orbit Ring */}
                                <div className="absolute inset-0 border-2 border-dashed border-orange-500/20 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '30s' }} />

                                {/* Rotating Container for Icons */}
                                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s' }}>
                                    {/* Orbiting Services */}
                                    {servicesData.slice(0, 8).map((service, idx) => {
                                        const angle = (idx * 45) * (Math.PI / 180);
                                        const radius = 115;
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center text-2xl md:text-3xl cursor-pointer hover:scale-125 hover:z-20 transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-orange-400 z-10"
                                                style={{
                                                    left: `calc(50% + ${Math.cos(angle) * radius}px - 20px)`,
                                                    top: `calc(50% + ${Math.sin(angle) * radius}px - 20px)`,
                                                    animation: 'counterRotate 25s linear infinite',
                                                }}
                                                onClick={() => setSelectedService(service)}
                                                title={service.label}
                                            >
                                                {service.icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Service Popup Modal */}
                            {selectedService && (
                                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedService(null)}>
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-xs shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setSelectedService(null)}
                                            className="absolute top-3 right-3 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition"
                                        >
                                            <X size={16} />
                                        </button>
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-5xl mb-3">{selectedService.icon}</span>
                                            <h3 className={`text-lg font-black text-${selectedService.color}-500 mb-1`}>{selectedService.label}</h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{selectedService.desc}</p>
                                            <button
                                                onClick={() => { setSelectedService(null); navigate('/services'); }}
                                                className={`mt-4 w-full py-2.5 rounded-lg font-bold text-white text-sm bg-${selectedService.color}-500 hover:bg-${selectedService.color}-600 transition active:scale-95`}
                                            >
                                                Ver Más
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Compact Savings Emphasis + CTA */}
                            <div className={`w-full text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <p className="text-lg md:text-xl font-black text-gray-800 dark:text-white leading-tight">
                                    Ahorra hasta <span className="text-2xl md:text-3xl bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">90%</span> de las comisiones
                                    <br />
                                    que hoy pagas a Uber y Didi
                                </p>
                                {!userData ? (
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-base px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Regístrate Ahora
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-base px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
                                    >
                                        <LayoutDashboard className="w-5 h-5" />
                                        Ir al Dashboard
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revolutionary Quotes Banner - Marquee */}
                <div className="mt-2 overflow-hidden bg-gradient-to-r from-rose-900 to-red-900 py-3 marquee-container">
                    <div className="flex">
                        <div className="animate-marquee whitespace-nowrap flex">
                            <span className="mx-8 text-white font-semibold text-sm">
                                🔥 El volante es de quien lo trabaja. Ni plataformas abusivas, ni gobiernos ausentes: los conductores unidos toman lo que es suyo.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                ⚔️ Como ayer fue la tierra para el campesino, hoy es el trabajo para el conductor. Organizados, conscientes y libres.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                🚩 Sufragio efectivo fue justicia política. Cooperativa efectiva es justicia laboral.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                🛞 Trabajas tú. Riesgas tú. Manejas tú. Entonces, ¿por qué no decides tú?
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                ✊ El trabajo no se renta. Se defiende. Se organiza. Se comparte.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                🧠 Cuando el trabajo deja de ser propio, la organización se vuelve revolución.
                            </span>
                        </div>
                        {/* Duplicate for seamless loop */}
                        <div className="animate-marquee whitespace-nowrap flex" aria-hidden="true">
                            <span className="mx-8 text-white font-semibold text-sm">
                                🔥 El volante es de quien lo trabaja. Ni plataformas abusivas, ni gobiernos ausentes: los conductores unidos toman lo que es suyo.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                ⚔️ Como ayer fue la tierra para el campesino, hoy es el trabajo para el conductor. Organizados, conscientes y libres.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                🚩 Sufragio efectivo fue justicia política. Cooperativa efectiva es justicia laboral.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                🛞 Trabajas tú. Riesgas tú. Manejas tú. Entonces, ¿por qué no decides tú?
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                ✊ El trabajo no se renta. Se defiende. Se organiza. Se comparte.
                            </span>
                            <span className="mx-8 text-white font-semibold text-sm">
                                🧠 Cuando el trabajo deja de ser propio, la organización se vuelve revolución.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compact About Section */}
                <div className={`mx-4 mt-4 mb-6 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Handshake className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                <span className="font-bold text-gray-800 dark:text-white">Acerca de RAITE:</span> Cooperativa digital donde cada chofer tiene voz, voto y comparte los beneficios.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs font-medium text-orange-500">#CooperativismoDigital</span>
                                <span className="text-xs font-medium text-purple-500">#RAITE</span>
                                <span className="text-xs font-medium text-blue-500">#ConductoresDueños</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Welcome;
