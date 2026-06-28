'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { locales } from '@/i18n/config';
import { useTransition } from 'react';

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: string) {
    if (next === currentLocale) return;
    // Replace /th/ or /en/ prefix
    const newPath = pathname.replace(/^\/(th|en)/, `/${next}`);
    startTransition(() => {
      router.replace(newPath);
    });
  }

  return (
    <div className="inline-flex rounded-md border bg-background p-0.5 shadow-sm">
      <button
        type="button"
        disabled
        className="p-1.5 text-muted-foreground"
        aria-label="Language"
      >
        <Globe className="h-4 w-4" />
      </button>
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          disabled={isPending}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            loc === currentLocale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
