import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { createWorker } from 'tesseract.js';
import {
    Loader2, ArrowLeft, Shield, CheckCircle2, Camera,
    IdCard, User, Sparkles, ChevronRight, FileCheck,
    AlertCircle, Fingerprint
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0: Intro, 1: Front, 2: Back, 3: Selfie, 4: Processing, 5: Form
    const [images, setImages] = useState({ front: null, back: null, selfie: null });
    const [ocrData, setOcrData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const handleCapture = (type) => async (imageSrc) => {
        setImages(prev => ({ ...prev, [type]: imageSrc }));

        if (type === 'selfie') {
            setStep(4);
            processImages({ ...images, selfie: imageSrc });
        } else {
            setStep(prev => prev + 1);
        }
    };

    const processImages = async (finalImages) => {
        setProcessing(true);
        console.log("🔍 Iniciando procesamiento OCR...");

        try {
            // Preprocess images for better OCR
            const preprocessImage = async (imageBase64) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = img.width;
                        canvas.height = img.height;

                        // Draw original image
                        ctx.drawImage(img, 0, 0);

                        // Get image data
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        // Step 1: Convert to grayscale
                        const grayscale = [];
                        for (let i = 0; i < data.length; i += 4) {
                            const avg = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
                            grayscale.push(avg);
                        }

                        // Step 2: Calculate Otsu threshold for binarization
                        const histogram = new Array(256).fill(0);
                        grayscale.forEach(val => histogram[val]++);

                        const total = grayscale.length;
                        let sum = 0;
                        for (let i = 0; i < 256; i++) sum += i * histogram[i];

                        let sumB = 0, wB = 0, wF = 0, maxVar = 0, threshold = 128;
                        for (let i = 0; i < 256; i++) {
                            wB += histogram[i];
                            if (wB === 0) continue;
                            wF = total - wB;
                            if (wF === 0) break;
                            sumB += i * histogram[i];
                            const mB = sumB / wB;
                            const mF = (sum - sumB) / wF;
                            const variance = wB * wF * (mB - mF) * (mB - mF);
                            if (variance > maxVar) {
                                maxVar = variance;
                                threshold = i;
                            }
                        }

                        // Step 3: Apply binarization (black/white)
                        let j = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const newValue = grayscale[j++] > threshold ? 255 : 0;
                            data[i] = newValue;     // R
                            data[i + 1] = newValue; // G
                            data[i + 2] = newValue; // B
                        }

                        ctx.putImageData(imageData, 0, 0);
                        resolve(canvas.toDataURL('image/png')); // PNG for sharper text
                    };
                    img.src = imageBase64;
                });
            };

            console.log("⚙️ Preprocesando imágenes (binarización Otsu)...");
            const processedFront = await preprocessImage(finalImages.front);
            const processedBack = await preprocessImage(finalImages.back);
            console.log("✅ Imágenes preprocesadas");

            // Initialize Tesseract worker with Spanish and optimized settings
            console.log("🔧 Inicializando Tesseract con configuración optimizada...");
            const worker = await createWorker('spa');

            // Set parameters for better ID card recognition
            await worker.setParameters({
                tessedit_pageseg_mode: '6', // Assume uniform block of text
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ0123456789/-. ',
                preserve_interword_spaces: '1'
            });
            console.log("✅ Worker Tesseract configurado");

            // Process FRONT of INE
            console.log("📄 Procesando INE Frente...");
            const frontResult = await worker.recognize(processedFront);
            const frontText = frontResult.data.text;
            console.log("📝 Texto OCR (Frente):");
            console.log("=".repeat(50));
            console.log(frontText);
            console.log("=".repeat(50));

            // Process BACK of INE for CURP and address
            console.log("📄 Procesando INE Reverso...");
            const backResult = await worker.recognize(processedBack);
            const backText = backResult.data.text;
            console.log("📝 Texto OCR (Reverso):");
            console.log("=".repeat(50));
            console.log(backText);
            console.log("=".repeat(50));

            // Combined text for better extraction
            const allText = frontText + "\n" + backText;
            console.log("📋 Texto combinado:", allText);

            // Extract data using multiple patterns for Mexican INE
            const extracted = extractINEData(frontText, backText);
            console.log("✅ Datos extraídos:", extracted);

            setOcrData(extracted);
            await worker.terminate();
            console.log("🔒 Worker terminado");

        } catch (err) {
            console.error("❌ OCR Error:", err);
            // Provide helpful fallback with instructions
            setOcrData({
                fullName: "",
                curp: "",
                address: "",
                ocrFailed: true,
                errorMessage: err.message
            });
        } finally {
            setProcessing(false);
            setStep(5);
        }
    };

    // Helper function to extract INE data with multiple regex patterns
    const extractINEData = (frontText, backText) => {
        const allText = (frontText + "\n" + backText).toUpperCase();

        // Words to EXCLUDE from name extraction (INE header/logo text)
        const excludeWords = [
            'INSTITUTO', 'NACIONAL', 'ELECTORAL', 'MEXICO', 'MÉXICO',
            'CREDENCIAL', 'PARA', 'VOTAR', 'VIGENCIA', 'REGISTRO',
            'FEDERAL', 'ELECTORES', 'INE', 'NOMBRE', 'DOMICILIO',
            'CLAVE', 'ELECTOR', 'CURP', 'ESTADO', 'MUNICIPIO', 'SECCION',
            'LOCALIDAD', 'EMISION', 'VIGENTE', 'PERMANENTE'
        ];

        // Clean text for name extraction (remove common OCR noise)
        const cleanText = (text) => {
            return text
                .replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        // ===== NOMBRE EXTRACTION =====
        let fullName = "";

        // Pattern 1: After "NOMBRE" label
        const nombreMatch = frontText.match(/NOMBRE\s*[:\s]*\n?([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i);
        if (nombreMatch) {
            fullName = cleanText(nombreMatch[1]);
        }

        // Pattern 2: Look for APELLIDO PATERNO / MATERNO / NOMBRE(S) format
        if (!fullName) {
            const apellidoP = frontText.match(/PATERNO[:\s]*\n?([A-ZÁÉÍÓÚÑ]+)/i)?.[1];
            const apellidoM = frontText.match(/MATERNO[:\s]*\n?([A-ZÁÉÍÓÚÑ]+)/i)?.[1];
            const nombres = frontText.match(/NOMBRE\(?S?\)?[:\s]*\n?([A-ZÁÉÍÓÚÑ\s]+)/i)?.[1];
            if (apellidoP || nombres) {
                fullName = [apellidoP, apellidoM, nombres?.trim()].filter(Boolean).join(" ");
            }
        }

        // Pattern 3: Lines that look like names (2-4 words, all caps, not excluded words)
        if (!fullName) {
            const lines = frontText.split('\n').map(l => cleanText(l)).filter(l => l.length > 5);
            for (const line of lines) {
                const words = line.split(' ').filter(w => w.length >= 2);
                // Check if line has 2-4 words and none are in exclude list
                if (words.length >= 2 && words.length <= 4) {
                    const isValidName = words.every(w => !excludeWords.includes(w));
                    if (isValidName) {
                        fullName = words.join(' ');
                        break;
                    }
                }
            }
        }

        // Filter out any remaining excluded words from name
        if (fullName) {
            const nameWords = fullName.split(' ').filter(w => !excludeWords.includes(w) && w.length >= 2);
            fullName = nameWords.join(' ');
        }

        // ===== CURP EXTRACTION (18 characters: AAAA######HAAAAA##) =====
        const curpPattern = /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/;
        let curp = allText.match(curpPattern)?.[0];

        // Alternative CURP patterns
        if (!curp) {
            curp = allText.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}\d{2}/)?.[0];
        }
        if (!curp) {
            // Look for CURP label then value
            curp = allText.match(/CURP[:\s]*([A-Z0-9]{18})/)?.[1];
        }

        // ===== ADDRESS EXTRACTION =====
        let address = "";
        // Pattern 1: After DOMICILIO label
        const domMatch = backText.match(/DOMICILIO[:\s]*\n?(.+?)(?:\n|CLAVE|SECCI|$)/is);
        if (domMatch) {
            address = domMatch[1].replace(/\n/g, ' ').trim();
        }
        // Pattern 2: Look for street patterns
        if (!address) {
            const streetMatch = backText.match(/((?:C[\.:\s]|AV[\.:\s]|CALLE|BLVD)[^\n]+)/i);
            address = streetMatch?.[1]?.trim() || "";
        }

        // ===== CLAVE DE ELECTOR (18 alphanumeric) =====
        let claveElector = allText.match(/CLAVE[:\s]*(?:DE[:\s]*)?ELECTOR[:\s]*([A-Z0-9]{18})/i)?.[1];
        if (!claveElector) {
            // Look for 18-char alphanumeric that's not CURP
            const matches = allText.match(/\b[A-Z]{6}[0-9]{8}[A-Z0-9]{4}\b/g);
            if (matches) {
                claveElector = matches.find(m => m !== curp) || "";
            }
        }

        // ===== FECHA DE NACIMIENTO (DD/MM/YYYY or similar) =====
        let fechaNac = frontText.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/)?.[1];
        if (!fechaNac) {
            // Look after NACIMIENTO label
            fechaNac = frontText.match(/NACIMIENTO[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i)?.[1];
        }

        // ===== SECCION (4 digits) =====
        let seccion = allText.match(/SECCI[OÓ]N[:\s]*(\d{4})/i)?.[1];
        if (!seccion) {
            // Sometimes it's just 4 digits near SECCION
            seccion = allText.match(/SECC[:\s]*(\d{4})/i)?.[1];
        }

        console.log("🔎 Extracción detallada:", {
            fullName: fullName || "(no encontrado)",
            curp: curp || "(no encontrado)",
            address: address || "(no encontrado)",
            claveElector: claveElector || "(no encontrado)",
            fechaNac: fechaNac || "(no encontrado)",
            seccion: seccion || "(no encontrado)"
        });

        return {
            fullName: fullName || "",
            curp: curp || "",
            address: address || "",
            claveElector: claveElector || "",
            fechaNacimiento: fechaNac || "",
            seccion: seccion || "",
            // Indicate if data was actually found
            dataFound: !!(fullName || curp || address)
        };
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

            console.log('📤 Enviando registro:', {
                fullName: payload.fullName,
                curp: payload.curp,
                address: payload.address
            });

            const response = await fetch('/api/users/register-ine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log("✅ Registro exitoso:", result.user);
                // Store user in localStorage for dashboard access
                localStorage.setItem('raite_user', JSON.stringify(result.user));
                localStorage.setItem('raite_user_id', result.user.id);
                navigate('/dashboard');
            } else {
                console.error("❌ Error en registro:", result.message);
                // Still navigate but show error could be added
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("❌ Network Error:", error);
            navigate('/dashboard');
        }
    };

    // Progress steps configuration
    const progressSteps = [
        { id: 1, label: 'INE Frente', icon: IdCard, completed: step > 1 },
        { id: 2, label: 'INE Reverso', icon: FileCheck, completed: step > 2 },
        { id: 3, label: 'Selfie', icon: Camera, completed: step > 3 },
        { id: 4, label: 'Verificar', icon: CheckCircle2, completed: step > 4 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 flex flex-col transition-colors duration-500">
            {/* Animated Header */}
            <header className={`bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800 transition-all duration-500 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                <div className="p-4 flex items-center justify-between">
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="flex items-center gap-2">
                        <img
                            src={raiteLogo}
                            alt="RAITE"
                            className="h-8 w-auto object-contain animate-logo-10s rounded-sm"
                        />
                        <span className="font-bold text-lg bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent border-l border-gray-200 dark:border-slate-700 pl-2">
                            {step === 5 ? 'Confirmar Datos' : 'Registro de Socio'}
                        </span>
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
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
                                        ${step === s.id ? 'scale-110 animate-pulse-glow' : ''}
                                    `}>
                                        <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    {i < progressSteps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all duration-500 ${step > s.id ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gray-200 dark:bg-slate-800'}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2">
                            {progressSteps.map(s => (
                                <span key={s.id} className={`text-[10px] sm:text-xs font-medium ${step >= s.id ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            <div className="flex-1 p-4 overflow-auto">
                {/* Step 0: Intro */}
                {step === 0 && (
                    <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {/* Compact Hero */}
                        <div className="bg-hero-gradient rounded-2xl p-4 mb-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Fingerprint className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black text-white">Validemos tu Identidad</h2>
                                    <p className="text-white/80 text-xs">Proceso seguro y encriptado ✨</p>
                                </div>
                            </div>
                        </div>

                        {/* Compact 3 Steps - Horizontal */}
                        <div className={`bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                Solo 3 pasos rápidos:
                            </p>
                            <div className="flex justify-between items-center gap-2">
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🪪</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">INE</p>
                                    <p className="text-[10px] text-gray-400">Frente y reverso</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 dark:to-purple-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">📸</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Selfie</p>
                                    <p className="text-[10px] text-gray-400">Verificación</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-950/30 dark:to-teal-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">✅</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">¡Listo!</p>
                                    <p className="text-[10px] text-gray-400">Confirmar datos</p>
                                </div>
                            </div>
                        </div>

                        {/* Compact Privacy Section */}
                        <div className={`bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-3 mb-4 border border-blue-100 dark:border-blue-900/30`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <h4 className="font-semibold text-gray-800 dark:text-white text-xs">Aviso de Privacidad</h4>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                                RAITE Cooperativa tratará tus datos (INE, selfie) para verificar tu identidad y registrarte como socio.
                                <button
                                    type="button"
                                    onClick={() => setShowPrivacyModal(true)}
                                    className="text-blue-500 font-semibold ml-1"
                                >Ver más</button>
                            </p>

                            {/* Consent Checkbox */}
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
                                        : 'border-orange-400 bg-white dark:bg-slate-800 animate-pulse-orange'
                                        }`}>
                                        {acceptedTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                    Acepto el <span className="text-blue-500 font-semibold">Aviso de Privacidad</span>
                                </span>
                            </label>
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={() => setStep(1)}
                            disabled={!acceptedTerms}
                            className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${acceptedTerms
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-xl active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Camera className="w-5 h-5" />
                            {acceptedTerms ? 'Comenzar Verificación' : 'Acepta para continuar'}
                            {acceptedTerms && <ChevronRight className="w-5 h-5" />}
                        </button>

                        {/* Compact Trust badges */}
                        <div className="flex justify-center gap-3 mt-4 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" />Encriptado</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" />Seguro</span>
                        </div>
                    </div>
                )}

                {/* Privacy Modal */}
                {showPrivacyModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in border dark:border-slate-800">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Shield className="w-6 h-6" />
                                    Aviso de Privacidad Integral
                                </h3>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[50vh] text-sm text-gray-600 dark:text-gray-300 space-y-4">
                                <p>
                                    <strong>RAITE Cooperativa de Transportistas S.C. de R.L.</strong>, con domicilio en [Dirección], es responsable del tratamiento de los datos personales que nos proporcione.
                                </p>

                                <h4 className="font-bold text-gray-800 dark:text-white">¿Para qué usamos sus datos?</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Verificación de identidad mediante INE y reconocimiento facial</li>
                                    <li>Registro y administración como socio cooperativista</li>
                                    <li>Distribución de beneficios y utilidades</li>
                                    <li>Comunicaciones sobre asambleas y votaciones</li>
                                    <li>Cumplimiento de obligaciones fiscales y laborales</li>
                                </ul>

                                <h4 className="font-bold text-gray-800 dark:text-white">Datos que recabamos</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Nombre completo, CURP, dirección</li>
                                    <li>Fotografía de INE (frente y reverso)</li>
                                    <li>Fotografía facial (selfie)</li>
                                    <li>Datos de contacto</li>
                                </ul>

                                <h4 className="font-bold text-gray-800 dark:text-white">Derechos ARCO</h4>
                                <p>
                                    Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, envíe su solicitud a: <span className="text-blue-500">privacidad@raite.coop</span>
                                </p>

                                <h4 className="font-bold text-gray-800 dark:text-white">Transferencia de datos</h4>
                                <p>
                                    Sus datos no serán transferidos a terceros sin su consentimiento, excepto en los casos previstos por la Ley.
                                </p>

                                <p className="text-xs text-gray-400">
                                    Última actualización: Diciembre 2024
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t dark:border-slate-800 flex gap-3">
                                <button
                                    onClick={() => setShowPrivacyModal(false)}
                                    className="flex-1 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => { setAcceptedTerms(true); setShowPrivacyModal(false); }}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Aceptar Términos
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <CameraCapture
                        label="INE Frente"
                        instruction="Alinea el frente de tu INE en el recuadro"
                        onCapture={handleCapture('front')}
                        isDocument={true}
                    />
                )}

                {step === 2 && (
                    <CameraCapture
                        label="INE Reverso"
                        instruction="Alinea el reverso de tu INE"
                        onCapture={handleCapture('back')}
                        isDocument={true}
                    />
                )}

                {step === 3 && (
                    <CameraCapture
                        label="Selfie"
                        instruction="Mira a la cámara y sonríe"
                        onCapture={handleCapture('selfie')}
                        isDocument={false}
                    />
                )}

                {/* Step 4: Processing */}
                {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-full mt-20">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse-glow">
                                <Loader2 className="animate-spin text-white" size={48} />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-icon-bounce">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-xl font-bold text-gray-800 dark:text-white mt-6">Validando información...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Nuestra IA está leyendo tu documento</p>

                        <div className="flex gap-1 mt-6">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}

                {/* Step 5: Form */}
                {step === 5 && (
                    <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Header - changes based on OCR success */}
                        {ocrData.dataFound ? (
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-4 mb-6 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">¡Verificación Exitosa!</p>
                                    <p className="text-white/80 text-sm">Revisa y confirma tus datos</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-4 mb-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Ingresa tus datos manualmente</p>
                                        <p className="text-white/80 text-sm">No pudimos leer tu INE automáticamente</p>
                                    </div>
                                </div>
                                <p className="text-white/90 text-xs mt-2 bg-white/10 rounded-lg p-2">
                                    💡 <strong>Tip:</strong> Para mejores resultados, asegúrate de que la INE esté bien iluminada, enfocada y sin reflejos.
                                </p>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border dark:border-slate-800">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-orange-500" />
                                <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                                    {ocrData.dataFound ? 'Verifica tu información' : 'Completa tu información'}
                                </span>
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre Completo
                                        {ocrData.fullName ? (
                                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border dark:border-green-800/20">✓ Detectado</span>
                                        ) : (
                                            <span className="text-xs bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full border dark:border-orange-800/20">Ingresa manualmente</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={ocrData.fullName}
                                        placeholder="Ej: JUAN PÉREZ GARCÍA"
                                        className={`w-full border-2 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all dark:text-white ${ocrData.fullName ? 'border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10' : 'border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        CURP
                                        {ocrData.curp ? (
                                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border dark:border-green-800/20">✓ Detectado</span>
                                        ) : (
                                            <span className="text-xs bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full border dark:border-orange-800/20">Ingresa manualmente</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={ocrData.curp}
                                        placeholder="Ej: PEGJ850101HDFRRA09"
                                        maxLength={18}
                                        className={`w-full border-2 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all dark:text-white font-mono uppercase ${ocrData.curp ? 'border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10' : 'border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10'
                                            }`}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">18 caracteres alfanuméricos</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Domicilio
                                        {ocrData.address ? (
                                            <span className="text-xs bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border dark:border-green-800/20">✓ Detectado</span>
                                        ) : (
                                            <span className="text-xs bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full border dark:border-orange-800/20">Ingresa manualmente</span>
                                        )}
                                    </label>
                                    <textarea
                                        defaultValue={ocrData.address}
                                        placeholder="Ej: Calle Reforma #123, Col. Centro, CDMX, CP 06000"
                                        className={`w-full border-2 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all dark:text-white resize-none ${ocrData.address ? 'border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10' : 'border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10'
                                            }`}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <IdCard className="w-4 h-4 text-blue-500" />
                                    Documentos capturados
                                </h4>
                                <div className="flex gap-3">
                                    <div className="relative group">
                                        <img src={images.front} className="w-20 h-14 object-cover rounded-lg bg-gray-200 border-2 border-gray-200 group-hover:border-orange-500 transition-colors" alt="INE Frente" />
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-orange-500 text-white px-2 rounded-full">Frente</span>
                                    </div>
                                    <div className="relative group">
                                        <img src={images.back} className="w-20 h-14 object-cover rounded-lg bg-gray-200 border-2 border-gray-200 group-hover:border-pink-500 transition-colors" alt="INE Reverso" />
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-pink-500 text-white px-2 rounded-full">Reverso</span>
                                    </div>
                                    <div className="relative group">
                                        <img src={images.selfie} className="w-14 h-14 object-cover rounded-full bg-gray-200 border-2 border-gray-200 group-hover:border-purple-500 transition-colors" alt="Selfie" />
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-purple-500 text-white px-2 rounded-full">Selfie</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={submitRegistration}
                                className="mt-8 w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Confirmar y Registrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
