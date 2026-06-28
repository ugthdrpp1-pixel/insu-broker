import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { authConfig } from './auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      employeeCode?: string | null;
      locale?: string;
      phone?: string | null;
      avatar?: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    role: string;
    employeeCode?: string | null;
    locale?: string;
    phone?: string | null;
    avatar?: string | null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: 'database' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await db.auditLog.create({
          data: {
            actorId: user.id,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeCode: user.employeeCode,
          locale: user.locale,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.employeeCode = token.employeeCode as string | null | undefined;
        session.user.locale = (token.locale as string | undefined) ?? 'th';
        session.user.phone = token.phone as string | null | undefined;
        session.user.avatar = token.avatar as string | null | undefined;
      }
      return session;
    },
  },
});
