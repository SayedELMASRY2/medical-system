"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // If we are on login or register, we do not need to check authentication
    const publicPaths = ["/login", "/register", "/"];
    const token = localStorage.getItem("access_token");

    if (!token && !publicPaths.includes(pathname)) {
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // Prevent flash of protected content
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    );
  }

  // If user is authenticated or on a public path, render children
  const publicPaths = ["/login", "/register", "/"];
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  
  if (!token && !publicPaths.includes(pathname)) {
     return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
