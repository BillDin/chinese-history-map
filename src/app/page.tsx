import { PlaceExplorer } from "@/components/place-explorer";

export default function Home() {
  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">CHGIS TEMPORAL GAZETTEER</p>
          <h1>中国历史地名浏览器</h1>
        </div>
        <p className="masthead-note">在现代地图上定位史籍中的地名</p>
      </header>
      <PlaceExplorer />
    </main>
  );
}
