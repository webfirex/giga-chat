"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_ROUTES = ["/login", "/signup", "/success"];
const PUBLIC_LOGIN_PREFIXES = ["/admin/login", "/mod/login"];

function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname() || '/';
  const router = useRouter();

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_LOGIN_PREFIXES.some((route) => pathname === route);

  useEffect(() => {
    if (status === "loading") return;

    // 1. Redirect if not logged in
    if (status === "unauthenticated" && !isPublicRoute) {
      router.replace("/signup");
      return;
    }

    // 2. Role-Based Logic (Only if authenticated)
    if (status === "authenticated") {
      const role = session?.user?.role;

      // Admin logic: Can ONLY access /admin/...
      if (role === "ADMIN" && !pathname.startsWith("/admin")) {
        router.replace("/admin/");
      }

      // Mod logic: Can ONLY access /mod/...
      else if (role === "MOD" && !pathname.startsWith("/mod")) {
        router.replace("/mod/chat");
      }

      // User logic: Cannot access /admin or /mod
      else if (role === "USER") {
        if (pathname.startsWith("/admin") || pathname.startsWith("/mod")) {
          router.replace("/chat"); // Redirect to user home
        }
      }
    }
  }, [status, pathname, session, router, isPublicRoute]);

  // Handle Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Prevent flicker: if we are redirecting, show nothing or a loader
  const role = session?.user?.role;
  if (status === "authenticated" && !isPublicRoute) {
    if (role === "ADMIN" && !pathname.startsWith("/admin")) return null;
    if (role === "MOD" && !pathname.startsWith("/mod")) return null;
    if (role === "USER" && (pathname.startsWith("/admin") || pathname.startsWith("/mod"))) return null;
  }

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}