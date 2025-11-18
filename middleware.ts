export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - /login (login page)
     * - /signup (signup page)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /sitemap.xml (static files)
     */
    "/((?!login|signup|api/auth|_next|favicon.ico|sitemap.xml).*)",
  ],
}
