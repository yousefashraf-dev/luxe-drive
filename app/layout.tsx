import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
 <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZaFah" />
      </head>

      <body className={`${playfair.variable} ${inter.variable} antialiased`}>{children}</body>
      
    </html>
  );
}
export const metadata = {
  title: 'زفه | Zafah - تأجير أحدث سيارات الزفاف والليموزين في مصر',
  description: 'منصة زفه بتوفرلك أفخم سيارات الزفاف (BMW, Mercedes, Range Rover) بأفضل الأسعار. احجز عربية فرحك دلوقت وسيب الباقي علينا.',
  keywords: 'تأجير سيارات زفاف مصر, ايجار سيارات ليموزين, زفه, ايجار سيارات مرسيدس فرح, BMW wedding car egypt',
  openGraph: {
    title: 'زفه | منصتك الأولى لتأجير سيارات المناسبات',
    description: 'أسطول متميز من السيارات الفاخرة لليلة العمر.',
    url: 'https://zafah.vercel.app', // اتأكد من اللينك بتاعك
    siteName: 'Zafah',
    images: [
      {
        url: '/f30-refined.jpg', // صورة بتعبر عن الموقع تظهر لما تشير اللينك
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  alternates: {
    canonical: 'https://zafah.vercel.app',
  },
 verification: {
    google: 'PhIJ4OU67qdJLxwSzLCnuoSjuRamCUZ_37Mex5IIGXM',
  },
};
  