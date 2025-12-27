import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, CheckCircle2, Mail, Phone } from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

const PendingApproval = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex flex-col">
            <header className="bg-white dark:bg-slate-900 shadow-sm p-4">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <img src={raiteLogo} alt="RAITE" className="h-8" />
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    {/* Status Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
                            Solicitud en Revisión
                        </h1>

                        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            ¡Hola {user.full_name?.split(' ')[0] || 'Socio'}! Tu solicitud de registro está siendo revisada por nuestro equipo administrativo.
                        </p>

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-full mb-8">
                            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                                Estado: Pendiente de Aprobación
                            </span>
                        </div>

                        {/* Timeline */}
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 mb-8 text-left">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Proceso de Aprobación</h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Registro Completado</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tus datos han sido recibidos</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                                        <Clock className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">Revisión en Proceso</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Verificando documentos e información</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gray-300 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-gray-500 dark:text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-500 dark:text-gray-600">Activación de Cuenta</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-600">Pendiente de aprobación</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-left">
                            <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Te Notificaremos
                            </h3>
                            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                                <p className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email: {user.email}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Teléfono: {user.phone}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-500 mt-3">
                                    ⏱️ Tiempo estimado de revisión: 24-48 horas hábiles
                                </p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleLogout}
                            className="mt-8 px-8 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
