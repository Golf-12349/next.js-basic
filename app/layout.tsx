import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Noto_Sans } from "next/font/google";
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
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0E80-0EFF, U+200B-200D, U+25CC",
    },
  ],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EDL-DMS - ລະບົບຄຸ້ມຄອງເອກະສານ",
  description: "Electronic Document Management System - Electricite du Laos",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="lo"
      className={`${phetsarath.variable} ${inter.variable} ${notoSans.variable} h-full antialiased`}
    >
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
