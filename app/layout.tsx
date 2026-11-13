import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Пауза — кофе и немного времени",
  description:
    "Кофе, выпечка и маленькие радости. Демонстрационный сайт кофейни: изучайте меню и сохраняйте любимое.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body id="top">
        <a className="skip-link" href="#main">
          Перейти к содержимому
        </a>
        {children}
      </body>
    </html>
  );
}
