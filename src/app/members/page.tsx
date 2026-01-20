import { getFaculty, getStaff, getStudents, getUndergraduates, getVisitors, getAlumni } from '@/lib/content';
import { MembersPageClient } from './MembersPageClient';

export default function MembersPage() {
  // Fetch all member data on the server
  const faculty = getFaculty();
  const staffMembers = getStaff();
  const students = getStudents();
  const undergraduates = getUndergraduates();
  const visitors = getVisitors();
  const alumni = getAlumni();

  return (
    <MembersPageClient
      faculty={faculty}
      staff={staffMembers}
      students={students}
      undergraduates={undergraduates}
      visitors={visitors}
      alumni={alumni}
    />
  );
}
