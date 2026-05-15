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
  title: 'ZAFHH Luxury | Elite Car Rental Egypt',
  description: 'ZAFHH Luxury (زفـه) - تأجير أفخم السيارات في مصر. أسطول متميز يضم BMW ومرسيدس بأفضل الأسعار وخدمة ملكية.',
  openGraph: {
    title: 'ZAFHH Luxury Rental',
    description: 'Experience the pinnacle of luxury driving in Egypt.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'aNw4-6fK-u-7HktWQ5SA2xXS3uy9dbYfIZMwCOvyIEo',
    other: {
      'google-site-verification': ['aNw4-6fK-u-7HktWQ5SA2xXS3uy9dbYfIZMwCOvyIEo'],
    },
  },
};