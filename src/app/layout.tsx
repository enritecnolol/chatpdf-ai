import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ProvidersRQ from "../components/Provider";
import { Toaster } from "react-hot-toast";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChatPDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ProvidersRQ>
        <html lang="en">
          <body className={inter.className}>{children}</body>
          <Toaster />
        </html>
      </ProvidersRQ>
    </ClerkProvider>
  );
}
