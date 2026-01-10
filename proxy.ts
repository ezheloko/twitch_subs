import { withAuth } from "next-auth/middleware"

const proxy = withAuth({
  pages: {
    signIn: "/admin",
  },
})

export default proxy

export const config = {
  matcher: ["/admin/:path*"],
}
