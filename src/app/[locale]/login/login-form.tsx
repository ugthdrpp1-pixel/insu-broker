'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { LocaleSwitcher } from '@/components/nav/locale-switcher';

type Messages = {
  welcomeBack: string;
  signInDescription: string;
  email: string;
  password: string;
  signIn: string;
  invalidCredentials: string;
  demoAccounts: string;
  adminAccount: string;
  managerAccount: string;
  agentAccount: string;
};

export function LoginForm({
  locale,
  action,
  messages: m,
  error,
}: {
  locale: string;
  action: (fd: FormData) => Promise<void>;
  messages: Messages;
  error: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold">Insu Broker</span>
        </div>
        <LocaleSwitcher currentLocale={locale} />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{m.welcomeBack}</h1>
        <p className="text-muted-foreground mt-2">{m.signInDescription}</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {m.invalidCredentials}
        </div>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="space-y-2">
          <Label htmlFor="email">{m.email}</Label>
          <Input id="email" name="email" type="email" required autoFocus defaultValue="agent@insu.co.th" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{m.password}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPwd ? 'text' : 'password'}
              required
              defaultValue="password123"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg">
          {m.signIn}
        </Button>
      </form>

      <div className="rounded-lg border bg-muted/50 p-4 text-xs space-y-2">
        <p className="font-semibold text-sm">{m.demoAccounts}</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>• <strong>admin@insu.co.th</strong> — {m.adminAccount}</li>
          <li>• <strong>manager@insu.co.th</strong> — {m.managerAccount}</li>
          <li>• <strong>agent@insu.co.th</strong> — {m.agentAccount}</li>
        </ul>
        <p className="text-muted-foreground pt-2 border-t">
          Password: <code className="bg-background px-1.5 py-0.5 rounded">password123</code>
        </p>
      </div>
    </div>
  );
}
