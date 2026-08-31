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
  icons: {
    icon: [{ url: "/stringer-tracker-removebg-192.png", type: "image/png", sizes: "192x192" }],
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
        <link rel="icon" href="/stringer-tracker-removebg-192.png" type="image/png" sizes="192x192" />
        <link rel="shortcut icon" href="/stringer-tracker-removebg-192.png" type="image/png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
