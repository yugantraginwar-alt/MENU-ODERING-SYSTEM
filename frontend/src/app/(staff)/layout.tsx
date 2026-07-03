import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { SocketProvider } from "@/store/SocketContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "L'Ardoise POS | Management Terminals Hub",
  description: "Unified POS and restaurant management console.",
};

export default function StaffRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-200 antialiased font-sans">
        <SocketProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </SocketProvider>
      </body>
    </html>
  );
}
