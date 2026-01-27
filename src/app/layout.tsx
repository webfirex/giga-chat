import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/auth-provider";
import { PlanProvider, usePlan } from "@/contexts/PlanContext";
import { MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bat Cheet",
  description: "The best way to find new friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#141c33]`}
      >
        <AuthProvider>
          <PlanProvider>
            <div className="">
              <MantineProvider>
              <Notifications position="top-right" zIndex={1000} />
                {children}
              </MantineProvider>
            </div>
          </PlanProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
