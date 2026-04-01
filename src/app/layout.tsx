import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase";
import { Inter } from "next/font/google";
import { ToastContainer } from "@/components/ToastContainer";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthThemeEnforcer } from "@/components/auth-theme-enforcer";
import { IframeRedirectBanner } from "@/components/iframe-redirect-banner";
import { SuppressExtensionErrors } from "@/components/suppress-extension-errors";
import { UnregisterServiceWorkerDev } from "@/components/unregister-service-worker-dev";

export const metadata: Metadata = {
  title: "AmbientaR",
  description:
    "ERP de gestão ambiental para pequenas empresas no estado de Minas Gerais.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4CAF50",
  viewportFit: "cover",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          inter.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UnregisterServiceWorkerDev />
          <AuthThemeEnforcer />
          <SuppressExtensionErrors />
          <IframeRedirectBanner />
          <FirebaseClientProvider>{children}</FirebaseClientProvider>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
