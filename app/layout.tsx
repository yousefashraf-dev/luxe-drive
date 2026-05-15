import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
    <html lang="en" dir="ltr">
 <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZaFah" />
      </head>

<body className={`${inter.variable} ${cairo.variable} antialiased`} suppressHydrationWarning>  {children}
</body>
      
    </html>
  );
}
export const metadata = {
 title: 'زفه | Zafah - تأجير أحدث سيارات الزفاف والليموزين في مصر',
  description: 'منصة زفه بتوفرلك أفخم سيارات الزفاف (BMW, Mercedes, Range Rover) في المنوفية، طنطا، شبين الكوم، وبنها. احجز عربية فرحك، ونسق مع أفضل ميكب ارتست وقاعات أفراح وبوكيه ورد العروسة من مكان واحد.',
  keywords: [
    'تأجير سيارات زفاف مصر', 'زفه فرح', 'قاعه افراح', 'فستان فرح', 'ميكب افراح', 
    'عربيه فاجره لزفه', 'عربيات ايجار', 'بوكيه ورد عروسه', 'بدله عريس', 
    'صور بدل افراح', 'ساعه تنفع لفرح', 'كرفاته', 'ايجار سيارات المنوفية', 
    'ايجار سيارات طنطا', 'شبين الكوم', 'بنها'
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
  alternates: {
    canonical: 'https://zafah.vercel.app',
  },
 verification: {
    google: 'PhIJ4OU67qdJLxwSzLCnuoSjuRamCUZ_37Mex5IIGXM',
  },
};
  