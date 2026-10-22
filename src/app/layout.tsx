import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/components/shared/loading-state.css";
import { Providers } from "@/providers";
import favicon from "../../public/logo/favicon.png";

const inter = localFont({ src: "../assets/fonts/inter-variable.ttf", variable: "--font-inter", display: "swap", weight: "100 900", fallback: ["system-ui", "sans-serif"] });

export const metadata: Metadata = {
  title: "TalentAI",
  description: "TalentAI Platform",
  icons: { icon: [{ url: favicon.src, type: "image/png", sizes: `${favicon.width}x${favicon.height}` }] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
