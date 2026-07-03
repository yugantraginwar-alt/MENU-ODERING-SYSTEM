import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/store/ThemeContext";
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
  title: "L'Ardoise QR | Smart QR Ordering",
  description: "Experience premium contactless dining. Scan, browse, order instantly.",
};

export default function CustomerRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-bg-primary text-fg-primary transition-colors duration-200">
        <ThemeProvider>
          <SocketProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
