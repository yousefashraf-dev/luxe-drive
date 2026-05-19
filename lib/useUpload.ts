'use client';

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

export async function uploadWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  onProgress?.({ fileName: file.name, loaded: 0, total: 100, percent: 10 });

  const formData = new FormData();
  formData.append('file', file);

  onProgress?.({ fileName: file.name, loaded: 50, total: 100, percent: 50 });

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'فشل رفع الصورة');
  }

  const data = await res.json();

  onProgress?.({ fileName: file.name, loaded: 100, total: 100, percent: 100 });

  return data.url;
}
