import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const display = Noto_Serif_SC({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const sans = Noto_Sans_SC({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "SAVOR｜品味此刻",
  description: "每天十道精心挑选的美食，打开即可探索。",
  openGraph: { title: "SAVOR｜品味此刻", description: "每天十道精心挑选的美食，打开即可探索。" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
