import { requirePageAdmin } from '@/lib/auth';
import { getDb } from '@/lib/store';
import { mailStatus } from '@/lib/mailer';
import MailSettings from '@/components/admin/MailSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requirePageAdmin('/admin/settings');
  const db = getDb();
  const mail = mailStatus();
  return <MailSettings mail={mail} notifyEmail={db.content.contact?.notifyEmail || ''} />;
}
