import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { DMSProvider } from './(main)/_dms-context'
import { CurrentUserProvider } from './(main)/context/CurrentUserContext'
import { UploadModalProvider } from './(main)/context/UploadModalContext'
import ToastContainer from './components/ui/Toast'
import { Toaster } from 'react-hot-toast';

const phetsarath = localFont({
  src: [
    {
      path: "../public/fonts/phetsarath/Phetsarath-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/phetsarath/Phetsarath-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-phetsarath",
  display: "swap",
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EDL-DMS - ລະບົບຄຸ້ມຄອງເອກະສານ",
  description: "Electronic Document Management System - Electricite du Laos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="lo"
      className={`${phetsarath.variable} ${notoSans.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Phetsarath:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Toaster />
        <DMSProvider>
          <CurrentUserProvider>
            <UploadModalProvider>
              {children}
            </UploadModalProvider>
            <ToastContainer />
          </CurrentUserProvider>
        </DMSProvider>
      </body>
    </html>
  );
}
