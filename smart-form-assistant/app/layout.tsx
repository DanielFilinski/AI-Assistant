import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Form Assistant - AI-Powered Job Application",
  description: "Intelligent job application form with AI auto-fill, text improvement, and auto-save features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
