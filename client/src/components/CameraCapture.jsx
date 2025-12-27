import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, Sparkles, AlertCircle } from 'lucide-react';

// Default constraints - forces higher resolution for better OCR
const getVideoConstraints = (useRearCamera = false) => ({
    width: { min: 1280, ideal: 1920, max: 4096 },
    height: { min: 720, ideal: 1080, max: 2160 },
    aspectRatio: { ideal: 16 / 9 },
    // Use 'ideal' instead of 'exact' to avoid camera errors on some devices
    facingMode: useRearCamera
        ? { ideal: "environment" }  // Prefer rear camera for documents
        : { ideal: "user" }         // Prefer front camera for selfie
});

const CameraCapture = ({ onCapture, label, instruction, isDocument = false }) => {
    const webcamRef = useRef(null);
    const [image, setImage] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const [useRearCamera, setUseRearCamera] = useState(isDocument);

    // Dynamic video constraints based on camera selection
    const videoConstraints = getVideoConstraints(useRearCamera);

    const toggleCamera = () => {
        setUseRearCamera(!useRearCamera);
    };

    const capture = useCallback(() => {
        setIsCapturing(true);
        const imageSrc = webcamRef.current.getScreenshot();
        setTimeout(() => {
            setImage(imageSrc);
            setIsCapturing(false);
        }, 300);
    }, [webcamRef]);

    const retake = () => {
        setImage(null);
    };

    const confirm = () => {
        onCapture(image);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto p-4 animate-scale-in">
            <div className="text-center mb-6">
                <h3 className="text-2xl font-black mb-1 flex items-center justify-center gap-2">
                    <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                        {label}
                    </span>
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{instruction}</p>
            </div>

            <div className={`relative w-full ${isDocument ? 'aspect-[3/2]' : 'aspect-[4/3]'} bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 mb-8 group`}>
                {!image ? (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={0.98}
                            videoConstraints={videoConstraints}
                            className="w-full h-full object-cover"
                            onUserMediaError={() => setCameraError(true)}
                            key={useRearCamera ? 'rear' : 'front'}
                        />
                        {/* Camera Switch Button */}
                        <button
                            onClick={toggleCamera}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            title={useRearCamera ? 'Cambiar a cámara frontal' : 'Cambiar a cámara trasera'}
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        {/* INE Document Guide Frame */}
                        {isDocument ? (
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Corner guides */}
                                <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-orange-500 rounded-tl-lg" />
                                <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-orange-500 rounded-tr-lg" />
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-orange-500 rounded-bl-lg" />
                                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-orange-500 rounded-br-lg" />
                                {/* Center guide text */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full">
                                        📋 Alinea tu INE dentro del marco
                                    </div>
                                </div>
                                {/* INE card outline */}
                                <div className="absolute inset-6 border-2 border-dashed border-white/40 rounded-xl" />
                            </div>
                        ) : (
                            /* Selfie guide - face circle */
                            <>
                                <div className="absolute inset-0 border-2 border-white/30 rounded-2xl m-6 pointer-events-none" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-white/40 rounded-full pointer-events-none" />
                            </>
                        )}
                    </>
                ) : (
                    <img src={image} alt="captured" className="w-full h-full object-cover animate-fade-in" />
                )}

                {/* Processing Overlay */}
                {isCapturing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex space-x-6 w-full justify-center">
                {!image ? (
                    <button
                        onClick={capture}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                            <Camera size={38} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">CAPTURAR</span>
                    </button>
                ) : (
                    <>
                        <button
                            onClick={retake}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-full text-gray-500 dark:text-gray-400 shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                                <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 tracking-wider">REPETIR</span>
                        </button>
                        <button
                            onClick={confirm}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                                <Check size={42} className="group-hover:scale-125 transition-transform" />
                            </div>
                            <span className="text-xs font-bold text-green-500 tracking-wider">CONFIRMAR</span>
                        </button>
                    </>
                )}
            </div>

            {/* Hint */}
            {!image && (
                <div className="mt-8 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-900/50 px-4 py-2 rounded-full border dark:border-slate-800">
                    <AlertCircle size={14} />
                    <span>Asegúrate de tener buena iluminación</span>
                </div>
            )}
        </div>
    );
};

export default CameraCapture;
