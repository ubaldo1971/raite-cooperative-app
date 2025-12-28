import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, BrowserPDF417Reader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { parseInePayload, formatForBackend } from '../utils/ineParser';
import {
    Loader2, ArrowLeft, Shield, CheckCircle2, Camera,
    IdCard, User, Sparkles, ChevronRight, FileCheck,
    AlertCircle, Fingerprint, RefreshCw, Scan, Check,
    Mail, Phone, Lock, CreditCard, UserPlus, Eye, EyeOff
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro Híbrido Mejorado
 * - Captura fotos de documentos (frente y reverso)
 * - Escanea códigos PDF417/QR automáticamente del reverso
 * - Detecta tipo de documento (INE o Licencia)
 * - Extrae datos del código (más preciso que OCR)
 */
const Register = () => {
    const navigate = useNavigate();

    // Steps: 0:intro, 1:front, 2:back+scan, 3:selfie, 4:processing, 5:form, 6:contact, 7:password, 8:bank, 9:emergency, 10:pending
    const [step, setStep] = useState(0);
    const [images, setImages] = useState({ front: null, back: null, selfie: null });
    const [scannedData, setScannedData] = useState(null);
    const [documentType, setDocumentType] = useState(null); // 'ine' or 'license'
    const [contactData, setContactData] = useState({ email: '', phone: '' });
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '', showPassword: false });
    const [bankData, setBankData] = useState({ clabe: '', bankName: '' });
    const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relation: '' });
    const [processing, setProcessing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errors, setErrors] = useState({});

    // Camera refs
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState('');
    const [useRearCamera, setUseRearCamera] = useState(true);
    const scannerRef = useRef(null);
    const stopScanRef = useRef(null);

    useEffect(() => {
        setIsLoaded(true);
        return () => {
            // Cleanup scanner on unmount
            if (stopScanRef.current) {
                stopScanRef.current();
            }
        };
    }, []);

    // Video constraints
    const videoConstraints = {
        width: { min: 1280, ideal: 1920, max: 4096 },
        height: { min: 720, ideal: 1080, max: 2160 },
        aspectRatio: { ideal: 16 / 9 },
        facingMode: useRearCamera ? { ideal: "environment" } : { ideal: "user" }
    };

    // Validations
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    const validateCLABE = (clabe) => /^\d{18}$/.test(clabe.replace(/\s/g, ''));
    const validatePassword = (pass) => pass.length >= 8 && /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /\d/.test(pass);

    // Capture photo
    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
        }
    }, [webcamRef]);



    // Confirm front photo - NOW WITH AI DATA EXTRACTION
    const confirmFront = async () => {
        const imageToProcess = capturedImage;
        setImages(prev => ({ ...prev, front: imageToProcess }));

        // Trigger AI extraction on the FRONT image
        setIsScanning(true);
        setScanStatus('Analizando datos (IA Frontal)...');

        try {
            console.log("🧠 Sending FRONT image to Gemini...");
            const response = await fetch('/api/decode-barcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageToProcess })
            });

            const result = await response.json();
            console.log("🧠 AI Response (Front):", result);

            if (result.success && result.data?.dataFound) {
                console.log("✅ Datos extraídos del FRENTE exitosamente");
                setScannedData({
                    fullName: result.data.fullName || '',
                    curp: result.data.curp || '',
                    claveElector: result.data.claveElector || '',
                    fechaNacimiento: result.data.fechaNacimiento || '',
                    seccion: result.data.seccion || '',
                    sexo: result.data.sexo || '',
                    address: result.data.address || '',
                    source: 'FRONT_AI_GEMINI'
                });
            } else {
                console.warn("⚠️ AI no pudo leer datos del frente, intentaremos con el reverso");
            }
        } catch (e) {
            console.error("❌ Error AI Front:", e);
        }

        setIsScanning(false);
        setCapturedImage(null);
        setScanStatus(''); // Clear status
        setStep(2); // Go to Back
    };

    // Helper: Check if barcode content has useful data
    const isUsefulBarcodeContent = (rawValue) => {
        if (!rawValue || typeof rawValue !== 'string') return false;

        // If it's a URL, it's not useful by itself (QR from INE just has verification URL)
        if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
            console.log("⚠️ Detected URL-only content, not useful for data extraction");
            return false;
        }

        // Check if it contains CURP pattern (18 chars with specific format)
        const hasCurp = /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/.test(rawValue.toUpperCase());

        // Check if it has enough alphanumeric content (PDF417 has lots of data)
        const hasSubstantialData = rawValue.length > 50;

        return hasCurp || hasSubstantialData;
    };

    // Scan barcode from an image (more reliable than stream)
    const scanBarcodeFromImage = async (imageSrc) => {
        console.log("🔍 Scanning barcode from captured image...");
        setScanStatus('Analizando código...');

        try {
            // Create an image element
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = imageSrc;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            console.log(`📐 Image loaded: ${img.width}x${img.height}`);

            // Variable to store QR URL as fallback
            let qrUrlFallback = null;

            // Try native BarcodeDetector first (best quality)
            if ("BarcodeDetector" in window) {
                try {
                    console.log("📱 Trying native BarcodeDetector...");
                    const formats = ["pdf417", "qr_code", "aztec", "data_matrix"]; // PDF417 first!
                    const detector = new window.BarcodeDetector({ formats });
                    const bitmap = await createImageBitmap(img);
                    const codes = await detector.detect(bitmap);

                    if (codes?.length) {
                        console.log(`📱 Native detector found ${codes.length} code(s)`);

                        // First priority: PDF417 with useful content
                        const pdf417Code = codes.find(c =>
                            c.format?.toLowerCase() === 'pdf417' &&
                            isUsefulBarcodeContent(c.rawValue)
                        );
                        if (pdf417Code) {
                            console.log("✅ PDF417 with useful data found!");
                            handleBarcodeDetected(pdf417Code.rawValue, pdf417Code.format);
                            return true;
                        }

                        // Second: Any code with useful content
                        const usefulCode = codes.find(c => isUsefulBarcodeContent(c.rawValue));
                        if (usefulCode) {
                            console.log("✅ Useful barcode found:", usefulCode.format);
                            handleBarcodeDetected(usefulCode.rawValue, usefulCode.format);
                            return true;
                        }

                        // Store QR URL as fallback (for qr.ine.mx verification)
                        const qrCode = codes.find(c =>
                            c.format?.toLowerCase() === 'qr_code' &&
                            c.rawValue?.includes('qr.ine.mx')
                        );
                        if (qrCode) {
                            console.log("📎 Storing INE QR URL as fallback:", qrCode.rawValue);
                            qrUrlFallback = qrCode.rawValue;
                        }
                    }
                    console.log("⚠️ Native detector: no useful data found, continuing...");
                } catch (nativeErr) {
                    console.warn("Native detector error:", nativeErr.message);
                }
            }

            // Fallback to ZXing - Method 1: Dedicated PDF417 Reader (best for INE)
            console.log("📊 Trying ZXing PDF417 dedicated reader...");
            try {
                const pdf417Reader = new BrowserPDF417Reader();
                // Add image to DOM temporarily for ZXing
                img.style.display = 'none';
                document.body.appendChild(img);

                const result = await pdf417Reader.decodeFromImageElement(img);
                document.body.removeChild(img);

                if (result && isUsefulBarcodeContent(result.getText())) {
                    console.log("✅ PDF417 Reader found useful data:", result.getText()?.substring(0, 50));
                    handleBarcodeDetected(result.getText(), 'PDF417');
                    return true;
                } else if (result) {
                    console.log("⚠️ PDF417 Reader found code but content not useful");
                }
            } catch (pdf417Err) {
                console.warn("PDF417 Reader failed:", pdf417Err.message);
                if (img.parentNode) img.parentNode.removeChild(img);
            }

            // If we have a QR URL from INE as fallback, use it (better than nothing)
            if (qrUrlFallback) {
                console.log("📎 Using INE QR URL fallback:", qrUrlFallback);
                // Parse the INE QR URL (just ensures we register that we saw a code)
                handleBarcodeDetected(qrUrlFallback, 'QR_CODE_INE');
                return true;
            }

        } catch (error) {
            console.error("❌ Barcode scan failed:", error);
        }

        console.log("❌ No barcode found after all attempts");
        return false;
    };

    // ... [Inside Register component] ...

    // Capture back photo and immediately scan for barcode (Modified to preserve Front Data)
    const captureBack = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);

            // Stop live scanner
            if (stopScanRef.current) {
                stopScanRef.current();
            }

            // Immediately scan the captured image (Local only first)
            setIsScanning(true);
            setScanStatus('Verificando código...');

            const found = await scanBarcodeFromImage(imageSrc);

            // Check if we already have full data from Front AI
            const hasFullData = scannedData?.curp || scannedData?.fullName;

            if (hasFullData) {
                console.log("ℹ️ We already have data from Front AI. Back scan is just for verification.");
                // If we found a code (even verification only), great.
                // If not, we don't really care as much since we have the data.
                if (found) {
                    setScanStatus('¡Código Verificado!');
                } else {
                    setScanStatus('Reverso guardado');
                }

                // Don't call backend if we already have data, unless we really want PDF417 override.
                // For now, trust the Front AI if it succeeded.
                setIsScanning(false);
                return;
            }

            // IF WE DON'T HAVE DATA YET, proceed with backend fallback for Back image
            if (found) {
                console.log("✅ Barcode data extracted locally (PDF417)");
                setIsScanning(false);
            } else {
                console.log("⚠️ No local barcode & No Front data. Trying backend for Back image...");
                setScanStatus('Procesando al servidor...');

                try {
                    const response = await fetch('/api/decode-barcode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageSrc })
                    });

                    const result = await response.json();

                    if (result.success && result.data?.dataFound) {
                        setScannedData({
                            fullName: result.data.fullName || '',
                            curp: result.data.curp || '',
                            claveElector: result.data.claveElector || '',
                            fechaNacimiento: result.data.fechaNacimiento || '',
                            seccion: result.data.seccion || '',
                            sexo: result.data.sexo || '',
                            address: result.data.address || '',
                            source: 'BACKEND_OCR_BACK'
                        });
                        setScanStatus('¡Datos extraídos (Reverso)!');
                    } else {
                        setScanStatus('No se detectó código');
                    }
                } catch (err) {
                    console.error("❌ Backend error:", err);
                    setScanStatus('Error de conexión');
                }

                setIsScanning(false);
            }
        }
    };

    // Confirm back now just sets image and goes to step 3
    const confirmBack = async () => {
        const imageSrc = webcamRef.current?.getScreenshot() || capturedImage;
        setImages(prev => ({ ...prev, back: imageSrc }));
        setCapturedImage(null);

        if (stopScanRef.current) stopScanRef.current();

        setStep(3);
    };

    // Capture and confirm selfie
    const confirmSelfie = () => {
        const imageSrc = webcamRef.current?.getScreenshot() || capturedImage;
        setImages(prev => ({ ...prev, selfie: imageSrc }));
        setCapturedImage(null);
        setStep(4); // Processing

        // Short processing state then go to form
        setImages(prev => ({ ...prev, selfie: capturedImage }));
        setCapturedImage(null);
        setStep(4);
    };

    // Skip scanning and continue
    const skipScanning = () => {
        if (stopScanRef.current) {
            stopScanRef.current();
        }
        setIsScanning(false);
        setScanStatus('');
        setScannedData(null);
        setDocumentType('ine'); // Default
    };

    // Validate contact data
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
            setStep(7);
        }
    };

    // Validate password
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
            setStep(8);
        }
    };

    // Validate bank data
    const validateBankData = () => {
        const newErrors = {};
        if (bankData.clabe && !validateCLABE(bankData.clabe)) {
            newErrors.clabe = 'CLABE debe tener 18 dígitos';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            setStep(9);
        }
    };

    // Submit registration
    const submitRegistration = async () => {
        setProcessing(true);

        try {
            // Default to 'ine' if not set (since we prioritize Front AI now)
            const typeToRegister = documentType || 'ine';
            const endpoint = typeToRegister === 'license'
                ? '/api/users/register-license'
                : '/api/users/register-ine';

            const payload = {
                fullName: scannedData?.fullName || '',
                curp: scannedData?.curp || '',
                address: scannedData?.address || '',
                claveElector: scannedData?.claveElector || '',
                fechaNacimiento: scannedData?.fechaNacimiento || '',
                seccion: scannedData?.seccion || '',
                email: contactData.email,
                phone: contactData.phone,
                password: passwordData.password,
                clabe: bankData.clabe,
                bankName: bankData.bankName,
                emergencyContactName: emergencyContact.name,
                emergencyContactPhone: emergencyContact.phone,
                emergencyContactRelation: emergencyContact.relation,
                images,
                source: scannedData?.source || 'PHOTO_ONLY'
            };

            console.log('📤 Submitting registration:', payload);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error en el registro');
            }

            // Success! Save token
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('userId', result.user.id);

            setProcessing(false);
            setStep(10); // Show success screen

            // Auto-navigate to dashboard after 3 seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);

        } catch (err) {
            console.error("Registration Error:", err);
            setProcessing(false);
            alert(`Error: ${err.message || 'No se pudo completar el registro.'}`);
        }
    };

    // Progress steps
    const progressSteps = [
        { id: 1, label: 'Frente', icon: IdCard },
        { id: 2, label: 'Reverso', icon: Scan },
        { id: 3, label: 'Selfie', icon: Camera },
        { id: 4, label: 'Datos', icon: FileCheck },
    ];

    const theme = documentType === 'license'
        ? { from: 'from-blue-500', to: 'to-cyan-500', text: 'text-blue-500' }
        : { from: 'from-orange-500', to: 'to-pink-500', text: 'text-orange-500' };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 flex flex-col">
            {/* Header */}
            <header className={`bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 sticky top-0 z-50 transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                <div className="p-4 flex items-center justify-between">
                    <button
                        onClick={() => step > 0 ? setStep(Math.max(0, step - 1)) : navigate('/')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src={raiteLogo} alt="RAITE" className="h-8 w-auto object-contain rounded-sm" />
                        <span className="font-bold text-lg bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent border-l border-gray-200 dark:border-slate-700 pl-2">
                            Registro
                        </span>
                        <span className="text-[8px] text-gray-400 ml-1">v3.0 (Manual)</span>
                    </div>
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
                                        ${step >= s.id ? `bg-gradient-to-br ${theme.from} ${theme.to} text-white shadow-lg` : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}
                                        ${step === s.id ? 'scale-110 animate-pulse' : ''}
                                    `}>
                                        <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    {i < progressSteps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all duration-500 ${step > s.id ? `bg-gradient-to-r ${theme.from} ${theme.to}` : 'bg-gray-200 dark:bg-slate-800'}`} />
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
                                    <Fingerprint className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black">Registro Simple</h2>
                                    <p className="text-white/80 text-xs">Fotos + Datos Manuales</p>
                                </div>
                            </div>
                        </div>

                        {/* Steps explanation */}
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
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Frente</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">📊</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Reverso</p>
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
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">✅</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">¡Listo!</p>
                                </div>
                            </div>
                        </div>

                        {/* Privacy Consent */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-3 mb-4 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <h4 className="font-semibold text-gray-800 dark:text-white text-xs">Aviso de Privacidad</h4>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                                RAITE Cooperativa tratará tus datos (INE/Licencia, selfie) para verificar tu identidad y registrarte como socio.
                            </p>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={acceptedTerms}
                                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${acceptedTerms
                                        ? 'bg-gradient-to-br from-green-500 to-teal-500 border-green-500'
                                        : 'border-orange-400 bg-white dark:bg-slate-800 animate-pulse'
                                        }`}>
                                        {acceptedTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                    Acepto el <span className="text-blue-500 font-semibold">Aviso de Privacidad</span>
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            disabled={!acceptedTerms}
                            className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${acceptedTerms
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-xl active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Camera className="w-5 h-5" />
                            {acceptedTerms ? 'Comenzar Registro' : 'Acepta para continuar'}
                            {acceptedTerms && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>
                )}

                {/* Step 1: Front Photo */}
                {step === 1 && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-black mb-1 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                                Frente
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toma una foto clara del frente</p>
                        </div>
                        <div className="relative w-full aspect-[3/2] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mb-6">
                            {!capturedImage ? (
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="w-full h-full object-cover" />
                            ) : (
                                <img src={capturedImage} alt="front" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex space-x-6">
                            {!capturedImage ? (
                                <button onClick={capture} className="flex flex-col items-center gap-2"><div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full text-white shadow-lg flex items-center justify-center"><Camera size={38} /></div><span className="text-xs font-bold text-gray-500">CAPTURAR</span></button>
                            ) : (
                                <>
                                    <button onClick={() => setCapturedImage(null)} className="flex flex-col items-center gap-2"><div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 rounded-full text-gray-500 flex items-center justify-center"><RefreshCw size={24} /></div><span className="text-xs font-bold text-gray-400">REPETIR</span></button>
                                    <button onClick={confirmFront} className="flex flex-col items-center gap-2"><div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full text-white shadow-lg flex items-center justify-center"><Check size={42} /></div><span className="text-xs font-bold text-green-500">LISTO</span></button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Back Photo */}
                {step === 2 && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-black mb-1 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                Reverso
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Toma una foto clara del reverso</p>
                        </div>
                        <div className="relative w-full aspect-[3/2] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mb-6">
                            {!capturedImage ? (
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="w-full h-full object-cover" />
                            ) : (
                                <img src={capturedImage} alt="back" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex space-x-6">
                            {!capturedImage ? (
                                <button onClick={captureBack} className="flex flex-col items-center gap-2"><div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full text-white shadow-lg flex items-center justify-center"><Camera size={38} /></div><span className="text-xs font-bold text-gray-500">CAPTURAR</span></button>
                            ) : (
                                <>
                                    <button onClick={() => setCapturedImage(null)} className="flex flex-col items-center gap-2"><div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 rounded-full text-gray-500 flex items-center justify-center"><RefreshCw size={24} /></div><span className="text-xs font-bold text-gray-400">REPETIR</span></button>
                                    <button onClick={confirmBack} className="flex flex-col items-center gap-2"><div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full text-white shadow-lg flex items-center justify-center"><Check size={42} /></div><span className="text-xs font-bold text-green-500">LISTO</span></button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Selfie */}
                {step === 3 && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-black mb-1 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                Selfie
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tu foto de perfil</p>
                        </div>
                        <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mb-6">
                            {!capturedImage ? (
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ ...videoConstraints, facingMode: { ideal: "user" } }} className="w-full h-full object-cover" />
                            ) : (
                                <img src={capturedImage} alt="selfie" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex space-x-6">
                            {!capturedImage ? (
                                <button onClick={capture} className="flex flex-col items-center gap-2"><div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full text-white shadow-lg flex items-center justify-center"><Camera size={38} /></div><span className="text-xs font-bold text-gray-500">CAPTURAR</span></button>
                            ) : (
                                <>
                                    <button onClick={() => setCapturedImage(null)} className="flex flex-col items-center gap-2"><div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 rounded-full text-gray-500 flex items-center justify-center"><RefreshCw size={24} /></div><span className="text-xs font-bold text-gray-400">REPETIR</span></button>
                                    <button onClick={confirmSelfie} className="flex flex-col items-center gap-2"><div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full text-white shadow-lg flex items-center justify-center"><Check size={42} /></div><span className="text-xs font-bold text-green-500">LISTO</span></button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Manual Form */}
                {step === 4 && (
                    <div className="space-y-6 animate-fade-in p-2">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-orange-500" />
                                Completa tus datos
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={scannedData?.fullName || ''}
                                        onChange={(e) => setScannedData(prev => ({ ...prev, fullName: e.target.value.toUpperCase() }))}
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                        placeholder="Ej: JUAN PÉREZ GARCÍA"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">CURP</label>
                                    <input
                                        type="text"
                                        value={scannedData?.curp || ''}
                                        onChange={(e) => setScannedData(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))}
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 font-mono dark:text-white"
                                        maxLength={18}
                                        placeholder="Ej: PEGJ850101HDFRRA09"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Dirección</label>
                                    <input
                                        type="text"
                                        value={scannedData?.address || ''}
                                        onChange={(e) => setScannedData(prev => ({ ...prev, address: e.target.value.toUpperCase() }))}
                                        className="w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white"
                                        placeholder="Calle, Número, Colonia, Ciudad"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                                <Phone className="w-5 h-5 text-blue-500" />
                                Contacto
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                                    <input
                                        type="email"
                                        value={contactData.email}
                                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                                        className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 dark:text-white`}
                                        placeholder="correo@ejemplo.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Teléfono</label>
                                    <input
                                        type="tel"
                                        value={contactData.phone}
                                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value.replace(/\D/g, '') })}
                                        maxLength={10}
                                        className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 font-mono dark:text-white`}
                                        placeholder="10 dígitos"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                                <div className="relative">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contraseña</label>
                                    <input
                                        type={passwordData.showPassword ? 'text' : 'password'}
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                        className={`w-full mt-1 px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-gray-50 dark:bg-slate-800 dark:text-white`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPasswordData({ ...passwordData, showPassword: !passwordData.showPassword })}
                                        className="absolute right-3 top-[34px]"
                                    >
                                        {passwordData.showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                    </button>
                                    {errors.password && <p className="text-red-500 text-xs mt-1">Mínimo 8 caracteres, mayúscula, minúscula y número.</p>}
                                </div>
                            </div>
                        </div>
                        <div className="pt-6">
                            <button
                                onClick={submitRegistration}
                                disabled={processing}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-6 h-6" />
                                        COMPLETAR REGISTRO
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-gray-400 mt-4 px-4">
                                Al dar clic en "Completar Registro" aceptas los <span className="text-blue-500">Términos y Condiciones</span> y el <span className="text-blue-500">Aviso de Privacidad</span> de RAITE Cooperativa.
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 10: Pending Approval */}
                {
                    step === 10 && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center py-8 animate-fade-in">
                            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-950/30 rounded-full flex items-center justify-center mb-6">
                                <Shield className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 dark:text-white">¡Registro Completado!</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                                Tu solicitud está siendo revisada. Te notificaremos cuando sea aprobada.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 max-w-md">
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    <strong>Estado:</strong> Pendiente de Aprobación
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                                    Tiempo estimado: 24-48 horas
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold"
                            >
                                Ir a Inicio
                            </button>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default Register;
