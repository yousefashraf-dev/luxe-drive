import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['italic', 'normal'],
  weight: ['400', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // ده السطر اللي بيحل المشكلة
}) {
  return (
    <html lang="en">
      <body 
        className={`${playfair.variable} ${inter.variable}`} 
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}