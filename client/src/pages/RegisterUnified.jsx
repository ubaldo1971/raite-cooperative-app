import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import {
    Loader2, ArrowLeft, Shield, CheckCircle2, Camera,
    Car, IdCard, User, Sparkles, ChevronRight, FileCheck,
    AlertCircle, Fingerprint, Cloud, FileQuestion, Mail,
    Phone, Lock, CreditCard, UserPlus, Eye, EyeOff
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro Unific ado MEJORADO - Con seguridad robusta
 * Steps: 0intro → 1:front → 2:detecting → 3:back → 4:selfie → 5:processing → 
 *        6:form → 7:contact → 8:password → 9:bank → 10:emergency → 11:pending
 */
const RegisterUnified = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [images, setImages] = useState({ front: null, back: null, selfie: null });
    const [ocrData, setOcrData] = useState({});
    const [contactData, setContactData] = useState({ email: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '', showPassword: false });
    const [bankData, setBankData] = useState({ clabe: '', bankName: '' });
    const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relation: '' });
    const [processing, setProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [documentType, setDocumentType] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Validations
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    const validateCLABE = (clabe) => /^\d{18}$/.test(clabe.replace(/\s/g, ''));
    const validatePassword = (pass) => pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /\d/.test(pass);

    // Capture handlers (same as before)
    const handleFrontCapture = async (imageSrc) => {
        setImages(prev => ({ ...prev, front: imageSrc }));
        setStep(2);
        await detectDocumentType(imageSrc);
    };

    const detectDocumentType = async (frontImage) => {
        setProcessingMessage('Analizando documento...');
        try {
            const response = await fetch('http://localhost:3000/api/ocr/detect-type', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frontImage })
            });
            const result = await response.json();

            if (result.success && result.documentType) {
                setDocumentType(result.documentType);
                setProcessingMessage(result.documentType === 'ine' ? '✅ INE detectada' : '✅ Licencia detectada');
                setTimeout(() => setStep(3), 1500);
            } else {
                setDocumentType('ine');
                setTimeout(() => setStep(3), 1500);
            }
        } catch (error) {
            setDocumentType('ine');
            setStep(3);
        }
    };

    const handleBackCapture = (imageSrc) => {
        setImages(prev => ({ ...prev, back: imageSrc }));
        setStep(4);
    };

    const handleSelfieCapture = (imageSrc) => {
        setImages(prev => ({ ...prev, selfie: imageSrc }));
        setStep(5);
        processWithCloudOCR({ ...images, selfie: imageSrc });
    };

    const processWithCloudOCR = async (finalImages) => {
        setProcessing(true);
        const docLabel = documentType === 'license' ? 'Licencia' : 'INE';
        setProcessingMessage(`Procesando ${docLabel}...`);

        try {
            const endpoint = documentType === 'license'
                ? 'http://localhost:3000/api/ocr/license'
                : 'http://localhost:3000/api/ocr/ine';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frontImage: finalImages.front,
                    backImage: finalImages.back
                })
            });

            const result = await response.json();

            if (result.success) {
                setOcrData(result.data);
                setTimeout(() => {
                    setProcessing(false);
                    setStep(6); // Go to form
                }, 1000);
            } else {
                throw new Error('OCR failed');
            }
        } catch (error) {
            setOcrData({ fullName: '', curp: '', address: '', dataFound: false });
            setTimeout(() => {
                setProcessing(false);
                setStep(6);
            }, 2000);
        }
    };

    // NEW: Validate and proceed to next step
    const validateContactData = () => {
        const newErrors = {};

        if (!contactData.email || !validateEmail(contactData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!contactData.phone || !validatePhone(contactData.phone)) {
            newErrors.phone = 'Teléfono debe tener 10 dígitos';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setStep(8); // Go to password step
        }
    };

    const validatePasswordData = () => {
        const newErrors = {};

        if (!validatePassword(passwordData.password)) {
            newErrors.password = 'Contraseña debe tener 8+ caracteres, mayúscula, minúscula y número';
        }

        if (passwordData.password !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setStep(9); // Go to bank data
        }
    };

    const validateBankData = () => {
        const newErrors = {};

        if (bankData.clabe && !validateCLABE(bankData.clabe)) {
            newErrors.clabe = 'CLABE debe tener 18 dígitos';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setStep(10); // Go to emergency contact
        }
    };

    const submitRegistration = async () => {
        setProcessing(true);
        setProcessingMessage('Enviando registro...');

        try {
            const endpoint = documentType === 'license'
                ? 'http://localhost:3000/api/users/register-license'
                : 'http://localhost:3000/api/users/register-ine';

            const basePayload = {
                fullName: ocrData.fullName,
                curp: ocrData.curp,
                address: ocrData.address,
                fechaNacimiento: ocrData.fechaNacimiento,
                // NEW: Contact data
                email: contactData.email,
                phone: contactData.phone,
                password: passwordData.password,
                // NEW: Bank data
                clabe: bankData.clabe,
                bankName: bankData.bankName,
                // NEW: Emergency contact
                emergencyContactName: emergencyContact.name,
                emergencyContactPhone: emergencyContact.phone,
                emergencyContactRelation: emergencyContact.relation,
                images
            };

            const payload = documentType === 'license' ? {
                ...basePayload,
                licenseNumber: ocrData.licenseNumber,
                licenseType: ocrData.licenseType,
                vigencia: ocrData.vigencia
            } : {
                ...basePayload,
                claveElector: ocrData.claveElector,
                seccion: ocrData.seccion
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error en el registro');
            }

            // Save token and user
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            setProcessing(false);
            setStep(11); // Go to pending approval screen
        } catch (err) {
            setProcessing(false);
            alert(err.message || 'Error al registrar. Por favor intenta de nuevo.');
        }
    };

    const theme = documentType === 'license'
        ? { from: 'from-blue-500', to: 'to-cyan-500', text: 'text-blue-500', bg: 'bg-blue-500' }
        : { from: 'from-orange-500', to: 'to-pink-500', text: 'text-orange-500', bg: 'bg-orange-500' };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex flex-col">
            <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => step > 0 ? setStep(Math.max(0, step - 1)) : navigate(-1)}
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
                    <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black">Registro Seguro</h2>
                                    <p className="text-white/80 text-xs">INE o Licencia - ¡Verificación completa!</p>
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
                            <span className="flex items-center justify-center gap-2">
                                <Camera className="w-5 h-5" />
                                Comenzar Registro
                            </span>
                        </button>
                    </div>
                )}

                {/* Step 1: Front Capture */}
                {step === 1 && (
                    <CameraCapture
                        onCapture={handleFrontCapture}
                        label="Documento - Frente"
                        instruction="Captura el frente de tu INE o Licencia"
                        isDocument={true}
                    />
                )}

                {/* Step 2: Detecting */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className={`w-24 h-24 bg-gradient-to-br ${theme.from} ${theme.to} rounded-full flex items-center justify-center mb-6 animate-pulse`}>
                            <FileQuestion className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-center dark:text-white">Analizando Documento</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">{processingMessage}</p>
                    </div>
                )}

                {/* Step 3: Back Capture */}
                {step === 3 && (
                    <CameraCapture
                        onCapture={handleBackCapture}
                        label={documentType === 'license' ? 'Licencia - Reverso' : 'INE - Reverso'}
                        instruction="Voltea tu documento y captura el reverso"
                        isDocument={true}
                    />
                )}

                {/* Step 4: Selfie */}
                {step === 4 && (
                    <CameraCapture
                        onCapture={handleSelfieCapture}
                        label="Selfie de Verificación"
                        instruction="Centra tu rostro en el círculo"
                        isDocument={false}
                    />
                )}

                {/* Step 5: Processing OCR */}
                {step === 5 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className={`w-24 h-24 bg-gradient-to-br ${theme.from} ${theme.to} rounded-full flex items-center justify-center mb-6 animate-pulse`}>
                            <Cloud className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-center dark:text-white">Procesando con OCR</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-4">{processingMessage}</p>
                        <Loader2 className={`w-8 h-8 ${theme.text} animate-spin`} />
                    </div>
                )}

                {/* Step 6: Document Data Form (abbreviated, only essentials) */}
                {step === 6 && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <h3 className="font-bold text-gray-800 dark:text-white">Verifica tus Datos</h3>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={ocrData.fullName || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, fullName: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                    placeholder="Ej: JUAN PÉREZ GARCÍA"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">CURP</label>
                                <input
                                    type="text"
                                    value={ocrData.curp || ''}
                                    onChange={(e) => setOcrData({ ...ocrData, curp: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 font-mono dark:text-white"
                                    maxLength={18}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(7)}
                            className={`w-full py-4 bg-gradient-to-r ${theme.from} ${theme.to} text-white rounded-xl font-bold hover:opacity-90`}
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step 7: Contact Information */}
                {step === 7 && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <Mail className="w-12 h-12 mx-auto mb-2" />
                            <h2 className="text-xl font-black">Datos de Contacto</h2>
                            <p className="text-white/80 text-xs">Necesarios para tu cuenta y verificación</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Email
                                </label>
                                <input
                                    type="email"
                                    value={contactData.email}
                                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                                    className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 dark:text-white`}
                                    placeholder="tucorreo@ejemplo.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Teléfono (10 dígitos)
                                </label>
                                <input
                                    type="tel"
                                    value={contactData.phone}
                                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value.replace(/\D/g, '') })}
                                    maxLength={10}
                                    className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 font-mono dark:text-white`}
                                    placeholder="5512345678"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>
                        </div>

                        <button
                            onClick={validateContactData}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:opacity-90"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step 8: Password Creation */}
                {step === 8 && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <Lock className="w-12 h-12 mx-auto mb-2" />
                            <h2 className="text-xl font-black">Crea tu Contraseña</h2>
                            <p className="text-white/80 text-xs">Mínimo 8 caracteres, mayúscula, minúscula y número</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={passwordData.showPassword ? 'text' : 'password'}
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                        className={`w-full mt-1 px-4 py-3 pr-12 rounded-xl border ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 dark:text-white`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPasswordData({ ...passwordData, showPassword: !passwordData.showPassword })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {passwordData.showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 dark:text-white`}
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <button
                            onClick={validatePasswordData}
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold hover:opacity-90"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step 9: Bank Data (Optional) */}
                {step === 9 && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <CreditCard className="w-12 h-12 mx-auto mb-2" />
                            <h2 className="text-xl font-black">Datos Bancarios</h2>
                            <p className="text-white/80 text-xs">Opcional - Para depósitos y pagos</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">CLABE (18 dígitos)</label>
                                <input
                                    type="text"
                                    value={bankData.clabe}
                                    onChange={(e) => setBankData({ ...bankData, clabe: e.target.value.replace(/\D/g, '') })}
                                    maxLength={18}
                                    className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.clabe ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 font-mono dark:text-white`}
                                    placeholder="012345678901234567"
                                />
                                {errors.clabe && <p className="text-red-500 text-xs mt-1">{errors.clabe}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre del Banco</label>
                                <input
                                    type="text"
                                    value={bankData.bankName}
                                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                    placeholder="Ej: BBVA, Santander, Banorte"
                                />
                            </div>
                        </div>

                        <button
                            onClick={validateBankData}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90"
                        >
                            Continuar
                        </button>

                        <button
                            onClick={() => setStep(10)}
                            className="w-full py-3 text-gray-600 dark:text-gray-400 text-sm"
                        >
                            Omitir por ahora
                        </button>
                    </div>
                )}

                {/* Step 10: Emergency Contact */}
                {step === 10 && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <UserPlus className="w-12 h-12 mx-auto mb-2" />
                            <h2 className="text-xl font-black">Contacto de Emergencia</h2>
                            <p className="text-white/80 text-xs">En caso de ser necesario</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={emergencyContact.name}
                                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Teléfono</label>
                                <input
                                    type="tel"
                                    value={emergencyContact.phone}
                                    onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value.replace(/\D/g, '') })}
                                    maxLength={10}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 font-mono dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Relación</label>
                                <select
                                    value={emergencyContact.relation}
                                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                                    className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Padre/Madre">Padre/Madre</option>
                                    <option value="Esposo/a">Esposo/a</option>
                                    <option value="Hermano/a">Hermano/a</option>
                                    <option value="Hijo/a">Hijo/a</option>
                                    <option value="Amigo/a">Amigo/a</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={submitRegistration}
                            disabled={processing}
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    Completar Registro
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 11: Pending Approval */}
                {step === 11 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-8">
                        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-950/30 rounded-full flex items-center justify-center mb-6">
                            <Shield className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 dark:text-white">¡Registro Completado!</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                            Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos por email y SMS cuando sea aprobada.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 max-w-md">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                <strong>Estado:</strong> Pendiente de Aprobación
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                                Tiempo estimado de revisión: 24-48 horas
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold"
                        >
                            Ir a Inicio de Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterUnified;
