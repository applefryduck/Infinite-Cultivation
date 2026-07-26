# 無限修仙 · Infinite Cultivation

一款放置掛機修仙（idle / incremental）網頁遊戲。融合 **Melvor Idle** 的多技能並行與精通、**Infinite Craft** 的自由組合無限發現，打造修仙版「萬物煉製 × 多流派修練 × 自動鬥戰」。

## 兩大支柱

- **修煉 / 突破**：累積修為 → 突破境界（機率制，跨大境界更凶險）→ 解鎖更高階內容。境界練氣→渡劫，飛升後程序化生成無限仙境。
- **鬥戰**：中度自動戰鬥。戰力由修練體系衍生，獵場刷妖獸、秘境闖波次＋BOSS，含五行相剋。掉素材／靈石／修為，餵回所有技能線。

## 修練體系（修仙版流派）

各體系消耗不同素材、給不同招牌強項，皆推同一條境界階梯，可專精或博採，輪回可換 build：

| 體系 | 消耗 | 招牌 / 戰鬥風格 |
|---|---|---|
| **靈修** | 靈氣(免費)、靈草、靈石 | 均衡穩健、突破率↑ · 術法 |
| **體修** | 妖丹、獸血 | 氣血肉身、突破抗反噬 · 肉搏 |
| **神識** | 夢境本源、妖魂 | 煉製成功率↑、御寶多段、掉率↑ · 御劍 |

每種修煉方式有免費保底，素材耗盡自動退回打坐（掛機防卡死）。

## 技能線

- **採集**：採藥 / 採礦 / 觀想（可與修煉並行掛機）
- **製作**：煉丹 / 煉器 —— **丹爐萬物煉製**：自由組合兩樣素材無限發現，發現後轉為可掛機重複煉、可累積配方精通
- 圖鑑收錄所有發現，首次發現給獎勵，含手工策劃的招牌秘物鏈（如紫霄神雷劍、九轉金丹）

## LLM 就緒的煉製

煉製底層是 `CraftProvider` 介面（`src/game/crafting/provider.ts`）。目前為**離線程序化生成器**（零 API 成本）：LLM/生成器只決定「名稱／emoji／類別／稀有度」，**數值一律由遊戲公式依類別＋輸入稀有度計算**，平衡永遠握在程式手裡。日後接真 Claude API 只需替換此 provider。

## 技術棧

- **React 18** + **TypeScript** + **Vite**，**zustand** 管理狀態
- 固定 tick 遊戲主迴圈、純前端、localStorage 自動存檔＋離線收益（上限 12 小時）
- OSRS/Melvor 式 XP 曲線（`src/game/xp.ts`）驅動技能與精通

## 開發

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型別檢查 + 打包
npm run preview
```

## 專案結構

```
src/game/
  content/     # 資料：items / paths / gathering / combat 內容定義
  crafting/    # 煉製：categoryRules / nameGen / emojiMap / namedChains / provider
  xp.ts        # OSRS 經驗曲線
  stats.ts     # 加成聚合、修煉速率、戰鬥數值衍生
  effects.ts   # 丹藥/消耗品效果
  combatEngine.ts  # 獵場/秘境戰鬥結算
  store.ts     # zustand：修煉/採集/煉製/戰鬥/突破/輪回 核心邏輯
  formulas.ts / realms.ts / elements.ts / events.ts / save.ts
src/components/
  panels/      # 修煉/鬥戰/採集/煉製/儲物/圖鑑/洞府 七大分頁
  ResourceBar / LogPanel / OfflineModal / ui/labels
```

## 後續可擴充

二波修練體系（符修／巫蠱）、更多獵場秘境、成就系統、接真 LLM 煉製、渡劫玩法等。
