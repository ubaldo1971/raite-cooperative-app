import { BrowserMultiFormatReader } from "@zxing/browser";

/**
 * INE Scanner - Escanea QR y PDF417 de credenciales INE
 * Usa BarcodeDetector nativo cuando está disponible, fallback a ZXing
 */

/**
 * Inicia escaneo QR/PDF417
 * @param {Object} options
 * @param {HTMLVideoElement} options.videoEl - Elemento video para mostrar cámara
 * @param {Function} options.onResult - Callback cuando detecta código
 * @param {Function} options.onError - Callback en caso de error
 * @returns {Function} Función para detener el escáner
 */
export async function startScanner({ videoEl, onResult, onError }) {
    // 1) Intento nativo: BarcodeDetector (más rápido en Chrome/Edge)
    const supportsBarcodeDetector = "BarcodeDetector" in window;

    if (supportsBarcodeDetector) {
        try {
            // Formatos soportados para INE
            const formats = ["qr_code", "pdf417", "aztec", "data_matrix"];
            const detector = new window.BarcodeDetector({ formats });

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { min: 1280, ideal: 1920, max: 4096 },
                    height: { min: 720, ideal: 1080, max: 2160 },
                    aspectRatio: { ideal: 16 / 9 }
                },
                audio: false,
            });

            videoEl.srcObject = stream;
            await videoEl.play();

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            let stopped = false;
            let frameCount = 0;

            const tick = async () => {
                if (stopped) return;
                frameCount++;

                // Solo procesar cada 5 frames para mejor rendimiento
                if (frameCount % 5 !== 0) {
                    requestAnimationFrame(tick);
                    return;
                }

                // Ajusta canvas al tamaño del video
                canvas.width = videoEl.videoWidth || 1280;
                canvas.height = videoEl.videoHeight || 720;

                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

                try {
                    const bitmap = await createImageBitmap(canvas);
                    const codes = await detector.detect(bitmap);

                    if (codes?.length) {
                        const best = pickBestCode(codes);
                        console.log("📱 Código detectado:", best.format, best.rawValue.substring(0, 50) + "...");
                        onResult?.(best);
                        stopStream(videoEl);
                        stopped = true;
                        return;
                    }
                } catch (e) {
                    console.warn("Error en detección:", e);
                }

                requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);

            return () => {
                stopped = true;
                stopStream(videoEl);
            };
        } catch (e) {
            console.warn("BarcodeDetector falló, usando ZXing:", e);
        }
    }

    // 2) Fallback: ZXing (más compatible pero más pesado)
    console.log("📷 Usando ZXing como fallback...");
    const reader = new BrowserMultiFormatReader();

    try {
        const controls = await reader.decodeFromVideoDevice(
            undefined, // cámara por defecto
            videoEl,
            (result, err) => {
                if (result) {
                    onResult?.({
                        rawValue: result.getText(),
                        format: result.getBarcodeFormat?.()?.toString() ?? "unknown",
                    });
                    controls.stop();
                }
                // err puede llegar constantemente mientras escanea, ignorar
            }
        );

        return () => controls.stop();
    } catch (e) {
        onError?.(e);
        throw e;
    }
}

/**
 * Detiene el stream de la cámara
 */
function stopStream(videoEl) {
    const stream = videoEl.srcObject;
    if (stream && stream.getTracks) {
        stream.getTracks().forEach((t) => t.stop());
    }
    videoEl.srcObject = null;
}

/**
 * Selecciona el mejor código detectado (prioriza PDF417)
 */
function pickBestCode(codes) {
    // Prioriza PDF417 si aparece (contiene todos los datos del INE)
    const pdf = codes.find((c) =>
        c.format === "pdf417" ||
        c.format === "PDF417" ||
        c.format?.toLowerCase?.() === "pdf417"
    );
    if (pdf) return { rawValue: pdf.rawValue, format: "pdf417" };

    // Luego QR
    const qr = codes.find((c) =>
        c.format === "qr_code" ||
        c.format === "QR_CODE" ||
        c.format?.toLowerCase?.() === "qr_code"
    );
    if (qr) return { rawValue: qr.rawValue, format: "qr_code" };

    // Si no, el primero que encuentre
    return { rawValue: codes[0].rawValue, format: codes[0].format };
}
