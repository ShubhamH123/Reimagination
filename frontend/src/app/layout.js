import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";

export const metadata = {
  title: "TechNeeds IGDTUW | Mentorship, cohorts and a leaderboard",
  description: "Join a TechNeeds mentorship cohort: learn from seniors, finish quizzes and projects, and climb the leaderboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
