'use client';

import { Button } from '@/components/ui/button';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          {error.message ?? 'An unexpected error occurred while loading this page.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">digest: {error.digest}</p>
        )}
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}
