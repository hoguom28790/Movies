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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hồ Phim - Xem Phim Miễn Phí",
  description: "Trang web xem phim trực tuyến chất lượng cao, cập nhật liên tục. Phim bộ, phim lẻ, hoạt hình, TV Shows từ nhiều quốc gia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, /* Responsive: Prevent zooming on touch */
  userScalable: false,
  viewportFit: "cover",
};

import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

import QueryProvider from "@/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${epilogue.variable}`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body className="bg-background text-foreground selection:bg-primary/30 antialiased font-sans">
        <QueryProvider>
          <DeviceProvider>
            <ThemeProvider>
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
