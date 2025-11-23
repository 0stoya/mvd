'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/imports', label: 'Imports' },
  { href: '/logs', label: 'Logs' }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoginPage = pathname === '/login';

  // 1️⃣ Redirect unauthenticated users away from dashboard routes
  useEffect(() => {
    if (!isLoginPage && status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, isLoginPage, router]);

  // 2️⃣ On login page → no sidebar, just show children
  if (isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        {children}
      </div>
    );
  }

  // 3️⃣ If session is loading → show loading screen
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Checking authentication…
      </div>
    );
  }

  // 4️⃣ If unauthenticated user somehow reaches here → redirect will run, but show nothing
  if (!session) {
    return null;
  }

  // 5️⃣ Authenticated → show full dashboard layout
  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="p-4 text-lg font-semibold border-b border-slate-800">
          Middleware Dashboard
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm hover:bg-slate-800 ${
                  active ? 'bg-slate-800 font-semibold' : ''
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* AUTH STATUS */}
        <div className="p-4 border-t border-slate-800 text-sm">
          <span className="text-slate-300 text-xs break-all">
            {session.user?.email}
          </span>

          <button
            onClick={() => signOut()}
            className="mt-2 rounded border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 bg-slate-50">{children}</main>
    </div>
  );
}
