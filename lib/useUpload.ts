'use client';

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

const CLOUD_NAME = 'dllaxor9r';
const UPLOAD_PRESET = 'zafah_unsigned';

export async function uploadWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  onProgress?.({ fileName: file.name, loaded: 0, total: 100, percent: 10 });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'cars');

  onProgress?.({ fileName: file.name, loaded: 30, total: 100, percent: 30 });

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
