// Community.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Upload, Trash2, FolderPlus, Camera } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const Community = () => (
    <div className="p-4 pt-10">
        <h1 className="text-2xl font-bold text-coop-blue mb-4">Comunidad</h1>
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <h3 className="font-bold">Noticias Recientes</h3>
                <p className="text-sm text-gray-600 mt-2">Reunión general el próximo viernes a las 5 PM.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <h3 className="font-bold">Foro de Choferes</h3>
                <p className="text-sm text-gray-600 mt-2">Comparte tips de seguridad y rutas.</p>
            </div>
        </div>
    </div>
);

// Services.jsx
export const Services = () => {
    const [selectedService, setSelectedService] = useState(null);
    const [showInvestmentModal, setShowInvestmentModal] = useState(false);

    const servicesData = [
        {
            icon: "🛞",
            title: "Llantera",
            desc: "Neumáticos de alta calidad con descuentos exclusivos.",
            benefit: "Montaje y balanceo GRATIS para socios.",
            color: "text-orange-500",
            bgHover: "hover:bg-orange-50",
            border: "hover:border-orange-200"
        },
        {
            icon: "🔧",
            title: "Taller General",
            desc: "Servicio mecánico integral preventivo y correctivo.",
            benefit: "30% de descuento en mano de obra.",
            color: "text-blue-600",
            bgHover: "hover:bg-blue-50",
            border: "hover:border-blue-200"
        },
        {
            icon: "🔌",
            title: "Financiamiento EV",
            desc: "Créditos para transición a vehículos eléctricos.",
            benefit: "Tasa preferencial del 4% anual.",
            color: "text-green-500",
            bgHover: "hover:bg-green-50",
            border: "hover:border-green-200"
        },
        {
            icon: "🏗️",
            title: "Grúas",
            desc: "Remolque y asistencia vial 24/7.",
            benefit: "2 servicios gratuitos al año.",
            color: "text-yellow-600",
            bgHover: "hover:bg-yellow-50",
            border: "hover:border-yellow-200"
        },
        {
            icon: "🔩",
            title: "Refaccionaria",
            desc: "Todas las partes que necesitas para tu unidad.",
            benefit: "Precios de flotilla (costo + 5%).",
            color: "text-red-500",
            bgHover: "hover:bg-red-50",
            border: "hover:border-red-200"
        },
        {
            icon: "💰",
            title: "Préstamos Personales",
            desc: "Liquidez inmediata para emergencias o proyectos.",
            benefit: "Aprobación en 24 horas sin buró.",
            color: "text-purple-500",
            bgHover: "hover:bg-purple-50",
            border: "hover:border-purple-200"
        },
        {
            icon: "🏡",
            title: "Préstamos Hipotecarios",
            desc: "El camino a tu patrimonio familiar.",
            benefit: "Enganche financiado por la cooperativa.",
            color: "text-indigo-600",
            bgHover: "hover:bg-indigo-50",
            border: "hover:border-indigo-200"
        },
        {
            icon: "🚑",
            title: "Seguro",
            desc: "Protección total para ti, tu unidad y pasaje.",
            benefit: "Deducible $0 en primer siniestro.",
            color: "text-teal-600",
            bgHover: "hover:bg-teal-50",
            border: "hover:border-teal-200"
        }
    ];

    return (
        <div className="p-4 pt-10 pb-24">
            <h1 className="text-2xl font-bold text-coop-blue mb-6">Servicios Cooperativos</h1>

            {/* Investment CTA Card */}
            <div
                onClick={() => setShowInvestmentModal(true)}
                className="mb-6 bg-gradient-to-r from-orange-500 to-pink-500 p-[2px] rounded-3xl active:scale-[0.98] transition-transform cursor-pointer shadow-lg shadow-orange-500/20"
            >
                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center text-3xl">
                            🚀
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 dark:text-white leading-tight">¿Cómo Invertir y Ganar?</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Descubre los beneficios de ser socio</p>
                        </div>
                    </div>
                    <div className="bg-orange-500 text-white p-2 rounded-full">
                        <Check size={16} strokeWidth={4} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {servicesData.map((service, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedService(service)}
                        className={`bg-white p-5 rounded-2xl shadow-sm border border-transparent transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-2 group ${service.bgHover} ${service.border}`}
                    >
                        <span className={`text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                            {service.icon}
                        </span>
                        <h3 className={`font-bold text-sm text-gray-700 group-hover:text-gray-900`}>{service.title}</h3>
                    </div>
                ))}
            </div>

            {/* Service Detail Modal */}
            {selectedService && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedService(null)}>
                    <div
                        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 left-0 w-full h-24 opacity-10 ${selectedService.color.replace('text-', 'bg-')}`}></div>

                        <button
                            onClick={() => setSelectedService(null)}
                            className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 flex flex-col items-center text-center mt-4">
                            <div className="bg-gray-50 p-6 rounded-full text-6xl shadow-inner mb-4">
                                {selectedService.icon}
                            </div>

                            <h2 className={`text-2xl font-bold mb-2 ${selectedService.color}`}>
                                {selectedService.title}
                            </h2>

                            <div className="space-y-4 w-full text-left mt-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Descripción</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {selectedService.desc}
                                    </p>
                                </div>

                                <div className={`p-4 rounded-xl border border-opacity-20 bg-opacity-5 ${selectedService.color.replace('text-', 'bg-')} ${selectedService.color.replace('text-', 'border-')}`}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedService.color}`}>Beneficio Socio</h4>
                                    <p className={`text-sm font-medium ${selectedService.color.replace('text-', 'text-opacity-80-')} text-gray-800`}>
                                        {selectedService.benefit}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedService(null)}
                            className={`w-full mt-6 py-3 rounded-xl font-bold text-white transition transform active:scale-95 ${selectedService.color.replace('text-', 'bg-')}`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            <InvestmentModal
                isOpen={showInvestmentModal}
                onClose={() => setShowInvestmentModal(false)}
            />
        </div>
    );
};

// Internal Components for Services
const InvestmentModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const benefits = [
        {
            icon: "📈",
            title: "Reparto de Utilidades",
            desc: "El 70% de las ganancias netas de todos los servicios (Refaccionaria, Llantera, Grúas, etc.) se distribuye mensualmente entre los socios activos."
        },
        {
            icon: "💎",
            title: "Valorización del Token",
            desc: "Tu participación técnica (Token RAITE) aumenta su valor conforme la cooperativa crece en unidades y servicios ofrecidos."
        },
        {
            icon: "⚖️",
            title: "Equidad Cooperativa",
            desc: "Cada socio tiene voz y voto. Tú eres codueño de la infraestructura y decides el rumbo de las inversiones."
        },
        {
            icon: "🏷️",
            title: "Tarifas de Flotilla",
            desc: "Ahorra hasta un 40% en mantenimiento y seguro. El dinero que no gastas es ganancia directa para tu operación."
        }
    ];

    return (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[2.5rem] w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-6">
                        <h2 className="text-white text-2xl font-black mb-1">Invertir & Ganar</h2>
                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Modelo Cooperativo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                            "En Raite, cada vez que un socio consume un servicio, la ganancia regresa a la comunidad."
                        </p>
                    </div>

                    <div className="space-y-4">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className="text-2xl shrink-0 mt-1">{b.icon}</div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm leading-tight mb-1">{b.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {b.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 pt-2 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/30 active:scale-[0.97] transition-all"
                    >
                        ¡Entendido!
                    </button>
                </div>
            </div>
        </div>
    );
};

// Governance.jsx
export const Governance = () => {
    const [showVoteModal, setShowVoteModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Admin / File State
    const [showAdmin, setShowAdmin] = useState(false);
    const [documents, setDocuments] = useState([]);

    const handleVote = () => {
        setSubmitted(true);
        setTimeout(() => {
            setShowVoteModal(false);
            setSubmitted(false);
            setSelectedOption(null);
            setNote('');
            alert("¡Voto registrado correctamente!");
        }, 8000); // 8 seconds for fireworks to play
    };

    const handleDeleteDoc = (id) => {
        if (confirm('¿Eliminar documento?')) {
            setDocuments(prev => prev.filter(d => d.id !== id));
        }
    };

    return (
        <div className="p-4 pt-10">
            <h1 className="text-2xl font-bold text-coop-blue mb-4">Gobernanza</h1>

            {/* Active Variation Card */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-green-800">Próxima Votación</h3>
                        <p className="text-sm text-green-700 mt-1">Aprobación del presupuesto 2024</p>
                    </div>
                    <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Activa</span>
                </div>
                <p className="text-xs text-green-600 mt-3 mb-2">Cierre: 25 Dic 2024</p>
                <button
                    onClick={() => setShowVoteModal(true)}
                    className="mt-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full hover:bg-green-700 transition"
                >
                    Participar
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-800">Documentación Oficial</h3>
                </div>

                <div className="space-y-3">
                    {/* Estatutos Sociales PDF */}
                    <a
                        href="/docs/📜 ESTATUTOS SOCIALES.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-red-50 transition cursor-pointer group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-red-50 p-2 rounded-lg text-red-500 group-hover:bg-red-100">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">📜 Estatutos Sociales</p>
                                <p className="text-[10px] text-gray-400">Documento fundacional de la cooperativa</p>
                            </div>
                        </div>
                        <div className="text-xs text-coop-blue font-bold group-hover:text-red-500">Ver PDF →</div>
                    </a>

                    {/* Gobernanza de Cooperativa PDF */}
                    <a
                        href="/docs/gobernanza de cooperativa.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-blue-50 transition cursor-pointer group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-500 group-hover:bg-blue-100">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">📋 Gobernanza de Cooperativa</p>
                                <p className="text-[10px] text-gray-400">Estructura y reglas de gobierno</p>
                            </div>
                        </div>
                        <div className="text-xs text-coop-blue font-bold group-hover:text-blue-600">Ver PDF →</div>
                    </a>
                </div>
            </div>

            {/* Voting Modal */}
            {showVoteModal && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Emitir Voto</h3>
                                <p className="text-xs text-gray-500">Presupuesto General 2024</p>
                            </div>
                            <button onClick={() => setShowVoteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                            {!submitted ? (
                                <>
                                    <p className="text-sm text-gray-600 mb-4 font-medium">Selecciona tu posición:</p>

                                    <div className="space-y-3 mb-6">
                                        <button
                                            onClick={() => setSelectedOption('favor')}
                                            className={`w-full p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${selectedOption === 'favor' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedOption === 'favor' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                                                {selectedOption === 'favor' && <Check size={14} />}
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-bold text-gray-800">A Favor</span>
                                                <span className="text-xs text-gray-500">Apruebo el presupuesto propuesto.</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setSelectedOption('contra')}
                                            className={`w-full p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${selectedOption === 'contra' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-red-200'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedOption === 'contra' ? 'border-red-500 bg-red-500 text-white' : 'border-gray-300'}`}>
                                                {selectedOption === 'contra' && <Check size={14} />}
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-bold text-gray-800">En Contra</span>
                                                <span className="text-xs text-gray-500">Rechazo la propuesta actual.</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setSelectedOption('abstencion')}
                                            className={`w-full p-4 rounded-xl border-2 flex items-center space-x-4 transition-all ${selectedOption === 'abstencion' ? 'border-gray-500 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedOption === 'abstencion' ? 'border-gray-500 bg-gray-500 text-white' : 'border-gray-300'}`}>
                                                {selectedOption === 'abstencion' && <Check size={14} />}
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-bold text-gray-800">Abstención</span>
                                                <span className="text-xs text-gray-500">No tomo partido en esta decisión.</span>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nota Explicativa (Opcional)</label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-coop-blue outline-none resize-none"
                                            rows="3"
                                            placeholder="Añade un comentario para el acta..."
                                        ></textarea>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Pure Fireworks Overlay */}
                                    <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden bg-black/30">
                                        {/* Firework rockets */}
                                        {[...Array(8)].map((_, rocketIdx) => (
                                            <div
                                                key={`rocket-${rocketIdx}`}
                                                className="absolute"
                                                style={{
                                                    left: `${10 + rocketIdx * 12}%`,
                                                    bottom: '0',
                                                }}
                                            >
                                                {/* Trail */}
                                                <div
                                                    className="w-1 bg-gradient-to-t from-orange-400 to-transparent animate-rocket-trail"
                                                    style={{
                                                        animationDelay: `${rocketIdx * 0.4}s`,
                                                        height: '100px',
                                                    }}
                                                />
                                                {/* Explosion particles */}
                                                {[...Array(12)].map((_, i) => {
                                                    const angle = (i * 30) * (Math.PI / 180);
                                                    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#fcbad3', '#a8d8ea'];
                                                    return (
                                                        <div
                                                            key={i}
                                                            className="absolute w-2 h-2 rounded-full animate-explode"
                                                            style={{
                                                                backgroundColor: colors[i % colors.length],
                                                                left: '0',
                                                                top: '-300px',
                                                                animationDelay: `${rocketIdx * 0.4 + 0.8}s`,
                                                                '--angle-x': Math.cos(angle) * 80 + 'px',
                                                                '--angle-y': Math.sin(angle) * 80 + 'px',
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Success content */}
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-fade-in relative z-10">
                                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse">
                                            <Check size={48} strokeWidth={3} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-800">¡Voto Registrado!</h3>
                                        <p className="text-gray-500 text-center text-sm px-4">
                                            Tu participación ha sido registrada exitosamente.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {!submitted && (
                            <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col space-y-3">
                                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                                    <span>🔐</span>
                                    <span>Registrando voto como: <span className="font-bold text-gray-600">Socio #12345</span></span>
                                </div>
                                <button
                                    onClick={handleVote}
                                    disabled={!selectedOption}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition-all ${selectedOption ? 'bg-coop-blue shadow-lg hover:bg-blue-800' : 'bg-gray-300 cursor-not-allowed'}`}
                                >
                                    Confirmar Votación
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Profile.jsx
export const Profile = () => {
    const [user, setUser] = useState(null);
    const [profileImage, setProfileImage] = useState("https://via.placeholder.com/150");
    const [isCropping, setIsCropping] = useState(false);
    const [zoom, setZoom] = useState(50);
    const [tempImage, setTempImage] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch User Data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Mock ID 1 for demo
                const response = await fetch('http://localhost:3000/api/users/1');
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    if (data.profile_image) {
                        setProfileImage(data.profile_image.startsWith('http') ? data.profile_image : `http://localhost:3000${data.profile_image}`);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch user:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (x) => {
                setTempImage(x.target.result);
                setIsCropping(true);
            }
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCrop = async () => {
        // Upload to Backend
        // 1. Convert DataURL to Blob
        const res = await fetch(tempImage);
        const blob = await res.blob();
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('http://localhost:3000/api/users/1/avatar', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setProfileImage(`http://localhost:3000${data.avatarUrl}`);
                setIsCropping(false);
                alert("Foto actualizada correctamente");
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert("Error al subir imagen");
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;

    return (
        <div className="p-4 pt-10 text-center pb-24 relative">
            {/* QR Code - Top Left Corner */}
            {user?.member_id && (
                <div className="absolute top-4 left-4 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                    <QRCodeSVG
                        value={JSON.stringify({
                            type: 'RAITE_MEMBER',
                            id: user.member_id,
                            name: user.full_name,
                            cooperative: 'RAITE'
                        })}
                        size={150}
                        level="H"
                        includeMargin={false}
                        fgColor="#1a365d"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-mono text-center">Escanear ID</p>
                </div>
            )}

            <h1 className="text-2xl font-bold text-coop-blue mb-2">Mi Perfil</h1>

            {/* Member ID Display */}
            {user?.member_id && (
                <div className="inline-block bg-blue-50 text-coop-blue px-3 py-1 rounded-full text-xs font-mono font-bold mb-4 border border-blue-200">
                    ID: {user.member_id}
                </div>
            )}

            <p className="text-gray-500 mb-6 font-medium">Socio Cooperativista #{user?.id || '...'}</p>

            <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <label className="absolute bottom-0 right-0 bg-coop-blue text-white p-2 rounded-full cursor-pointer hover:bg-blue-800 transition shadow-md">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden text-left">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">Información Personal</h3>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Nombre Completo</label>
                        <p className="font-semibold text-gray-800 text-lg">{user?.full_name || 'Juan Pérez'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Teléfono</label>
                            <p className="font-semibold text-gray-700">{user?.phone || '55 1234 5678'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                            <p className="font-semibold text-gray-700">{user?.email || 'juan@raite.mx'}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Fecha de Ingreso</label>
                        <p className="font-semibold text-gray-700">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '01 Ene 2024'}</p>
                    </div>
                </div>
            </div>

            {/* Crop Modal */}
            {isCropping && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Ajustar Foto</h3>
                            <button onClick={() => setIsCropping(false)}><X size={24} className="text-gray-400" /></button>
                        </div>

                        <div className="p-6 flex flex-col items-center">
                            <div className="relative w-64 h-64 bg-gray-900 rounded-lg overflow-hidden mb-6 flex items-center justify-center">
                                {/* Simulated Image content */}
                                {tempImage && <img src={tempImage} className="max-w-none" style={{ transform: `scale(${zoom / 50})` }} alt="Crop Preview" />}

                                {/* Circular Mask Overlay */}
                                <div className="absolute inset-0 pointer-events-none border-[30px] border-black/50 rounded-full"></div>
                                <div className="absolute inset-0 border-2 border-white rounded-full pointer-events-none opacity-50"></div>
                            </div>

                            <div className="w-full space-y-2 mb-2">
                                <div className="flex justify-between text-xs text-gray-500 font-bold">
                                    <span>- Zoom</span>
                                    <span>+ Zoom</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="150"
                                    value={zoom}
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coop-blue"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex space-x-3">
                            <button
                                onClick={() => setIsCropping(false)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveCrop}
                                className="flex-1 py-3 bg-coop-blue text-white font-bold rounded-xl hover:bg-blue-800 transition shadow-lg"
                            >
                                Guardar Foto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
