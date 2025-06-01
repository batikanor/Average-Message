import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import localFont from "next/font/local";
import "./globals.css";
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Hackathon winner project",
  description: "With this project, we will win the hackathon.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <MiniKitProvider>
        <body className="antialiased min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800">
          {/* Minimal layout: just render children centered on a dark background */}
          {children}
        </body>
      </MiniKitProvider>
    </html>
  );
}
