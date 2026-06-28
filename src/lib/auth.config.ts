import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth config used by middleware
// Do NOT import db here. Only runtime providers go in main auth.ts.
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const localeMatch = nextUrl.pathname.match(/^\/(th|en)(\/|$)/);
      const locale = localeMatch ? localeMatch[1] : 'th';
      const pathname = nextUrl.pathname.replace(/^\/(th|en)/, '') || '/';

      const publicPaths = ['/', '/login', '/register', '/about'];
      const isPublic = publicPaths.includes(pathname);

      if (isPublic) {
        if (isLoggedIn && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
          return Response.redirect(new URL(`/${locale}/dashboard`, nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.locale = user.locale;
        token.employeeCode = user.employeeCode;
        token.phone = user.phone;
        token.avatar = user.avatar;
      }
      return token;
    },
  },
  providers: [], // populated in src/lib/auth.ts
} satisfies NextAuthConfig;
