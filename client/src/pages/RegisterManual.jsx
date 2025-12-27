import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import {
    ArrowLeft, CheckCircle2, User, Sparkles,
    IdCard, Loader2, AlertCircle, Edit
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro manual de datos con selfie
 * Alternativa confiable cuando el escáner no funciona
 */
const RegisterManual = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Form, 1: Selfie, 2: Confirm, 3: Success
    const [formData, setFormData] = useState({
        fullName: '',
        curp: '',
        fechaNacimiento: '',
        claveElector: '',
        seccion: '',
        address: ''
    });
    const [selfieImage, setSelfieImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelfieCapture = (imageSrc) => {
        setSelfieImage(imageSrc);
        setStep(2);
    };

    const isFormValid = () => {
        return formData.fullName.trim().length >= 3 && acceptedTerms;
    };

    const submitRegistration = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                fullName: formData.fullName,
                curp: formData.curp,
                address: formData.address,
                claveElector: formData.claveElector,
                fechaNacimiento: formData.fechaNacimiento,
                seccion: formData.seccion,
                source: "MANUAL",
                images: {
                    front: null,
                    back: null,
                    selfie: selfieImage
                }
            };

            console.log('📤 Enviando registro manual:', payload);

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

            setStep(3);

        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex flex-col">
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
                {/* Step 0: Form */}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-6 mb-6 text-center text-white">
                            <Edit className="w-12 h-12 mx-auto mb-3" />
                            <h2 className="text-2xl font-bold mb-2">Registro Manual</h2>
                            <p className="text-white/80 text-sm">Ingresa tus datos de la INE manualmente</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre Completo *
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Ej: GARCÍA LÓPEZ JUAN CARLOS"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        CURP
                                    </label>
                                    <input
                                        type="text"
                                        name="curp"
                                        value={formData.curp}
                                        onChange={(e) => handleInputChange({
                                            target: { name: 'curp', value: e.target.value.toUpperCase() }
                                        })}
                                        placeholder="18 caracteres"
                                        maxLength={18}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fecha de Nacimiento
                                    </label>
                                    <input
                                        type="date"
                                        name="fechaNacimiento"
                                        value={formData.fechaNacimiento}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Clave de Elector
                                    </label>
                                    <input
                                        type="text"
                                        name="claveElector"
                                        value={formData.claveElector}
                                        onChange={(e) => handleInputChange({
                                            target: { name: 'claveElector', value: e.target.value.toUpperCase() }
                                        })}
                                        placeholder="18 caracteres"
                                        maxLength={18}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sección Electoral
                                    </label>
                                    <input
                                        type="text"
                                        name="seccion"
                                        value={formData.seccion}
                                        onChange={handleInputChange}
                                        placeholder="4 dígitos"
                                        maxLength={4}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Domicilio
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Calle, número, colonia, ciudad"
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                    />
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
                            disabled={!isFormValid()}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${isFormValid()
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90'
                                    : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
                                }`}
                        >
                            Continuar con Selfie
                        </button>
                    </div>
                )}

                {/* Step 1: Selfie */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <CameraCapture
                            onCapture={handleSelfieCapture}
                            label="Selfie de Verificación"
                            instruction="Centra tu rostro en el círculo"
                            isDocument={false}
                        />
                    </div>
                )}

                {/* Step 2: Confirm */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-4 border dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Confirmar Datos</h3>
                                    <p className="text-sm text-gray-500">Verifica que sean correctos</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Nombre</p>
                                    <p className="font-medium">{formData.fullName}</p>
                                </div>
                                {formData.curp && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">CURP</p>
                                        <p className="font-mono font-medium">{formData.curp}</p>
                                    </div>
                                )}
                                {formData.fechaNacimiento && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
                                        <p className="font-medium">{formData.fechaNacimiento}</p>
                                    </div>
                                )}
                                {formData.claveElector && (
                                    <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-xs text-gray-500">Clave de Elector</p>
                                        <p className="font-mono font-medium text-sm">{formData.claveElector}</p>
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
                                onClick={() => setStep(0)}
                                className="flex-1 py-3 bg-gray-200 dark:bg-slate-700 rounded-xl font-semibold"
                            >
                                Editar Datos
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

                {/* Step 3: Success */}
                {step === 3 && (
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

export default RegisterManual;
