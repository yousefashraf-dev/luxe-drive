import { Playfair_Display, Inter, Great_Vibes } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const signature = Great_Vibes({
  subsets: ['latin'],
  variable: '--font-signature',
  weight: ['400'],
});
export const metadata = {
  title: 'ZAFHH Luxury | أرقى تجربة لتأجير السيارات الفارهة في مصر',
  description: 'Zafhh Luxury Rental - اكتشف أسطولنا المميز من أحدث السيارات العالمية. خدمات تأجير سيارات فارهة في القاهرة بأفضل الأسعار.',
  keywords: 'Zafhh, Zafhh Luxury, تأجير سيارات فارهة, Rent luxury cars Egypt, BMW rental Cairo',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} ${signature.variable}`}>
        {children}
      </body>
    </html>
  );
}