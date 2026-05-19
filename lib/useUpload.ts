'use client';

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

const CLOUD_NAME = 'dliaxor9r';
const UPLOAD_PRESET = 'zafah_unsigned';
const MAX_WIDTH = 1200;
const QUALITY = 0.8;

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

async function compressImage(file: File): Promise<File> {
  const img = await loadImage(file);

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

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', QUALITY);
  });

  if (!blob) throw new Error('فشل ضغط الصورة');

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}

export async function uploadWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  onProgress?.({ fileName: file.name, loaded: 0, total: 100, percent: 5 });

  let uploadFile: File;
  try {
    uploadFile = await compressImage(file);
    onProgress?.({ fileName: file.name, loaded: 40, total: 100, percent: 40 });
  } catch {
    uploadFile = file;
    onProgress?.({ fileName: file.name, loaded: 40, total: 100, percent: 40 });
  }

  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'cars');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل رفع الصورة');
  }

  const data = await res.json();

  onProgress?.({ fileName: file.name, loaded: 100, total: 100, percent: 100 });

  return data.secure_url;
}
