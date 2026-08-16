import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Hackathon App",
  description: "Hackathon application built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
