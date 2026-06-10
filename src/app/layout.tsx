import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase";
import { ToastContainer } from "@/components/ToastContainer";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthThemeEnforcer } from "@/components/auth-theme-enforcer";
import { IframeRedirectBanner } from "@/components/iframe-redirect-banner";
import { SuppressExtensionErrors } from "@/components/suppress-extension-errors";
import { UnregisterServiceWorkerDev } from "@/components/unregister-service-worker-dev";
import { DEV_CLEAR_PWA_SW_SNIPPET } from "@/lib/dev-clear-pwa-sw-snippet";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        {process.env.NODE_ENV === "development" ? (
          <script
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: DEV_CLEAR_PWA_SW_SNIPPET }}
          />
        ) : null}
      </head>
      <body
        className={cn("min-h-screen bg-background font-body antialiased")}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UnregisterServiceWorkerDev />
          <Suspense fallback={null}>
            <AuthThemeEnforcer />
          </Suspense>
          <SuppressExtensionErrors />
          <IframeRedirectBanner />
          <FirebaseClientProvider>{children}</FirebaseClientProvider>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
