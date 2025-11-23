import { withAuth } from "next-auth/middleware";

// Explicitly export the default middleware function
export default withAuth;

export const config = {
  matcher: [
    '/',            // dashboard home
    '/orders/:path*',
    '/imports/:path*',
    '/logs/:path*'
  ]
};