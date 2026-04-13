// Updated at 2026-03-21T16:44:00+07:00 for deploy
import type { Metadata, Viewport } from "next";
import { Inter, Epilogue } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { StylePresetProvider } from "@/contexts/StylePresetContext";
import { ThemeProvider } from "@/components/theme-provider";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { LgTvDetector } from "@/components/layout/LgTvDetector";
import { ScrollPerformance } from "@/components/layout/ScrollPerformance";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "optional",
});

export const metadata: Metadata = {
  title: {
    default: "Hồ Phim - Thế Giới Phim Trong Tầm Tay",
    template: "%s | Hồ Phim"
  },
  description: "Cập nhật phim bộ, phim lẻ, hoạt hình và TV Shows mới nhất. Trải nghiệm xem phim mượt mà, chất lượng cao, hoàn toàn miễn phí.",
  keywords: ["xem phim", "phim moi", "phim hay", "hophim", "streaming", "phim bo", "phim le"],
  authors: [{ name: "Hồ Phim Team" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://hophim.com",
    siteName: "Hồ Phim",
    title: "Hồ Phim - Thế Giới Phim Trong Tầm Tay",
    description: "Trải nghiệm rạp phim tại gia với hàng ngàn đầu phim hấp dẫn, cập nhật mỗi ngày.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hồ Phim",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hồ Phim - Thế Giới Phim Trong Tầm Tay",
    description: "Xem phim bộ, phim lẻ mới nhất miễn phí.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, /* Responsive: Prevent zooming on touch */
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="preconnect" href="https://firebase.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-background text-foreground selection:bg-primary/30 antialiased font-sans cinema-grain">
        <ScrollPerformance />
        <QueryProvider>
          <DeviceProvider>
            <ThemeProvider 
              attribute="class" 
              defaultTheme="system" 
              enableSystem={true} 
              disableTransitionOnChange={false} 
              storageKey="hophim-theme"
            >
              <StylePresetProvider>
                <AuthProvider>
                  <LayoutWrapper>
                    {children}
                  </LayoutWrapper>
                  <LgTvDetector />
                </AuthProvider>
              </StylePresetProvider>
            </ThemeProvider>
          </DeviceProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
