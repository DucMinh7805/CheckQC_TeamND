import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
  preload: true,
});

export const metadata: Metadata = {
  title: "Trung tâm Nội Dung - Hệ thống kiểm tra và rà soát nội dung",
  description: "Hệ thống kiểm tra và rà soát nội dung dành cho Team Nội Dung, QC và Admin",
  icons: {
    icon: "/Logo Marvel Team.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={beVietnamPro.className}>
      <body
        suppressHydrationWarning
        className="bg-[#f4f7fb] dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 antialiased text-[15px] sm:text-[16px] selection:bg-slate-900 selection:text-white"
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
