import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken');
  if (!token) {
    redirect('/signin');
  }

  return <section className="min-h-full">{children}</section>;
}
