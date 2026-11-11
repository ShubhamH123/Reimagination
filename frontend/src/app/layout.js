import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // still used by the legacy Team / Techboard / FAQ pages
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/tn.css'; // design system — loaded last so it wins over Bootstrap
import { ToastProvider } from '@/components/tn/Toast';
import Chrome from '@/components/tn/Chrome';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
});

export const metadata = {
  title: 'TechNeeds · Learn together, grow faster',
  description: 'The mentorship platform of TechNeeds IGDTUW: cohorts, quizzes, projects, a live leaderboard and an AI-generated learner profile.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jakarta.variable}>
        <ToastProvider>
          <Chrome>{children}</Chrome>
        </ToastProvider>
      </body>
    </html>
  );
}
