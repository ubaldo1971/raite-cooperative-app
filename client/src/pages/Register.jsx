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

    // Capture back photo and immediately scan for barcode
    const captureBack = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);

            // Stop live scanner
            if (stopScanRef.current) {
                stopScanRef.current();
            }

            // Immediately scan the captured image
            setIsScanning(true);
            setScanStatus('Analizando código...');

            const found = await scanBarcodeFromImage(imageSrc);

            // Check if we found meaningful data (CURP/Name), or just verification URL
            const hasFullData = scannedData?.curp || scannedData?.fullName;
            const isVerificationOnly = found && !hasFullData && scannedData?.hasQrVerification;

            if (found && hasFullData) {
                console.log("✅ Barcode data extracted locally (PDF417)");
                setIsScanning(false);
            } else {
                if (isVerificationOnly) {
                    console.log("⚠️ Local scan found verification QR but no personal data. Trying backend for OCR...");
                    setScanStatus('Cargando datos del servidor...');
                } else {
                    console.log("⚠️ No local barcode found, trying backend...");
                    setScanStatus('Procesando en servidor...');
                }

                // Call backend for OCR/barcode processing
                try {
                    const response = await fetch('/api/decode-barcode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageSrc })
                    });

                    const result = await response.json();
                    console.log("📡 Backend response:", result);

                    if (result.success && result.data?.dataFound) {
                        console.log("✅ Backend extracted data:", result.data);
                        // Map backend response to our format
                        setScannedData({
                            fullName: result.data.fullName || '',
                            curp: result.data.curp || '',
                            claveElector: result.data.claveElector || '',
                            fechaNacimiento: result.data.fechaNacimiento || '',
                            seccion: result.data.seccion || '',
                            sexo: result.data.sexo || '',
                            address: result.data.address || '',
                            source: 'BACKEND_OCR',
                            // Preserve verification data if we had it
                            hasQrVerification: scannedData?.hasQrVerification || false,
                            verificationUrl: scannedData?.verificationUrl || ''
                        });
                        setScanStatus('¡Datos extraídos!');
                    } else if (isVerificationOnly) {
                        console.log("⚠️ Backend found no extra data. Keeping verification info.");
                        setScanStatus('Verificada (Datos manuales)');
                    } else {
                        console.log("⚠️ Backend found no data");
                        setScanStatus('No se detectó código');
                    }
                } catch (err) {
                    console.error("❌ Backend error:", err);
                    if (isVerificationOnly) {
                        setScanStatus('Verificada (Datos manuales)');
                    } else {
                        setScanStatus('Error de conexión');
                    }
                }

                setIsScanning(false);
            }
        }
    };

    // Confirm front photo and go to back
    const confirmFront = () => {
        setImages(prev => ({ ...prev, front: capturedImage }));
        setCapturedImage(null);
        setStep(2);
    };

    // Helper: Check if barcode content has useful data (not just a URL)
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

            // Fallback to ZXing - Method 2: MultiFormat with hints
            console.log("📷 Trying ZXing MultiFormat with hints...");
            try {
                const hints = new Map();
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.PDF_417,
                    BarcodeFormat.QR_CODE,
                    BarcodeFormat.DATA_MATRIX,
                    BarcodeFormat.AZTEC
                ]);
                hints.set(DecodeHintType.TRY_HARDER, true);

                const reader = new BrowserMultiFormatReader(hints);
                img.style.display = 'none';
                if (!img.parentNode) document.body.appendChild(img);

                const result = await reader.decodeFromImageElement(img);
                document.body.removeChild(img);

                if (result) {
                    console.log("✅ MultiFormat with hints found:", result.getText()?.substring(0, 50));
                    handleBarcodeDetected(result.getText(), result.getBarcodeFormat?.()?.toString() || 'unknown');
                    return true;
                }
            } catch (zxingErr1) {
                console.warn("ZXing MultiFormat failed:", zxingErr1.message);
                if (img.parentNode) img.parentNode.removeChild(img);
            }

            // Fallback to ZXing - Method 2: decodeFromCanvas with enhanced contrast
            console.log("🎨 Trying ZXing with canvas processing...");
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Enhance contrast for better barcode detection
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // Convert to grayscale
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    // Increase contrast
                    const enhanced = avg > 128 ? 255 : 0;
                    data[i] = data[i + 1] = data[i + 2] = enhanced;
                }
                ctx.putImageData(imageData, 0, 0);

                const reader = new BrowserMultiFormatReader();
                const result = await reader.decodeFromCanvas(canvas);

                if (result) {
                    console.log("✅ ZXing canvas method found:", result.getText()?.substring(0, 50));
                    handleBarcodeDetected(result.getText(), result.getBarcodeFormat?.()?.toString() || 'unknown');
                    return true;
                }
            } catch (zxingErr2) {
                console.warn("ZXing canvas method failed:", zxingErr2.message);
            }

            // Fallback - Method 3: Try URL directly
            console.log("🔗 Trying ZXing decodeFromImageUrl...");
            try {
                const reader = new BrowserMultiFormatReader();
                const result = await reader.decodeFromImageUrl(imageSrc);
                if (result) {
                    console.log("✅ ZXing URL method found:", result.getText()?.substring(0, 50));
                    handleBarcodeDetected(result.getText(), result.getBarcodeFormat?.()?.toString() || 'unknown');
                    return true;
                }
            } catch (zxingErr3) {
                console.warn("ZXing URL method failed:", zxingErr3.message);
            }

            // If we have a QR URL from INE as fallback, use it (better than nothing)
            if (qrUrlFallback) {
                console.log("📎 Using INE QR URL fallback:", qrUrlFallback);
                // Parse the INE QR URL to extract what we can
                handleBarcodeDetected(qrUrlFallback, 'QR_CODE_INE');
                return true;
            }

        } catch (error) {
            console.error("❌ Barcode scan failed:", error);
        }

        console.log("❌ No barcode found after all attempts");
        return false;
    };

    // Start continuous scanning (background while showing camera)
    const startBarcodeScanning = async () => {
        setIsScanning(true);
        setScanStatus('Buscando código...');

        try {
            // Only use native BarcodeDetector for continuous scanning
            if ("BarcodeDetector" in window) {
                const formats = ["qr_code", "pdf417", "aztec", "data_matrix"];
                const detector = new window.BarcodeDetector({ formats });

                let stopped = false;
                let frameCount = 0;

                const tick = async () => {
                    if (stopped || !webcamRef.current) return;
                    frameCount++;

                    if (frameCount % 10 !== 0) {
                        requestAnimationFrame(tick);
                        return;
                    }

                    try {
                        const video = webcamRef.current.video;
                        if (video && video.readyState === 4) {
                            const bitmap = await createImageBitmap(video);
                            const codes = await detector.detect(bitmap);

                            if (codes?.length) {
                                const best = codes.find(c =>
                                    c.format?.toLowerCase() === 'pdf417' ||
                                    c.format?.toLowerCase() === 'qr_code'
                                ) || codes[0];

                                setScanStatus('¡Código detectado!');
                                handleBarcodeDetected(best.rawValue, best.format);
                                stopped = true;
                                return;
                            }
                        }
                    } catch (e) {
                        // Silently continue
                    }

                    requestAnimationFrame(tick);
                };

                requestAnimationFrame(tick);
                stopScanRef.current = () => { stopped = true; };
            } else {
                // No native support - will scan on capture
                console.log("📷 BarcodeDetector not available, will scan on capture");
                setScanStatus('Captura para escanear');
            }
        } catch (error) {
            console.error("Scanner init error:", error);
            setScanStatus('Captura para escanear');
        }
    };

    // Handle barcode detection
    const handleBarcodeDetected = (rawValue, format) => {
        console.log("📊 Barcode detected!");
        console.log("📊 Format:", format);
        console.log("📊 Raw value (full):", rawValue);
        console.log("📊 Raw value length:", rawValue?.length);

        // Parse the data
        const parsed = parseInePayload(rawValue, format);
        const formatted = formatForBackend(parsed);

        console.log("📋 Parsed result:", parsed);
        console.log("📋 Formatted data:", formatted);

        // Even if parsing didn't get specific fields, store that we found a code
        const dataToStore = {
            ...formatted,
            rawDetected: true,
            rawValue: rawValue?.substring(0, 200), // Store first 200 chars for debugging
            rawFormat: format
        };

        // If we got any useful data (CURP at minimum), use it
        if (formatted.curp || formatted.fullName || formatted.claveElector) {
            setScannedData(formatted);
        } else {
            // Store raw data so we can show something was detected
            setScannedData(dataToStore);
        }

        setIsScanning(false);

        // Detect document type based on data
        if (formatted.curp && formatted.claveElector) {
            setDocumentType('ine');
        } else if (rawValue.toLowerCase().includes('licencia') || rawValue.includes('LIC')) {
            setDocumentType('license');
        } else {
            setDocumentType('ine'); // Default to INE
        }
    };

    // Confirm back photo - capture and scan for barcode
    const confirmBack = async () => {
        const imageSrc = webcamRef.current?.getScreenshot() || capturedImage;
        setImages(prev => ({ ...prev, back: imageSrc }));
        setCapturedImage(null);

        // Stop scanner if running
        if (stopScanRef.current) {
            stopScanRef.current();
        }

        // If we haven't already scanned data, try to scan from the captured image
        if (!scannedData && imageSrc) {
            setScanStatus('Analizando imagen...');
            setIsScanning(true);

            const found = await scanBarcodeFromImage(imageSrc);
            setIsScanning(false);

            if (found) {
                console.log("✅ Data extracted from back image");
            } else {
                console.log("⚠️ No barcode found in back image");
            }
        }

        setStep(3); // Go to selfie
    };

    // Capture and confirm selfie
    const confirmSelfie = () => {
        const imageSrc = webcamRef.current?.getScreenshot() || capturedImage;
        setImages(prev => ({ ...prev, selfie: imageSrc }));
        setCapturedImage(null);
        setStep(4); // Processing

        // Short processing state then go to form
        setTimeout(() => {
            setStep(5);
        }, 1500);
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
            const endpoint = documentType === 'license'
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

            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('userId', result.user.id);

            setProcessing(false);
            setStep(10);

        } catch (err) {
            setProcessing(false);
            alert(err.message || 'Error al registrar. Por favor intenta de nuevo.');
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
                        <span className="text-[8px] text-gray-400 ml-1">v2.6</span>
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
                                    <h2 className="text-xl font-black">Validemos tu Identidad</h2>
                                    <p className="text-white/80 text-xs">Escaneo automático de código ✨</p>
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
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Reverso + Código</p>
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
                                Documento - Frente
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Captura el frente de tu INE o Licencia</p>
                        </div>

                        <div className="relative w-full aspect-[3/2] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mb-6">
                            {!capturedImage ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={0.95}
                                        videoConstraints={videoConstraints}
                                        className="w-full h-full object-cover"
                                        key={useRearCamera ? 'rear' : 'front'}
                                    />
                                    <button
                                        onClick={() => setUseRearCamera(!useRearCamera)}
                                        className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                    {/* Corner guides */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-orange-500 rounded-tl-lg" />
                                        <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-orange-500 rounded-tr-lg" />
                                        <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-orange-500 rounded-bl-lg" />
                                        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-orange-500 rounded-br-lg" />
                                    </div>
                                </>
                            ) : (
                                <img src={capturedImage} alt="captured" className="w-full h-full object-cover" />
                            )}
                        </div>

                        <div className="flex space-x-6">
                            {!capturedImage ? (
                                <button onClick={capture} className="flex flex-col items-center gap-2">
                                    <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                        <Camera size={38} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 tracking-wider">CAPTURAR</span>
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => setCapturedImage(null)} className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full text-gray-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                            <RefreshCw size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 tracking-wider">REPETIR</span>
                                    </button>
                                    <button onClick={confirmFront} className="flex flex-col items-center gap-2">
                                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                            <Check size={42} />
                                        </div>
                                        <span className="text-xs font-bold text-green-500 tracking-wider">CONFIRMAR</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Back Photo + Barcode Scan */}
                {step === 2 && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-black mb-1 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                                <Scan className="w-6 h-6 text-blue-500" />
                                Documento - Reverso
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Captura el reverso con el código de barras visible
                            </p>
                        </div>

                        <div className="relative w-full aspect-[3/2] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700 mb-6">
                            {!capturedImage ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={0.95}
                                        videoConstraints={videoConstraints}
                                        className="w-full h-full object-cover"
                                        onLoadedData={() => {
                                            if (!isScanning && !scannedData) {
                                                startBarcodeScanning();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => setUseRearCamera(!useRearCamera)}
                                        className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                    {/* Barcode guide */}
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-64 h-32 border-2 border-blue-400 border-dashed rounded-xl flex items-center justify-center">
                                            <span className="text-blue-400 text-xs bg-black/50 px-2 py-1 rounded">Código aquí</span>
                                        </div>
                                    </div>
                                    {/* Scanning indicator */}
                                    {isScanning && (
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <span className="bg-blue-500/80 text-white px-4 py-2 rounded-full text-xs flex items-center justify-center gap-2 mx-auto w-max">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                {scanStatus}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <img src={capturedImage} alt="back captured" className="w-full h-full object-cover" />
                                    {/* Scanning status on captured image */}
                                    {isScanning && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl text-center">
                                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
                                                <p className="font-bold text-gray-800 dark:text-white">Analizando código...</p>
                                                <p className="text-xs text-gray-500 mt-1">Buscando datos en la imagen</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Success overlay */}
                                    {scannedData && (
                                        <div className={`absolute inset-0 ${scannedData.curp || scannedData.fullName ? 'bg-green-500/20' : 'bg-yellow-500/20'} backdrop-blur-sm flex items-center justify-center`}>
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-2xl text-center max-w-xs">
                                                {scannedData.curp || scannedData.fullName ? (
                                                    <>
                                                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                                        <p className="font-bold text-green-600 dark:text-green-400">¡Datos extraídos!</p>
                                                        {scannedData.curp && (
                                                            <p className="text-xs text-gray-500 mt-1 font-mono">{scannedData.curp}</p>
                                                        )}
                                                    </>
                                                ) : scannedData.hasQrVerification ? (
                                                    <>
                                                        <CheckCircle2 className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                                                        <p className="font-bold text-yellow-600 dark:text-yellow-400">INE Verificada</p>
                                                        <p className="text-xs text-gray-500 mt-1">QR de verificación detectado</p>
                                                        <p className="text-xs text-gray-400 mt-2">Ingresa tus datos manualmente</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                                                        <p className="font-bold text-yellow-600 dark:text-yellow-400">Código detectado</p>
                                                        <p className="text-xs text-gray-500 mt-1">No se pudieron extraer datos</p>
                                                        <p className="text-xs text-gray-400 mt-2">Ingresa tus datos manualmente</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Data preview if scanned */}
                        {scannedData && (
                            <div className={`w-full rounded-xl p-4 mb-4 border ${scannedData.curp || scannedData.fullName
                                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                                : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                                }`}>
                                <h4 className={`font-bold mb-2 flex items-center gap-2 ${scannedData.curp || scannedData.fullName
                                    ? 'text-green-700 dark:text-green-400'
                                    : 'text-yellow-700 dark:text-yellow-400'
                                    }`}>
                                    {scannedData.curp || scannedData.fullName ? (
                                        <><CheckCircle2 className="w-4 h-4" /> Datos detectados</>
                                    ) : scannedData.hasQrVerification ? (
                                        <><CheckCircle2 className="w-4 h-4" /> INE verificada via QR</>
                                    ) : (
                                        <><AlertCircle className="w-4 h-4" /> Código detectado</>
                                    )}
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {scannedData.fullName && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500 text-xs">Nombre:</span>
                                            <p className="font-medium dark:text-white">{scannedData.fullName}</p>
                                        </div>
                                    )}
                                    {scannedData.curp && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500 text-xs">CURP:</span>
                                            <p className="font-mono font-medium dark:text-white">{scannedData.curp}</p>
                                        </div>
                                    )}
                                    {scannedData.hasQrVerification && !scannedData.curp && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500 text-xs">URL de verificación:</span>
                                            <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{scannedData.verificationUrl}</p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                                ⚠️ Ingresa tus datos manualmente en el siguiente paso
                                            </p>
                                        </div>
                                    )}
                                    {!scannedData.curp && !scannedData.fullName && !scannedData.hasQrVerification && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                                No se pudieron extraer datos del código.
                                                Ingresa tus datos manualmente.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Capture/Confirm buttons */}
                        <div className="flex space-x-6">
                            {!capturedImage ? (
                                <button onClick={captureBack} className="flex flex-col items-center gap-2">
                                    <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                        <Camera size={38} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 tracking-wider">CAPTURAR</span>
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => { setCapturedImage(null); setScannedData(null); }} className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full text-gray-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                            <RefreshCw size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 tracking-wider">REPETIR</span>
                                    </button>
                                    <button onClick={confirmBack} disabled={isScanning} className="flex flex-col items-center gap-2">
                                        <div className={`w-20 h-20 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all ${isScanning ? 'bg-gray-400' : 'bg-gradient-to-br from-green-500 to-teal-500'}`}>
                                            {isScanning ? <Loader2 size={32} className="animate-spin" /> : <Check size={42} />}
                                        </div>
                                        <span className="text-xs font-bold text-green-500 tracking-wider">
                                            {isScanning ? 'ANALIZANDO' : 'CONFIRMAR'}
                                        </span>
                                    </button>
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
                                Selfie de Verificación
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Centra tu rostro en el círculo</p>
                        </div>

                        <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mb-6">
                            {!capturedImage ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={0.95}
                                        videoConstraints={{ ...videoConstraints, facingMode: { ideal: "user" } }}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Face guide */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-4 border-white/50 rounded-full pointer-events-none" />
                                </>
                            ) : (
                                <img src={capturedImage} alt="selfie" className="w-full h-full object-cover" />
                            )}
                        </div>

                        <div className="flex space-x-6">
                            {!capturedImage ? (
                                <button onClick={capture} className="flex flex-col items-center gap-2">
                                    <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                        <Camera size={38} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 tracking-wider">CAPTURAR</span>
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => setCapturedImage(null)} className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full text-gray-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                            <RefreshCw size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 tracking-wider">REPETIR</span>
                                    </button>
                                    <button onClick={confirmSelfie} className="flex flex-col items-center gap-2">
                                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                                            <Check size={42} />
                                        </div>
                                        <span className="text-xs font-bold text-green-500 tracking-wider">CONFIRMAR</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Processing */}
                {step === 4 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className={`w-24 h-24 bg-gradient-to-br ${theme.from} ${theme.to} rounded-full flex items-center justify-center mb-6 animate-pulse`}>
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-center dark:text-white">Procesando...</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            {scannedData ? 'Datos del código listos' : 'Preparando formulario'}
                        </p>
                    </div>
                )}

                {/* Step 5: Form - Verify Data */}
                {step === 5 && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Status banner */}
                        {scannedData?.curp ? (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-400">Datos extraídos del código</p>
                                    <p className="text-sm text-green-600 dark:text-green-500">Verifica que sean correctos</p>
                                </div>
                            </div>
                        ) : scannedData?.hasQrVerification ? (
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-yellow-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">INE verificada vía QR</p>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Ingresa tus datos personales manualmente</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-orange-700 dark:text-orange-400">Ingresa tus datos manualmente</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-500">No se detectó código en el documento</p>
                                </div>
                            </div>
                        )}

                        {/* Form fields */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-500" />
                                {scannedData?.curp ? 'Verifica tu información' : 'Completa tu información'}
                            </h3>

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

                            {/* Document photos preview */}
                            <div className="flex gap-2 mt-4">
                                {images.front && (
                                    <div className="flex-1 relative">
                                        <img src={images.front} alt="Frente" className="w-full h-16 object-cover rounded-lg" />
                                        <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Frente</span>
                                    </div>
                                )}
                                {images.back && (
                                    <div className="flex-1 relative">
                                        <img src={images.back} alt="Reverso" className="w-full h-16 object-cover rounded-lg" />
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

                        <button
                            onClick={() => setStep(6)}
                            className={`w-full py-4 bg-gradient-to-r ${theme.from} ${theme.to} text-white rounded-xl font-bold hover:opacity-90`}
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step 6: Contact Information */}
                {step === 6 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-4 mb-4 text-center text-white">
                            <Mail className="w-12 h-12 mx-auto mb-2" />
                            <h2 className="text-xl font-black">Datos de Contacto</h2>
                            <p className="text-white/80 text-xs">Necesarios para tu cuenta</p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border dark:border-slate-800 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
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
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step 7: Password */}
                {step === 7 && (
                    <div className="space-y-4 animate-fade-in">
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5"
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
                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Step 8: Bank Data (Optional) */}
                {step === 8 && (
                    <div className="space-y-4 animate-fade-in">
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
                                    placeholder="Ej: BBVA, Santander"
                                />
                            </div>
                        </div>

                        <button
                            onClick={validateBankData}
                            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold"
                        >
                            Continuar
                        </button>
                        <button
                            onClick={() => setStep(9)}
                            className="w-full py-3 text-gray-600 dark:text-gray-400 text-sm"
                        >
                            Omitir por ahora
                        </button>
                    </div>
                )}

                {/* Step 9: Emergency Contact */}
                {step === 9 && (
                    <div className="space-y-4 animate-fade-in">
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
                            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2"
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

                {/* Step 10: Pending Approval */}
                {step === 10 && (
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
                )}
            </div>
        </div>
    );
};

export default Register;
