import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WalletProvider } from "@/context/WalletContext";
import { NotificationCenterProvider } from "@/context/NotificationCenterContext";

export const metadata: Metadata = {
  title: "RemitX AI - AI-Powered Cross-Border Payments",
  description: "Voice and text-powered AI agent for seamless cross-border payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <WalletProvider>
            <NotificationCenterProvider>
              {children}
            </NotificationCenterProvider>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}