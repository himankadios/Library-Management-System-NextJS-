import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

export const metadata = {
  title: 'AuraLib Pro | Library Management & Digital File Management System',
  description: 'A comprehensive, enterprise-ready library circulation, inventory, and digital asset management platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-slate-100 antialiased min-h-screen">
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
