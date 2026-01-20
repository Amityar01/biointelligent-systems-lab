import { getAllNews, categoryLabels, newsCategories } from '@/lib/content';
import { NewsPageClient } from './NewsPageClient';

export default function NewsPage() {
  const newsItems = getAllNews();

  return (
    <NewsPageClient
      news={newsItems}
      categoryLabels={categoryLabels}
      newsCategories={[...newsCategories]}
    />
  );
}
