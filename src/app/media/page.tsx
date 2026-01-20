import { getAllBooks, getAllMediaAppearances, getYouTubeChannel, getAllSerializations } from '@/lib/content';
import { MediaPageClient } from './MediaPageClient';

export default function MediaPage() {
  const books = getAllBooks();
  const mediaAppearances = getAllMediaAppearances();
  const youtubeChannel = getYouTubeChannel();
  const serializations = getAllSerializations();

  return (
    <MediaPageClient
      books={books}
      mediaAppearances={mediaAppearances}
      youtubeChannel={youtubeChannel}
      serializations={serializations}
    />
  );
}
