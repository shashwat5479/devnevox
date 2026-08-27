export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/orders/:path*",
    "/maintenance/:path*",
    "/payments/:path*",
    "/messages/:path*",
    "/files/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
