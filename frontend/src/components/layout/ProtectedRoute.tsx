"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Helper to decode JWT token client-side
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const publicPaths = ["/login", "/register", "/"];
    const token = localStorage.getItem("access_token");

    if (!token && !publicPaths.includes(pathname)) {
      router.replace("/login");
      return;
    }

    if (token) {
      const decoded = parseJwt(token);
      const userRole = decoded?.role || "PATIENT";

      // Protect /admin routes — Admin ONLY
      if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }

      // Protect /doctor routes — Doctor or Admin ONLY
      if (pathname.startsWith("/doctor") && !["DOCTOR", "ADMIN"].includes(userRole)) {
        router.replace("/dashboard");
        return;
      }
    }

    setIsAuthenticated(true);
  }, [pathname, router]);

  // Prevent flash of protected content
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  const publicPaths = ["/login", "/register", "/"];
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  if (!token && !publicPaths.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
