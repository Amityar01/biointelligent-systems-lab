import { getAllPublications, getAllPublicationTags } from '@/lib/content';
import PublicationsClient from './PublicationsClient';

export default function PublicationsPage() {
  const publications = getAllPublications();
  const allTags = getAllPublicationTags();

  return <PublicationsClient publications={publications} allTags={allTags} />;
}
