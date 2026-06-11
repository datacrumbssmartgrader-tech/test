import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI-Restaurant",
  description: "AI-Restaurant — Smart QR-based in-restaurant ordering system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Cinzel:wght@400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500;600;700&family=Mulish:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
