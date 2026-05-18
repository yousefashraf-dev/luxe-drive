'use client';

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

export function uploadWithProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

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
