export interface HistoricalPeriod {
  id: string;
  label: string;
  year: number;
  description: string;
}

// Editorial navigation presets, not CHGIS records or claims that every local
// boundary stayed unchanged. Each selects one year; rationale: docs/chgis-api.md.
export const HISTORICAL_PERIODS: readonly HistoricalPeriod[] = [
  {
    id: "qin-commandery",
    label: "秦 · 郡县制",
    year: -210,
    description: "统一后的郡县格局。",
  },
  {
    id: "western-han-late",
    label: "西汉 · 后期郡国制",
    year: 2,
    description: "郡与王国并行，以西汉末年为参照。",
  },
  {
    id: "eastern-han-middle",
    label: "东汉 · 中期郡国制",
    year: 140,
    description: "州部监察郡国，取东汉末年战乱以前的格局。",
  },
  {
    id: "wei",
    label: "曹魏 · 州郡县制",
    year: 262,
    description: "以三国时期的曹魏为中原参照。",
  },
  {
    id: "western-jin",
    label: "西晋 · 统一初期",
    year: 282,
    description: "灭吴后、八王之乱前的州郡县格局。",
  },
  {
    id: "northern-wei-luoyang",
    label: "北魏 · 迁都洛阳后",
    year: 497,
    description: "以北魏迁都后的北方州郡县格局为参照。",
  },
  {
    id: "sui-kaihuang",
    label: "隋 · 开皇州县制",
    year: 600,
    description: "开皇废郡、统一后，以州直接统县。",
  },
  {
    id: "sui-daye",
    label: "隋 · 大业郡县制",
    year: 609,
    description: "大业改州为郡后的郡县格局。",
  },
  {
    id: "tang-zhenguan",
    label: "唐 · 贞观十道",
    year: 639,
    description: "以十道划分地理、监察区域，地方实行州县制。",
  },
  {
    id: "tang-kaiyuan",
    label: "唐 · 开元十五道",
    year: 741,
    description: "开元分十五道后、天宝改州为郡前的格局。",
  },
  {
    id: "tang-tianbao",
    label: "唐 · 天宝郡制",
    year: 742,
    description: "天宝改州为郡，以改制当年为参照。",
  },
  {
    id: "tang-yuanhe",
    label: "唐 · 元和后期",
    year: 820,
    description: "以方镇为重要区域单位，与前期道制分开查看。",
  },
  {
    id: "northern-song-zhidao",
    label: "北宋 · 至道十五路",
    year: 1000,
    description: "至道分路后、川峡四路分设前的格局。",
  },
  {
    id: "northern-song-yuanfeng",
    label: "北宋 · 元丰分路",
    year: 1080,
    description: "以元丰时期的路、府州军监、县为参照。",
  },
  {
    id: "jin-taihe",
    label: "金 · 泰和时期",
    year: 1208,
    description: "以金朝治理中原的路、府州、县格局为参照。",
  },
  {
    id: "yuan-provinces",
    label: "元 · 行省制成熟期",
    year: 1330,
    description: "中书省直辖腹里与各行省并行的格局。",
  },
  {
    id: "ming-two-capitals",
    label: "明 · 两京十三司",
    year: 1582,
    description: "两直隶、十三布政使司及其府州县格局。",
  },
  {
    id: "qing-kangxi",
    label: "清 · 康熙分省后",
    year: 1685,
    description: "江南、湖广、陕西分省后，以内地十八省为参照。",
  },
  {
    id: "qing-jiaqing",
    label: "清 · 嘉庆后期",
    year: 1820,
    description: "雍乾调整后的府厅州县格局，以嘉庆末年为参照。",
  },
  {
    id: "qing-xuantong",
    label: "清 · 宣统时期",
    year: 1909,
    description: "晚清增设行省、东北改省后的格局。",
  },
];
