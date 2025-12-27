import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import {
    Loader2, ArrowLeft, CheckCircle2,
    IdCard, User, Sparkles, ChevronRight, FileCheck, Cloud
} from 'lucide-react';
import raiteLogo from '../assets/raite-logo.png';

/**
 * Registro con OCR usando Puter.js
 * OCR gratuito e ilimitado sin API keys
 */
const RegisterPuter = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [images, setImages] = useState({ front: null, back: null, selfie: null });
    const [ocrData, setOcrData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [puterReady, setPuterReady] = useState(false);

    // Load Puter.js script
    useEffect(() => {
        setIsLoaded(true);

        // Check if puter is already loaded
        if (window.puter) {
            setPuterReady(true);
            return;
        }

        // Load Puter.js script dynamically
        const script = document.createElement('script');
        script.src = 'https://js.puter.com/v2/';
        script.async = true;
        script.onload = () => {
            console.log('✅ Puter.js cargado');
            setPuterReady(true);
        };
        script.onerror = () => {
            console.error('❌ Error cargando Puter.js');
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    const handleCapture = (type) => async (imageSrc) => {
        setImages(prev => ({ ...prev, [type]: imageSrc }));

        if (type === 'selfie') {
            setStep(4);
            processWithPuterOCR({ ...images, selfie: imageSrc });
        } else {
            setStep(prev => prev + 1);
        }
    };

    // Convert base64 to Blob
    const base64ToBlob = (base64, mimeType = 'image/jpeg') => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    };

    // Process with Puter.js OCR
    const processWithPuterOCR = async (finalImages) => {
        setProcessing(true);
        console.log("🔍 Iniciando OCR con Puter.js...");

        try {
            let allText = '';

            // Process front image
            if (finalImages.front) {
                setProcessingMessage('Procesando INE Frente...');
                console.log('📄 Procesando frente...');

                const frontBlob = base64ToBlob(finalImages.front);
                const frontText = await window.puter.ai.img2txt(frontBlob);
                console.log('📝 Texto Frente:', frontText);
                allText += frontText + '\n';
            }

            // Process back image
            if (finalImages.back) {
                setProcessingMessage('Procesando INE Reverso...');
                console.log('📄 Procesando reverso...');

                const backBlob = base64ToBlob(finalImages.back);
                const backText = await window.puter.ai.img2txt(backBlob);
                console.log('📝 Texto Reverso:', backText);
                allText += backText + '\n';
            }

            // Extract data
            setProcessingMessage('Extrayendo datos...');
            const extractedData = extractINEData(allText);
            console.log('✅ Datos extraídos:', extractedData);

            setOcrData(extractedData);
            setProcessingMessage('¡Datos extraídos exitosamente!');

            setTimeout(() => {
                setProcessing(false);
                setStep(5);
            }, 1000);

        } catch (error) {
            console.error('❌ Error OCR:', error);
            setProcessingMessage('Error procesando imagen. Puedes ingresar los datos manualmente.');
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

    // Extract INE data from OCR text
    const extractINEData = (text) => {
        const allText = text.toUpperCase();
        const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

        console.log('📋 Líneas detectadas:', lines.length);
        console.log('📋 Primeras líneas:', lines.slice(0, 10));

        const excludeWords = [
            'INSTITUTO', 'NACIONAL', 'ELECTORAL', 'MEXICO', 'CREDENCIAL',
            'PARA', 'VOTAR', 'VIGENCIA', 'REGISTRO', 'FEDERAL', 'INE',
            'NOMBRE', 'DOMICILIO', 'NACIMIENTO', 'CLAVE', 'ELECTOR',
            'SECCION', 'SECCIÓN', 'CURP', 'EMISION', 'ESTADO', 'MUNICIPIO',
            'LOCALIDAD', 'FECHA', 'VIGENTE', 'HASTA', 'MEXICANA', 'ESTADOS',
            'UNIDOS', 'MEXICANOS', 'SEXO', 'EDAD'
        ];

        // CURP (18 chars)
        const curpMatch = allText.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/);
        const curp = curpMatch ? curpMatch[0] : '';
        console.log('🔍 CURP:', curp);

        // Derive birth date from CURP
        let fechaNacimiento = '';
        if (curp && curp.length >= 10) {
            const year = curp.substring(4, 6);
            const month = curp.substring(6, 8);
            const day = curp.substring(8, 10);
            const fullYear = parseInt(year) > 30 ? '19' + year : '20' + year;
            fechaNacimiento = `${day}/${month}/${fullYear}`;
            console.log('📅 Fecha:', fechaNacimiento);
        }

        // Clave de Elector
        const claveMatch = allText.match(/[A-Z]{6}\d{8}[HM]\d{3}/);
        const claveElector = (claveMatch && claveMatch[0] !== curp) ? claveMatch[0] : '';
        console.log('🔑 Clave:', claveElector);

        // Sección
        const seccionMatch = allText.match(/SECCI[OÓ]N[:\s]*(\d{4})/i);
        const seccion = seccionMatch ? seccionMatch[1] : '';
        console.log('📍 Sección:', seccion);

        // Name detection
        let fullName = '';
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('NOMBRE') && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (nextLine.length > 5 && !excludeWords.some(w => nextLine.includes(w))) {
                    fullName = nextLine;
                    break;
                }
            }
        }

        // Alternative name detection
        if (!fullName) {
            for (const line of lines) {
                if (excludeWords.some(w => line.includes(w))) continue;
                if (/\d/.test(line)) continue;
                if (line.length < 8 || line.length > 50) continue;

                const words = line.split(/\s+/).filter(w => w.length >= 2);
                if (words.length >= 2 && words.length <= 5) {
                    const allLetters = words.every(w => /^[A-ZÁÉÍÓÚÑÜ]+$/.test(w));
                    if (allLetters) {
                        fullName = words.join(' ');
                        console.log('👤 Nombre:', fullName);
                        break;
                    }
                }
            }
        }

        // Address
        let address = '';
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('DOMICILIO') && i + 1 < lines.length) {
                const addressLines = [];
                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    if (!lines[j].includes('SECCI') && !lines[j].includes('CLAVE')) {
                        addressLines.push(lines[j]);
                    }
                }
                address = addressLines.join(', ');
                break;
            }
        }

        // Sex from CURP
        const sexo = curp && curp.length >= 11 ? (curp[10] === 'H' ? 'H' : curp[10] === 'M' ? 'M' : '') : '';

        return {
            fullName: fullName.trim(),
            curp,
            claveElector,
            fechaNacimiento,
            seccion,
            address: address.trim(),
            sexo,
            dataFound: !!(fullName || curp || claveElector)
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

            console.log('📤 Enviando registro...');

            const response = await fetch('/api/users/register-ine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error en el registro');

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

                {step > 0 && step < 5 && (
                    <div className="px-4 pb-4">
                        <div className="flex justify-between items-center">
                            {progressSteps.map((s, i) => (
                                <div key={s.id} className="flex items-center flex-1">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500
                                        ${step >= s.id ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg' : 'bg-gray-200 dark:bg-slate-800 text-gray-500'}`}>
                                        <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    {i < progressSteps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all duration-500 
                                            ${step > s.id ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gray-200 dark:bg-slate-800'}`} />
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
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 mb-4 text-center text-white">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Cloud className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black">OCR Inteligente</h2>
                                    <p className="text-white/80 text-xs">Extracción automática con IA ✨</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800">
                            <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                Solo 4 pasos rápidos:
                            </p>
                            <div className="flex justify-between items-center gap-2">
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🪪</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">INE Frente</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🔄</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">INE Reverso</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">📸</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Selfie</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-center">
                                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">✅</span>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white">Listo</p>
                                </div>
                            </div>
                        </div>

                        {!puterReady && (
                            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 mb-4 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">Cargando servicio de OCR...</p>
                            </div>
                        )}

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
                            disabled={!acceptedTerms || !puterReady}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${acceptedTerms && puterReady
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90'
                                : 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed'
                                }`}
                        >
                            {puterReady ? 'Comenzar Verificación' : 'Cargando...'}
                        </button>
                    </div>
                )}

                {step === 1 && (
                    <CameraCapture onCapture={handleCapture('front')} label="INE - Frente" instruction="Alinea tu INE dentro del marco" isDocument={true} />
                )}

                {step === 2 && (
                    <CameraCapture onCapture={handleCapture('back')} label="INE - Reverso" instruction="Voltea tu INE y captura el reverso" isDocument={true} />
                )}

                {step === 3 && (
                    <CameraCapture onCapture={handleCapture('selfie')} label="Selfie de Verificación" instruction="Centra tu rostro en el círculo" isDocument={false} />
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative mb-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse flex items-center justify-center">
                                <Cloud className="w-12 h-12 text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg">
                                <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Procesando con IA</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center">{processingMessage}</p>
                    </div>
                )}

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
                                <input type="text" value={ocrData.fullName || ''} onChange={(e) => setOcrData({ ...ocrData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">CURP</label>
                                <input type="text" value={ocrData.curp || ''} onChange={(e) => setOcrData({ ...ocrData, curp: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono" maxLength={18} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Fecha de Nacimiento</label>
                                <input type="text" value={ocrData.fechaNacimiento || ''} onChange={(e) => setOcrData({ ...ocrData, fechaNacimiento: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800" placeholder="DD/MM/YYYY" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Clave de Elector</label>
                                <input type="text" value={ocrData.claveElector || ''} onChange={(e) => setOcrData({ ...ocrData, claveElector: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono" maxLength={18} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Sección</label>
                                <input type="text" value={ocrData.seccion || ''} onChange={(e) => setOcrData({ ...ocrData, seccion: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800" maxLength={4} />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Domicilio</label>
                                <textarea value={ocrData.address || ''} onChange={(e) => setOcrData({ ...ocrData, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none" rows={2} />
                            </div>
                        </div>

                        {images.selfie && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-4 border dark:border-slate-800 text-center">
                                <p className="text-xs text-gray-500 mb-2">Tu selfie:</p>
                                <img src={images.selfie} alt="Selfie" className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-green-500" />
                            </div>
                        )}

                        <button onClick={submitRegistration}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Confirmar y Registrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterPuter;
