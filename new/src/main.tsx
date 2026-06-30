import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider } from "./auth/auth-provider.tsx";
import { authRouterContext } from "./auth/auth-router-context.ts";
import { router } from "./router.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} context={{ auth: authRouterContext }} />
    </AuthProvider>
  </StrictMode>,
);
