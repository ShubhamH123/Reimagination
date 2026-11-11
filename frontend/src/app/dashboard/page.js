import MenteeApp from '@/components/tn/mentee/MenteeApp';

export const metadata = { title: 'My dashboard · TechNeeds' };

export default function DashboardPage() {
  return <MenteeApp initialTab="learn" />;
}
