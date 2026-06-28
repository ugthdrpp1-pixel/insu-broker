import './globals.css';

export const metadata = {
  title: 'Not Found - Insu Broker',
};

// The root layout (src/app/layout.tsx) is a passthrough without <html>/<body>
// (those live in [locale]/layout.tsx). A root-level not-found renders outside
// the locale segment, so it must provide its own <html>/<body> wrapper to
// avoid the "missing required html tags" error.
export default function RootNotFound() {
  return (
    <html lang="th">
      <body className="antialiased bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-5xl font-bold text-primary">404</h1>
            <p className="text-muted-foreground">
              The page you are looking for could not be found.
            </p>
            <a
              href="/th/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
