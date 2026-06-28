'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="antialiased bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-3xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground">
              {error.message ?? 'An unexpected error occurred.'}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground font-mono">
                digest: {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
