/**
 * Root Layout for Jokai Halfdim
 */

import './globals.css';

export const metadata = {
  title: 'Jokai — Genshin Piloting',
  description: 'Genshin Impact Piloting Service',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
