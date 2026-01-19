import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CJ Product Discovery | Random Product Generator",
  description: "Discover unique products from CJ Dropshipping's vast catalog. One click. Infinite possibilities. Powered by n8n and Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
