import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const locale = req.nextUrl.pathname.split('/')[2] || 'th';
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
}
