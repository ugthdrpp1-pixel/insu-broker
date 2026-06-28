import './globals.css';

export const metadata = {
  title: 'Insu Broker - Insurance Sales Management',
  description: 'Comprehensive insurance sales management system',
};

// Root layout is a passthrough — the locale layout provides <html>/<body>.
// This is the recommended next-intl pattern for App Router.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
