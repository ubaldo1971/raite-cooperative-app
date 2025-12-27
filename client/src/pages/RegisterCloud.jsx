import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import {
    Loader2, ArrowLeft, Shield, CheckCircle2, Camera,
    IdCard, User, Sparkles, ChevronRight, FileCheck,
    AlertCircle, Fingerprint, Cloud
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro con OCR en la nube (OCR.space)
 * Más preciso que Tesseract local
 */
const RegisterCloud = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Intro, 1: Front, 2: Back, 3: Selfie, 4: Processing, 5: Form
    const [images, setImages] = useState({ front: null, back: null, selfie: null });
    const [ocrData, setOcrData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleCapture = (type) => async (imageSrc) => {
        setImages(prev => ({ ...prev, [type]: imageSrc }));

        if (type === 'selfie') {
            setStep(4);
            processWithCloudOCR({ ...images, selfie: imageSrc });
        } else {
            setStep(prev => prev + 1);
        }
    };

    // Process with Cloud OCR API
    const processWithCloudOCR = async (finalImages) => {
        setProcessing(true);
        setProcessingMessage('Conectando con servicio de OCR...');
        console.log("🔍 Iniciando OCR en la nube...");

        try {
            setProcessingMessage('Procesando INE Frente...');

            const response = await fetch('http://localhost:3000/api/ocr/ine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frontImage: finalImages.front,
                    backImage: finalImages.back
                })
            });

            if (!response.ok) {
                throw new Error('Error en el servicio de OCR');
            }

            const result = await response.json();
            console.log('✅ Resultado OCR:', result);

            if (result.success) {
                setOcrData(result.data);
                setProcessingMessage('¡Datos extraídos exitosamente!');

                setTimeout(() => {
                    setProcessing(false);
                    setStep(5);
                }, 1000);
            } else {
                throw new Error(result.message || 'Error procesando OCR');
            }

        } catch (error) {
            console.error('❌ Error OCR:', error);
            setProcessingMessage('Error procesando imagen. Continuando con datos parciales...');
            setOcrData({
                fullName: '',
                curp: '',
                address: '',
                claveElector: '',
                fechaNacimiento: '',
                seccion: '',
                dataFound: false
            });
            setTimeout(() => {
                setProcessing(false);
                setStep(5);
            }, 2000);
        }
    };

    const submitRegistration = async () => {
        try {
            const payload = {
                fullName: ocrData.fullName,
                curp: ocrData.curp,
                address: ocrData.address,
                claveElector: ocrData.claveElector,
                fechaNacimiento: ocrData.fechaNacimiento,
                seccion: ocrData.seccion,
                images: {
                    front: images.front,
                    back: images.back,
                    selfie: images.selfie
                }
            };

            console.log('📤 Enviando registro...');

            const response = await fetch('http://localhost:3000/api/users/register-ine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Error en el registro');
            }

            const result = await response.json();
            console.log('✅ Registro exitoso:', result);

            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('userId', result.user.id);

            navigate('/dashboard');

        } catch (err) {
            console.error('❌ Error:', err);
            alert('Error al registrar. Por favor intenta de nuevo.');
        }
    };

    const progressSteps = [
        { id: 1, label: 'Frente', icon: IdCard },
        { id: 2, label: 'Reverso', icon: IdCard },
        { id: 3, label: 'Selfie', icon: User },
        { id: 4, label: 'Datos', icon: FileCheck }
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <img src={raiteLogo} alt="RAITE" className="h-8" />
                    <div className="w-10" />
                </div>

                {/* Progress Bar */}
                {step > 0 && step < 5 && (
                    <div className="px-4 pb-4">
                        <div className="flex justify-between items-center">
                            {progressSteps.map((s, i) => (
                                <div key={s.id} className="flex items-center flex-1">
                                    <div className={`
                                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500
                                        ${step >= s.id ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-gray-500'}
                                    `}>
                                        <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    {i < progressSteps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all duration-500 ${step > s.id ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gray-200 dark:bg-slate-800'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <div className="flex-1 p-4 overflow-auto">
                {/* Step 0: Intro */}
                {step === 0 && (
                    <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Cloud className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black">OCR en la Nube</h2>
                                    <p className="text-white/80 text-xs">Alta precisión con OCR.space ✨</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                Solo 4 pasos rápidos:
                            </p>
                            <div className="flex justify-between items-center gap-2">
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🪪</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">INE Frente</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🔄</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">INE Reverso</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">📸</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Selfie</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">✅</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Listo</p>
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 cursor-pointer mb-4">
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 mt-0.5"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Acepto los <strong>Términos de Servicio</strong> y <strong>Aviso de Privacidad</strong>
                            </span>
                        </label>

                        <button
                            onClick={() => setStep(1)}
                            disabled={!acceptedTerms}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${acceptedTerms
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90'
                                    : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
                                }`}
                        >
                            Comenzar Verificación
                        </button>
                    </div>
                )}

                {/* Step 1: Front */}
                {step === 1 && (
                    <CameraCapture
                        onCapture={handleCapture('front')}
                        label="INE - Frente"
                        instruction="Alinea tu INE dentro del marco"
                        isDocument={true}
                    />
                )}

                {/* Step 2: Back */}
                {step === 2 && (
                    <CameraCapture
                        onCapture={handleCapture('back')}
                        label="INE - Reverso"
                        instruction="Voltea tu INE y captura el reverso"
                        isDocument={true}
                    />
                )}

                {/* Step 3: Selfie */}
                {step === 3 && (
                    <CameraCapture
                        onCapture={handleCapture('selfie')}
                        label="Selfie de Verificación"
                        instruction="Centra tu rostro en el círculo"
                        isDocument={false}
                    />
                )}

                {/* Step 4: Processing */}
                {step === 4 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 animate-pulse flex items-center justify-center">
                                <Cloud className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                            Procesando en la Nube
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            {processingMessage}
                        </p>
                    </div>
                )}

                {/* Step 5: Form with extracted data */}
                {step === 5 && (
                    <div className="animate-fade-in">
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            <div>
                                <p className="font-medium text-green-700 dark:text-green-400">Datos Extraídos</p>
                                <p className="text-sm text-green-600 dark:text-green-500">Verifica que sean correctos</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800 space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={ocrData.fullName || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">CURP</label>
                                <input
                                    type="text"
                                    value={ocrData.curp || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, curp: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                    maxLength={18}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Fecha de Nacimiento</label>
                                <input
                                    type="text"
                                    value={ocrData.fechaNacimiento || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, fechaNacimiento: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Clave de Elector</label>
                                <input
                                    type="text"
                                    value={ocrData.claveElector || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, claveElector: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                    maxLength={18}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Sección</label>
                                <input
                                    type="text"
                                    value={ocrData.seccion || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, seccion: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                    maxLength={4}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Domicilio</label>
                                <textarea
                                    value={ocrData.address || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {images.selfie && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800 text-center">
                                <p className="text-xs text-gray-500 mb-2">Tu selfie:</p>
                                <img
                                    src={images.selfie}
                                    alt="Selfie"
                                    className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-orange-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={submitRegistration}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            Confirmar y Registrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterCloud;
