import type { Metadata, Viewport } from "next";
import { Inter, Epilogue } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DeviceProvider } from "@/contexts/DeviceContext";

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
      <body className="bg-[#0a0a0a] text-white selection:bg-primary/30 antialiased font-sans transition-colors duration-300">
        <QueryProvider>
          <DeviceProvider>
            <ThemeProvider>
              <AuthProvider>
                <LayoutWrapper>
                 {children}
              </LayoutWrapper>
              </AuthProvider>
            </ThemeProvider>
          </DeviceProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
