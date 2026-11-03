import './globals.css';
import './fm-journey-fix.css';

export const metadata = {
  title: 'Facilities AI Field Lab',
  description: 'A safe place for facilities teams to practice using AI.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
