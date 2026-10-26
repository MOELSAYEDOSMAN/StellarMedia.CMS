import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import LoginForm from '@/components/admin/LoginForm';
import StarMark from '@/components/site/StarMark';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  if (session) redirect('/admin');

  const params = await searchParams;
  const requested = typeof params?.next === 'string' ? params.next : '';
  const next = requested.startsWith('/admin') ? requested : '/admin';

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-second/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full border border-second/20" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <StarMark className="h-6 w-6 text-second" />
          <div>
            <p className="font-display text-lg font-extrabold leading-tight">Stellar Media</p>
            <p className="text-xs uppercase tracking-[0.2em] text-soft">Content studio</p>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-soft">
            Manage the website content, enquiries and administrators.
          </p>

          <div className="mt-6">
            <LoginForm next={next} />
          </div>

          
        </div>

        <p className="mt-6 text-center text-sm text-soft">
          <Link href="/" className="underline decoration-line underline-offset-4 hover:text-second">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
