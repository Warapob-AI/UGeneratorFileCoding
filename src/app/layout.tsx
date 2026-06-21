import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spring Boot & React Boilerplate Generator",
  description: "Next-gen developer workbench for generating standard controller, service, repository, model, and frontend files in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
