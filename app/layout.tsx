import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Twitch Subscribers",
  description: "Визуализация подписчиков Twitch-канала",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${interTight.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
