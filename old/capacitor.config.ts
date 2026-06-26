import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Shell nativo (WebView) para lojas. O Next.js continua hospedado em HTTPS
 * (Vercel, Firebase App Hosting, etc.) — esta app não empacota o build `standalone`.
 *
 * Release / lojas: `npm run cap:sync:deploy` (lê `capacitor/deployment-url`; veja
 * `deployment-url.example`). Ou defina `CAPACITOR_SERVER_URL` e `npm run cap:sync`.
 * No Android, `usesCleartextTraffic` fica explícito a `false` no manifest nativo.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "eco.ambientar.app",
  appName: "AmbientaR",
  webDir: "capacitor/www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          androidScheme: "https",
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#4CAF50",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#4CAF50",
    },
  },
};

export default config;
