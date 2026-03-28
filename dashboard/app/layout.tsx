import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "../components/nav";

export const metadata: Metadata = {
  title: "Kudos Dashboard",
  description: "Internal Slack Kudos analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <h1>Kudos Dashboard</h1>
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
}
