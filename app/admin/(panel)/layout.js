import { requirePageAdmin } from '@/lib/auth';
import { getDb } from '@/lib/store';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  const admin = await requirePageAdmin();
  const db = getDb();
  const newMessages = db.messages.filter((message) => message.status === 'new').length;

  return (
    <AdminShell admin={admin} newMessages={newMessages}>
      {children}
    </AdminShell>
  );
}
