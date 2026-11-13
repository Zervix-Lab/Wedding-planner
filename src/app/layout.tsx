import type { Metadata, Viewport } from "next";
import { Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getI18n } from "@/lib/i18n-server";

const sinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala", "latin"],
  display: "swap",
  variable: "--font-sinhala",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("app.name"), description: t("app.tagline") };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#9f1239" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, dict } = await getI18n();
  return (
    <html lang={lang} className={sinhala.variable}>
      <body>
        <Providers lang={lang} dict={dict}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
