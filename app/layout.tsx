import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Lao } from "next/font/google";
import "./globals.css";
import { DMSProvider } from './(main)/_dms-context'
import ToastContainer from './components/ui/Toast'
import { Toaster } from 'react-hot-toast';

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const notoSansLao = Noto_Sans_Lao({
  variable: "--font-noto-sans-lao",
  subsets: ["lao"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard Lao",
  description: "Dashboard interface in Lao language",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lo"
      className={`${notoSans.variable} ${notoSansLao.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster />
        <DMSProvider>
          {children}
          <ToastContainer />
        </DMSProvider>
      </body>
    </html>
  )
}
