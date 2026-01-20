import { getAllMembers, getMemberBySlug } from '@/lib/content';
import { MemberDetailClient } from './MemberDetailClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const members = getAllMembers();
  return members.map((member) => ({
    slug: member.slug,
  }));
}

export default async function MemberPage({ params }: Props) {
  const { slug } = await params;
  const member = getMemberBySlug(slug);

  if (!member) {
    notFound();
  }

  return <MemberDetailClient member={member} />;
}
