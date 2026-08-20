import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "中国历史地名浏览器",
  description: "通过 CHGIS 在现代地图上查找中国历史地名。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hans">
      <body>{children}</body>
    </html>
  );
}
