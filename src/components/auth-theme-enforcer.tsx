"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Só usa usePathname/useTheme após mount no cliente.
 * Evita "Cannot read properties of null (reading 'useContext')" em usePathname
 * durante geração/SSR com Turbopack em alguns ambientes.
 */
export function AuthThemeEnforcer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AuthThemeEnforcerInner />;
}

function AuthThemeEnforcerInner() {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  useEffect(() => {
    const isAuthRoute = AUTH_PATHS.some((p) => (pathname ?? "").startsWith(p));
    if (isAuthRoute) {
      // Antes de logar, força sempre o tema CLARO (desktop e mobile).
      setTheme("light");
    }
  }, [pathname, setTheme]);

  return null;
}

