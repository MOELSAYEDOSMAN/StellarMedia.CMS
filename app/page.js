import { getPublicContent } from '@/lib/content';
import SitePage from '@/components/site/SitePage';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const content = getPublicContent();
  return <SitePage content={content} />;
}
