import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"], style: ["normal", "italic"] });
const sans = Poppins({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "SAVOR — A Film About Taste",
  description: "Ten exceptional dishes, carefully selected every day.",
  openGraph: {
    title: "SAVOR — A Film About Taste",
    description: "Ten exceptional dishes, carefully selected every day.",
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "SAVOR — A Film About Taste" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
