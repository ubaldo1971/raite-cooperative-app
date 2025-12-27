import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Scan, X, CheckCircle, AlertCircle } from 'lucide-react';
import { startScanner } from '../utils/scanner';
import { parseInePayload, formatForBackend } from '../utils/ineParser';

/**
 * Componente de escaneo de INE via QR/PDF417
 */
const INEScanner = ({ onScanComplete, onCancel }) => {
    const videoRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const stopScannerRef = useRef(null);

    useEffect(() => {
        // Cleanup al desmontar
        return () => {
            if (stopScannerRef.current) {
                stopScannerRef.current();
            }
        };
    }, []);

    const handleStartScan = async () => {
        setScanning(true);
        setError(null);
        setResult(null);
        setParsedData(null);

        try {
            stopScannerRef.current = await startScanner({
                videoEl: videoRef.current,
                onResult: (codeResult) => {
                    console.log("✅ Código detectado:", codeResult);
                    setResult(codeResult);
                    setScanning(false);

                    // Parsear datos del INE
                    const parsed = parseInePayload(codeResult.rawValue, codeResult.format);
                    console.log("📋 Datos parseados:", parsed);
                    setParsedData(parsed);
                },
                onError: (err) => {
                    console.error("❌ Error en escáner:", err);
                    setError(err.message || "Error al acceder a la cámara");
                    setScanning(false);
                }
            });
        } catch (err) {
            setError(err.message || "No se pudo iniciar el escáner");
            setScanning(false);
        }
    };

    const handleConfirm = () => {
        if (parsedData) {
            const formatted = formatForBackend(parsedData);
            onScanComplete?.(formatted);
        }
    };

    const handleRetry = () => {
        setResult(null);
        setParsedData(null);
        setError(null);
        handleStartScan();
    };

    const handleClose = () => {
        if (stopScannerRef.current) {
            stopScannerRef.current();
        }
        onCancel?.();
    };

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto p-4">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Scan className="w-8 h-8 text-orange-500" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                        Escanear INE
                    </h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Apunta al código QR o PDF417 del reverso de tu INE
                </p>
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700 mb-6">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                />

                {/* Scanning overlay */}
                {scanning && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Scanning animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-orange-500 rounded-2xl animate-pulse" />
                        </div>
                        {/* Scan line animation */}
                        <div className="absolute top-1/4 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-bounce" />
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                                🔍 Buscando código...
                            </span>
                        </div>
                    </div>
                )}

                {/* Not scanning state */}
                {!scanning && !result && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                        <button
                            onClick={handleStartScan}
                            className="flex flex-col items-center gap-3 p-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl hover:scale-105 transition-transform"
                        >
                            <Camera className="w-16 h-16 text-white" />
                            <span className="text-white font-bold text-lg">Iniciar Escáner</span>
                        </button>
                    </div>
                )}

                {/* Success state */}
                {result && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl text-center animate-scale-in">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                ¡Código detectado!
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Formato: {result.format}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div>
                        <p className="text-red-500 font-medium">Error</p>
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                </div>
            )}

            {/* Parsed data preview */}
            {parsedData && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <h3 className="font-bold mb-3 text-orange-500">📋 Datos detectados:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {parsedData.full_name && (
                            <div className="col-span-2">
                                <span className="text-gray-500">Nombre:</span>
                                <p className="font-medium">{parsedData.full_name}</p>
                            </div>
                        )}
                        {parsedData.curp && (
                            <div className="col-span-2">
                                <span className="text-gray-500">CURP:</span>
                                <p className="font-mono font-medium">{parsedData.curp}</p>
                            </div>
                        )}
                        {parsedData.clave_elector && (
                            <div className="col-span-2">
                                <span className="text-gray-500">Clave Elector:</span>
                                <p className="font-mono font-medium">{parsedData.clave_elector}</p>
                            </div>
                        )}
                        {parsedData.fecha_nacimiento && (
                            <div>
                                <span className="text-gray-500">Nacimiento:</span>
                                <p className="font-medium">{parsedData.fecha_nacimiento}</p>
                            </div>
                        )}
                        {parsedData.sexo && (
                            <div>
                                <span className="text-gray-500">Sexo:</span>
                                <p className="font-medium">{parsedData.sexo === 'H' ? 'Hombre' : 'Mujer'}</p>
                            </div>
                        )}
                        {parsedData.seccion && (
                            <div>
                                <span className="text-gray-500">Sección:</span>
                                <p className="font-medium">{parsedData.seccion}</p>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        Fuente: {parsedData.source}
                    </p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
                {result && parsedData && (
                    <>
                        <button
                            onClick={handleRetry}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Reintentar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Confirmar
                        </button>
                    </>
                )}

                {!result && (
                    <button
                        onClick={handleClose}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-200 dark:bg-slate-700 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                        Cancelar
                    </button>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-2">💡 <strong>Tips para mejor lectura:</strong></p>
                <ul className="space-y-1 text-left inline-block">
                    <li>• Usa el código <strong>PDF417</strong> (el grande del reverso)</li>
                    <li>• Buena iluminación sin reflejos</li>
                    <li>• Mantén la INE quieta y enfocada</li>
                </ul>
            </div>
        </div>
    );
};

export default INEScanner;
