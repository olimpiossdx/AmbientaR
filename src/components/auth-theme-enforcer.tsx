"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function AuthThemeEnforcer() {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  useEffect(() => {
    const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (isAuthRoute) {
      // Antes de logar, força sempre o tema CLARO (desktop e mobile).
      setTheme("light");
    }
  }, [pathname, setTheme]);

  return null;
}

