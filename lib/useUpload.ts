'use client';

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

const MAX_WIDTH = 1200;
const QUALITY = 0.85;

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

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

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('فشل ضغط الصورة'));
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل قراءة الصورة'));
    };

    img.src = url;
  });
}

export async function uploadWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const compressed = await compressImage(file);

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', compressed, file.name.replace(/\.[^.]+$/, '.jpg'));

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          fileName: file.name,
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.url) {
          resolve(data.url);
        } else {
          reject(new Error(data.error || 'فشل الرفع'));
        }
      } catch {
        reject(new Error('خطأ في استجابة الخادم'));
      }
    };

    xhr.onerror = () => reject(new Error('فشل الاتصال بالخادم'));
    xhr.onabort = () => reject(new Error('تم إلغاء الرفع'));

    xhr.timeout = 120000;
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}
