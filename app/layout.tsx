import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { FavoritesProvider } from "./components/FavoritesProvider";
import "./globals.css";

const display = Noto_Serif_SC({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const sans = Noto_Sans_SC({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "余温｜品味此刻",
  description: "从温暖早餐到丰盛午餐，再配上一杯喜欢的饮料。收藏今日喜欢，记录每一份好味道。",
  openGraph: {
    title: "余温｜品味此刻",
    description: "收藏今日喜欢，记录每一份好味道。",
    images: [{ url: "/og-favorites.png", width: 1200, height: 630, alt: "余温今日喜欢" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "余温｜品味此刻",
    description: "收藏今日喜欢，记录每一份好味道。",
    images: ["/og-favorites.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${display.variable} ${sans.variable}`}>
        <FavoritesProvider>{children}</FavoritesProvider>
      </body>
    </html>
  );
}
