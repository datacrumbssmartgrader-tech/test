import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROOSTER'S DEN — Fine Pakistani Cuisine",
  description: "Rooster's Den — Fine Pakistani Cuisine. Experience the opulence of Mughal heritage through centuries of culinary tradition.",
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
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Cinzel:wght@400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Poppins:wght@300;400;500;600;700&family=Mulish:wght@300;400;500;600&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
