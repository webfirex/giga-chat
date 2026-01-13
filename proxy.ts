import { authProxy } from "@/lib/auth-proxy";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  return authProxy(req);
}

export const config = {
  matcher: [
    "/mod/:path*",
    "/admin/:path*",
    "/api/private/:path*",
  ],
};
