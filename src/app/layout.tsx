import type { Metadata } from "next";
import { Inter, Poppins, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({ 
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({ 
  weight: ["400", "500", "600", "700"],
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voter Search - मतदार शोध सेवा",
  description: "Search for voter details by name or EPIC number in your ward. Find your polling station, voter ID, and election information for Brihanmumbai Municipal Corporation elections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${notoSansDevanagari.variable} font-sans`}>{children}</body>
    </html>
  );
}

