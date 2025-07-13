import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/',
  '/admin(.*)',
  '/settings(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/user-profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes to pass through
  if (isPublicRoute(req)) {
    return
  }
  
  // For protected routes (including root), ensure authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  // Protects all routes including api/trpc routes
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 