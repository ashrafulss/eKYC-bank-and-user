import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; // Import our smart navbar

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eKYC Bank Admin",
  description: "Bank Admin Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: replace with real session data eventually
  const user = {
    name: "Arif Rahman",
    role: "Checker",
    email: "arif@bank.com",
    avatar: "AR",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* The navbar handles hiding itself dynamically on the login page */}
        <Navbar user={user} />

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
