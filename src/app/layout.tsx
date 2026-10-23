/**
 * Stub for Next.js app
 *
 * The dashboard and customer login form will live here
 */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Jokai — Genshin Piloting</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
