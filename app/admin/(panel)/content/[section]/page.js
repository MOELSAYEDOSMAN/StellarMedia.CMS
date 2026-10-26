import { notFound } from 'next/navigation';
import { requirePageAdmin } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { getSection } from '@/lib/sections';
import SectionEditor from '@/components/admin/SectionEditor';

export const dynamic = 'force-dynamic';

export default async function SectionPage({ params }) {
  const { section: sectionId } = await params;
  const section = getSection(sectionId);
  if (!section) notFound();

  await requirePageAdmin(`/admin/content/${sectionId}`);
  const content = getContent();

  return <SectionEditor section={section} initialValue={content[sectionId]} />;
}
