import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({ 
  subsets: ['arabic'], 
  variable: '--font-cairo',
  display: 'swap',
}); 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JOY DRIVE" />

        <link rel="alternate" hrefLang="ar" href="https://joy-ddrive.vercel.app/" />

        <link rel="alternate" hrefLang="en" href="https://joy-ddrive.vercel.app/" />

        <link rel="alternate" hrefLang="x-default" href="https://joy-ddrive.vercel.app/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "JOY DRIVE - جوي درايف",
            "url": "https://joy-ddrive.vercel.app",
            "description": "JOY DRIVE — Premium luxury car rental, wedding cars, flower bouquets, and chauffeur services across Egypt. BMW, Mercedes, Range Rover. Excellence Defined.",
            "inLanguage": ["ar", "en"],
            "alternateName": ["Joy Drive", "JOY DRIVE Luxury", "جوي درايف"],
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://joy-ddrive.vercel.app/?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "JOY DRIVE - جوي درايف",
            "url": "https://joy-ddrive.vercel.app",
            "image": "/f30-refined.jpg",
            "description": "JOY DRIVE — Premium luxury car rental, wedding cars, flower bouquets, and chauffeur services across Egypt. Excellence Defined.",
            "telephone": "+20 100 000 0000",
            "priceRange": "$$",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "شبين الكوم",
              "addressRegion": "المنوفية",
              "addressCountry": "EG"
            },
            "sameAs": [
              "https://instagram.com/joydrive.eg",
              "https://facebook.com/joydrive.eg"
            ],
            "areaServed": ["المنوفية", "القاهرة", "الجيزة", "طنطا", "بنها", "الإسكندرية"]
          })
        }} />
      </head>
      <body className={`${inter.variable} ${cairo.variable} antialiased`}>  
        <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </LanguageProvider>
        </ErrorBoundary>
      </body>
      
    </html>
  );
}
export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  metadataBase: new URL('https://joy-ddrive.vercel.app'),
  title: 'JOY DRIVE — Premium Luxury Car Rental & Services in Egypt',
  description: 'JOY DRIVE offers premium luxury car rental, wedding cars, flower bouquets, and chauffeur services across Egypt. BMW, Mercedes, Range Rover — Excellence Defined.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
  keywords: [
    'JOY DRIVE', 'joy drive', 'luxury car rental egypt',
    'wedding cars egypt', 'premium car rental', 'luxury limousine egypt',
    'bmw wedding car', 'mercedes wedding car', 'range rover wedding',
    'flower bouquet egypt', 'wedding flowers', 'chauffeur service egypt',
    'luxury experience', 'premium class', 'excellence defined',
    'تأجير سيارات فاخرة مصر', 'سيارات زفاف', 'عربيات فخمه',
    'جوي درايف', 'ليمزين مصر', 'خدمة لاكشري',
    'menoufia car rental', 'cairo luxury cars', 'egypt premium cars',
  ].join(', '),
  openGraph: {
    title: 'JOY DRIVE — Premium Luxury Car Rental & Services in Egypt',
    description: 'Experience excellence with JOY DRIVE. Premium wedding cars, luxury rental, flower bouquets, and chauffeur services across Egypt. BMW, Mercedes, Range Rover.',
    url: 'https://joy-ddrive.vercel.app',
    siteName: 'JOY DRIVE',
    images: [
      {
        url: '/f30-refined.jpg', 
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JOY DRIVE — Premium Luxury Car Rental & Services in Egypt',
    description: 'Experience excellence with JOY DRIVE. Premium wedding cars, luxury rental, flower bouquets, and chauffeur services across Egypt.',
    images: ['/f30-refined.jpg'],
  },
  alternates: {
    canonical: 'https://joy-ddrive.vercel.app',
  },
 verification: {
    google: 'PhIJ4OU67qdJLxwSzLCnuoSjuRamCUZ_37Mex5IIGXM',
  },
};
  