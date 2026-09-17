import "./globals.css";

export const metadata = {
  title: "Study Hub",
  description: "Your personal study space — synced across every device.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Study Hub",
  },
};

export const viewport = {
  themeColor: "#7c6cf0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
