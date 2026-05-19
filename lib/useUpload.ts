'use client';

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

const MAX_WIDTH = 1200;
const QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('انتهت مهلة تحميل الصورة'));
    }, 30000);

    img.onload = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('فشل قراءة الصورة'));
    };

    img.src = url;
  });
}

function drawOnCanvas(img: HTMLImageElement): HTMLCanvasElement {
  let { width, height } = img;
  if (width > MAX_WIDTH) {
    height = Math.round((height * MAX_WIDTH) / width);
    width = MAX_WIDTH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function canvasToBase64(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('فشل تحويل الصورة'));
          reader.readAsDataURL(blob);
        } else {
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
            resolve(dataUrl);
          } catch {
            reject(new Error('فشل ضغط الصورة على هذا الجهاز'));
          }
        }
      },
      'image/jpeg',
      QUALITY
    );
  });
}

export async function uploadWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  onProgress?.({ fileName: file.name, loaded: 0, total: 100, percent: 10 });

  const img = await loadImage(file);
  onProgress?.({ fileName: file.name, loaded: 30, total: 100, percent: 30 });

  const canvas = drawOnCanvas(img);
  onProgress?.({ fileName: file.name, loaded: 50, total: 100, percent: 50 });

  const base64 = await canvasToBase64(canvas);
  onProgress?.({ fileName: file.name, loaded: 100, total: 100, percent: 100 });

  return base64;
}
