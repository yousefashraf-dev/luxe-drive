import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });

    const body = new FormData();
    body.append('file', blob, file.name);
    body.append('upload_preset', 'ml_default');
    body.append('transformation', 'w_1200,c_limit,q_auto,f_webp');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body }
    );

    if (!res.ok) {
      const errMsg = await res.text();
      console.error('Cloudinary upload failed:', errMsg);
      return NextResponse.json({ error: `Cloudinary: ${errMsg}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.secure_url });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    const message = err instanceof Error ? err.message : 'خطأ في رفع الصورة';
    return NextResponse.json({ error: `Cloudinary: ${message}` }, { status: 500 });
  }
}
