import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stringer Tracker",
  description: "ระบบบันทึกการขึ้นเอ็นเทนนิส",
  applicationName: "Stringer Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Stringer Tracker",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#F3EFE4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
