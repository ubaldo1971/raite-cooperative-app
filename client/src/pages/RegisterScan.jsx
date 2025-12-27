import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import INEScanner from '../components/INEScanner';
import CameraCapture from '../components/CameraCapture';
import {
    ArrowLeft, Shield, CheckCircle2, User, Sparkles,
    Scan, Camera, Loader2, AlertCircle
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro con escáner QR/PDF417 de INE
 * Más rápido y preciso que OCR
 */
const RegisterScan = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Intro, 1: Scan INE, 2: Selfie, 3: Confirm, 4: Success
    const [scanData, setScanData] = useState(null);
    const [selfieImage, setSelfieImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Handler para cuando el escáner detecta el código
    const handleScanComplete = (data) => {
        console.log("📋 Datos del escáner:", data);
        setScanData(data);
        setStep(2); // Ir a selfie
    };

    // Handler para selfie
    const handleSelfieCapture = (imageSrc) => {
        setSelfieImage(imageSrc);
        setStep(3); // Ir a confirmación
    };

    // Enviar registro
    const submitRegistration = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                fullName: scanData.fullName || "",
                curp: scanData.curp || "",
                address: scanData.address || "",
                claveElector: scanData.claveElector || "",
                fechaNacimiento: scanData.fechaNacimiento || "",
                seccion: scanData.seccion || "",
                sexo: scanData.sexo || "",
                source: scanData.source || "SCAN",
                images: {
                    front: null, // No tenemos foto del frente con escáner
                    back: null,  // No tenemos foto del reverso
                    selfie: selfieImage
                }
            };

            console.log('📤 Enviando registro:', payload);

            const response = await fetch('/api/users/register-ine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Error en el registro');
            }

            const result = await response.json();
            console.log('✅ Registro exitoso:', result);

            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('userId', result.user.id);

            setStep(4); // Éxito

        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

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
            </header>

            <div className="flex-1 p-4 overflow-auto">
                {/* Step 0: Intro */}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 mb-6 text-center text-white">
                            <Scan className="w-16 h-16 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold mb-2">Registro Rápido</h2>
                            <p className="text-white/80">Escanea el código de tu INE para registrarte en segundos</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-500" />
                                ¿Cómo funciona?
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/30 rounded-full flex items-center justify-center text-orange-500 font-bold">1</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Escanea el <strong>código PDF417</strong> del reverso de tu INE
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-pink-100 dark:bg-pink-950/30 rounded-full flex items-center justify-center text-pink-500 font-bold">2</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Toma una <strong>selfie</strong> para verificación
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center text-green-500 font-bold">3</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>¡Listo!</strong> Tu cuenta será creada automáticamente
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Términos */}
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
                            Comenzar Escaneo
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4">
                            🔒 Tus datos están protegidos con encriptación de grado bancario
                        </p>
                    </div>
                )}

                {/* Step 1: Scan INE */}
                {step === 1 && (
                    <INEScanner
                        onScanComplete={handleScanComplete}
                        onCancel={() => setStep(0)}
                    />
                )}

                {/* Step 2: Selfie */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <CameraCapture
                            onCapture={handleSelfieCapture}
                            label="Selfie de Verificación"
                            instruction="Centra tu rostro en el círculo"
                            isDocument={false}
                        />
                    </div>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-4 border dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Datos Detectados</h3>
                                    <p className="text-sm text-gray-500">Verifica que sean correctos</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {scanData?.fullName && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Nombre</p>
                                        <p className="font-medium">{scanData.fullName}</p>
                                    </div>
                                )}
                                {scanData?.curp && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">CURP</p>
                                        <p className="font-mono font-medium">{scanData.curp}</p>
                                    </div>
                                )}
                                {scanData?.fechaNacimiento && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                                        <p className="font-medium">{scanData.fechaNacimiento}</p>
                                    </div>
                                )}
                                {scanData?.claveElector && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Clave de Elector</p>
                                        <p className="font-mono font-medium text-sm">{scanData.claveElector}</p>
                                    </div>
                                )}
                            </div>

                            {selfieImage && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-2">Tu selfie:</p>
                                    <img
                                        src={selfieImage}
                                        alt="Selfie"
                                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-orange-500"
                                    />
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 bg-gray-200 dark:bg-slate-700 rounded-xl font-semibold"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={submitRegistration}
                                disabled={submitting}
                                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="animate-fade-in text-center py-8">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Tu cuenta ha sido creada correctamente
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold"
                        >
                            Ir al Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterScan;
