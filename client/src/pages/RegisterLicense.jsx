import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import {
    Loader2, ArrowLeft, Shield, CheckCircle2, Camera,
    Car, User, Sparkles, ChevronRight, FileCheck,
    AlertCircle, Fingerprint, Cloud
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro con Licencia de Manejo usando OCR en la nube
 */
const RegisterLicense = () => {
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

    // Process with Cloud OCR API for License
    const processWithCloudOCR = async (finalImages) => {
        setProcessing(true);
        setProcessingMessage('Conectando con servicio de OCR...');
        console.log("🔍 Iniciando OCR de Licencia...");

        try {
            setProcessingMessage('Procesando Licencia de Manejo...');

            const response = await fetch('/api/ocr/license', {
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
            console.log('✅ Resultado OCR Licencia:', result);

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
                licenseNumber: '',
                licenseType: '',
                vigencia: '',
                fechaNacimiento: '',
                address: '',
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
                licenseNumber: ocrData.licenseNumber,
                licenseType: ocrData.licenseType,
                vigencia: ocrData.vigencia,
                fechaNacimiento: ocrData.fechaNacimiento,
                address: ocrData.address,
                documentType: 'license',
                images: {
                    front: images.front,
                    back: images.back,
                    selfie: images.selfie
                }
            };

            console.log('📤 Enviando registro con licencia...');

            const response = await fetch('/api/users/register-license', {
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
        { id: 1, label: 'Frente', icon: Car },
        { id: 2, label: 'Reverso', icon: Car },
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
                                        ${step >= s.id ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-gray-500'}
                                    `}>
                                        <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    {i < progressSteps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all duration-500 ${step > s.id ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-200 dark:bg-slate-800'}`} />
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
                        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Car className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black">Licencia de Manejo</h2>
                                    <p className="text-white/80 text-xs">Registro con OCR ✨</p>
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
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🪪</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Licencia Frente</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🔄</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Licencia Reverso</p>
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
                                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 mt-0.5"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Acepto los <strong>Términos de Servicio</strong> y <strong>Aviso de Privacidad</strong>
                            </span>
                        </label>

                        <button
                            onClick={() => setStep(1)}
                            disabled={!acceptedTerms}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${acceptedTerms
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90'
                                : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Camera className="w-5 h-5" />
                                Comenzar Escaneo
                            </span>
                        </button>
                    </div>
                )}

                {/* Step 1: License Front */}
                {step === 1 && (
                    <CameraCapture
                        onCapture={handleCapture('front')}
                        label="Licencia - Frente"
                        instruction="Alinea tu licencia dentro del marco"
                        isDocument={true}
                    />
                )}

                {/* Step 2: License Back */}
                {step === 2 && (
                    <CameraCapture
                        onCapture={handleCapture('back')}
                        label="Licencia - Reverso"
                        instruction="Voltea tu licencia y captura el reverso"
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
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Cloud className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-center dark:text-white">
                            Procesando con OCR
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                            {processingMessage}
                        </p>
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {/* Step 5: Form */}
                {step === 5 && (
                    <div className="space-y-4">
                        {/* Status Banner */}
                        {ocrData.dataFound !== false ? (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-400">Datos Extraídos</p>
                                    <p className="text-sm text-green-600 dark:text-green-500">Verifica que sean correctos</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-orange-700 dark:text-orange-400">Ingresa tus datos manualmente</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-500">No pudimos leer tu licencia automáticamente</p>
                                </div>
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-500" />
                                Completa tu información
                            </h3>

                            {/* Nombre */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    Nombre Completo
                                    {!ocrData.fullName && <span className="text-orange-500 text-xs">Ingresa manualmente</span>}
                                </label>
                                <input
                                    type="text"
                                    value={ocrData.fullName || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, fullName: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                                    placeholder="Ej: JUAN PÉREZ GARCÍA"
                                />
                            </div>

                            {/* Número de Licencia */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    Número de Licencia
                                    {!ocrData.licenseNumber && <span className="text-orange-500 text-xs">Ingresa manualmente</span>}
                                </label>
                                <input
                                    type="text"
                                    value={ocrData.licenseNumber || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, licenseNumber: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono dark:text-white"
                                    placeholder="Ej: ABC1234567"
                                />
                            </div>

                            {/* Tipo de Licencia y Vigencia */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Tipo de Licencia
                                    </label>
                                    <select
                                        value={ocrData.licenseType || ''}
                                        onChange={(e) => setOcrData({ ...ocrData, licenseType: e.target.value })}
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="A">Tipo A - Automovilista</option>
                                        <option value="B">Tipo B - Motociclista</option>
                                        <option value="C">Tipo C - Chofer</option>
                                        <option value="D">Tipo D - Transporte</option>
                                        <option value="E">Tipo E - Especial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Vigencia
                                    </label>
                                    <input
                                        type="date"
                                        value={ocrData.vigencia || ''}
                                        onChange={(e) => setOcrData({ ...ocrData, vigencia: e.target.value })}
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* CURP */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    CURP
                                    {!ocrData.curp && <span className="text-orange-500 text-xs">Ingresa manualmente</span>}
                                </label>
                                <input
                                    type="text"
                                    value={ocrData.curp || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, curp: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono dark:text-white"
                                    placeholder="Ej: PEGJ850101HDFRRA09"
                                    maxLength={18}
                                />
                                <p className="text-xs text-gray-400 mt-1">18 caracteres alfanuméricos</p>
                            </div>

                            {/* Fecha de Nacimiento */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    value={ocrData.fechaNacimiento || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, fechaNacimiento: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                                />
                            </div>

                            {/* Domicilio */}
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    Domicilio
                                    {!ocrData.address && <span className="text-orange-500 text-xs">Ingresa manualmente</span>}
                                </label>
                                <textarea
                                    value={ocrData.address || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, address: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white resize-none"
                                    rows={2}
                                    placeholder="Ej: Calle Reforma #123, Col. Centro, CDMX, CP 06000"
                                />
                            </div>
                        </div>

                        {/* Captured Photos Preview */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border dark:border-slate-800">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Documentos capturados
                            </p>
                            <div className="flex gap-2">
                                {images.front && (
                                    <div className="flex-1 relative">
                                        <img src={images.front} alt="Licencia Frente" className="w-full h-16 object-cover rounded-lg" />
                                        <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Frente</span>
                                    </div>
                                )}
                                {images.back && (
                                    <div className="flex-1 relative">
                                        <img src={images.back} alt="Licencia Reverso" className="w-full h-16 object-cover rounded-lg" />
                                        <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Reverso</span>
                                    </div>
                                )}
                                {images.selfie && (
                                    <div className="flex-1 relative">
                                        <img src={images.selfie} alt="Selfie" className="w-full h-16 object-cover rounded-lg" />
                                        <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Selfie</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={submitRegistration}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
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

export default RegisterLicense;
