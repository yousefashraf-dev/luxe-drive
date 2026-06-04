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
        <meta name="apple-mobile-web-app-title" content="ZaFah" />
        <link rel="alternate" hrefLang="ar" href="https://zafah.vercel.app/" />
        <link rel="alternate" hrefLang="en" href="https://zafah.vercel.app/" />
        <link rel="alternate" hrefLang="x-default" href="https://zafah.vercel.app/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ZaFah - زفه",
            "url": "https://zafah.vercel.app",
            "description": "منصة زفه لتأجير سيارات الزفاف والليموزين الفاخرة، تنسيق بوكيهات الورد، ميكب ارتست، وقاعات الأفراح في المنوفية وطنطا وشبين الكوم وبنها والقاهرة",
            "inLanguage": ["ar", "en"],
            "alternateName": ["Zafah", "ZaFah Luxury Rental", "زفه", "زفة"],
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://zafah.vercel.app/?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })
        }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "ZaFah - زفه",
            "url": "https://zafah.vercel.app",
            "image": "/f30-refined.jpg",
            "description": "منصة زفه لتأجير سيارات الزفاف والليموزين الفاخرة، تنسيق بوكيهات الورد، ومشاوير الليموزين في المنوفية وطنطا وشبين الكوم وبنها والقاهرة",
            "telephone": "+20 100 000 0000",
            "priceRange": "$$",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "شبين الكوم",
              "addressRegion": "المنوفية",
              "addressCountry": "EG"
            },
            "sameAs": [
              "https://instagram.com/zafah.eg",
              "https://facebook.com/zafah.eg"
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
  metadataBase: new URL('https://zafah.vercel.app'),
  title: 'زفه | Zafah - تأجير أحدث سيارات الزفاف والليموزين في مصر',
  description: 'منصة زفه بتوفرلك أفخم سيارات الزفاف (BMW, Mercedes, Range Rover) في المنوفية، طنطا، شبين الكوم، وبنها والقاهرة. احجز عربية فرحك، ونسق مع أفضل ميكب ارتست وقاعات أفراح وبوكيه ورد العروسة وفساتين الزفاف وهدايا العرسان من مكان واحد. زفه لكل ما يخص ليلة العمر — سيارات، ورد، ميكب، بدل، تصوير، هدايا.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
  keywords: [
    'تأجير سيارات زفاف مصر', 'زفه فرح', 'قاعه افراح', 'فستان فرح', 'ميكب افراح',
    'عربيه فاجره لزفه', 'عربيات ايجار', 'ايجار سيارات المنوفية',
    'ايجار سيارات طنطا', 'شبين الكوم', 'بنها',
    'زفه', 'زفة', 'فرح', 'افراح', 'فستاين', 'فساتين زفاف',
    'بوكيه ورد عروسه', 'بوكيه ورد', 'تنسيق ورد', 'ورد طبيعى', 'ورد صناعى', 'زهور', 'باقة ورد',
    'ورود', 'توصيل ورد', 'ورود فرح', 'بوكيه فرح',
    'بدله عريس', 'كوشه افراح', 'كوشة', 'دعوة زفاف', 'هدايا عرسان',
    'سيارات الزفاف', 'عربيات فرح', 'ليموزين مصر', 'سياره فخمه',
    'ميكب ارتست مصر', 'تصوير زفاف', 'مصور فرح', 'قاعه افراح',
    'ساعة فرح', 'اكسسوارات عرائس', 'خواتم فرح', 'كرفاته',
    'زفه شبين الكوم', 'زفه منوفيه', 'زفه طنطا', 'زفه بنها', 'زفه دلتا',
    'زفه القاهرة', 'زفه ملكه', 'عربيه فاجره',
    'زفاف مصر', 'حجز عربية فرح', 'cars wedding', 'wedding',
    'zafah', 'zafa', 'zafah wedding', 'zaffa', 'zafa car',
    'wedding cars egypt', 'luxury car rental egypt',
    'wedding flowers', 'flower bouquet', 'flower arrangement cairo',
    'egypt wedding planner', 'bridal car', 'wedding limousine',
    'menoufia wedding', 'tanta wedding',
  ].join(', '),
  openGraph: {
    title: 'زفه | منصتك الأولى لكل ما يخص ليلة العمر',
    description: 'من العربية لحد بوكيه الورد، زفه معاك في المنوفية والقاهرة والدلتا.',
    url: 'https://zafah.vercel.app',
    siteName: 'Zafah',
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
    title: 'زفه | منصتك الأولى لكل ما يخص ليلة العمر',
    description: 'من العربية لحد بوكيه الورد، زفه معاك في المنوفية والقاهرة والدلتا.',
    images: ['/f30-refined.jpg'],
  },
  alternates: {
    canonical: 'https://zafah.vercel.app',
  },
 verification: {
    google: 'PhIJ4OU67qdJLxwSzLCnuoSjuRamCUZ_37Mex5IIGXM',
  },
};
  