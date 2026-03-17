import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700"]
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "StackPay — Bitcoin-native payments on Stacks",
  description:
    "StackPay is a Bitcoin-native payment gateway on Stacks for sBTC, STX, and USDCx. Create invoices, subscriptions, and automated settlements with a developer-first experience."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${jetbrains.variable} bg-bg text-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
