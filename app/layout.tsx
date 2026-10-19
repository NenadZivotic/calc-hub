import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { verticals } from "@/lib/verticals";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  verification: {
    google: "zWoQ5OyNO2ZfZ_9z5aEorriiRL7-pcNRMVUAKn1zuYg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              {SITE_NAME}
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-neutral-600">
              {verticals.map((v) => (
                <Link
                  key={v.slug}
                  href={`/${v.slug}`}
                  className="hover:text-blue-700"
                >
                  {v.name}
                </Link>
              ))}
              <Link href="/learn" className="hover:text-blue-700">
                Guides
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-500">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/about" className="hover:text-blue-700">
                About
              </Link>
              <Link href="/privacy" className="hover:text-blue-700">
                Privacy policy
              </Link>
              <Link href="/terms" className="hover:text-blue-700">
                Terms of use
              </Link>
            </div>
            <p className="mt-4 max-w-3xl">
              {SITE_NAME} provides free calculators for informational purposes.
              Fee schedules and platform rates change — always verify figures
              against the provider&apos;s official documentation before making
              financial decisions.
            </p>
            <p className="mt-2">© 2026 {SITE_NAME}. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
