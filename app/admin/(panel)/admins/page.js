import { requirePageOwner } from '@/lib/auth';
import { ADMIN_ROLES } from '@/lib/store';
import { listAdmins } from '@/lib/admins';
import AdministratorsManager from '@/components/admin/AdministratorsManager';

export const dynamic = 'force-dynamic';

export default async function AdministratorsPage() {
  const admin = await requirePageOwner('/admin/admins');
  return <AdministratorsManager initialAdmins={listAdmins()} roles={ADMIN_ROLES} currentAdminId={admin.id} />;
}
