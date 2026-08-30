import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { SwRegister } from "@/app/sw-register";
import { InstallBanner } from "@/app/install-banner";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { I18nProvider, LocaleSync } from "@/lib/i18n/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display serif for landing headlines + numerals. Variable, optically
// sized; italic loaded for the pain pull-quote. Body stays Geist.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "PrivaDoc",
  title: "PrivaDoc",
  description: "Votre coffre-fort de documents privé.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PrivaDoc",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <I18nProvider locale={locale} dict={dict}>
          <SwRegister />
          <LocaleSync locale={locale} />
          {children}
          <InstallBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
