import {
  getAllMembers,
  getAllNews,
  getAllBooks,
  getYouTubeChannel,
  getHomepageSettings,
  getAllPublications,
} from '@/lib/content';
import HomePageClient from './HomePageClient';

export default function Home() {
  // Fetch all data from CMS
  const allMembers = getAllMembers();
  const faculty = allMembers.filter(m => m.category === 'faculty');
  const news = getAllNews();
  const books = getAllBooks();
  const youtubeChannel = getYouTubeChannel();
  const settings = getHomepageSettings();
  const publications = getAllPublications();

  // Calculate total members count
  const totalMembersCount = allMembers.filter(m => m.category !== 'alumni').length;

  // Pass data to client component
  return (
    <HomePageClient
      members={faculty}
      publications={publications.slice(0, 4)}
      news={news}
      books={books}
      youtubeChannel={youtubeChannel}
      settings={settings}
    />
  );
}
