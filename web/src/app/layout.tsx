import type { Metadata } from "next";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veymark — Physical proof you can't photograph",
  description:
    "Cryptographic chip and Solana passport for physical goods. Starting with auto parts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen antialiased">
                <Background />
                 <Navbar />
        {children}
      </body>
    </html>
  );
}