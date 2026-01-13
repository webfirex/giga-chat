"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_ROUTES = ["/login", "/signup"];

function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  return <>{children}</>;
}

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}
