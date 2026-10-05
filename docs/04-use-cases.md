# 04 · 十個應用：先定義受益者與驗收，再選 API

[回首頁](../README.md) · 2026-10-05

**本章是研究建議與待驗證的產品假設，不是十個已做好的工具。** 「有參考」表示已有可閱讀案例，不代表本 repo 實作或實測過。能力基礎來自[官方 API](https://code.claude.com/docs/en/plugins/mods/api)、[事件](https://code.claude.com/docs/en/plugins/mods/events)、[UI](https://code.claude.com/docs/en/plugins/mods/interface) 與[官方範例](02-official-examples.md)。

P1＝適合先做低副作用 pilot；P2＝需要外部整合／資料治理；P3＝改寫、權限或多 session 風險較高。這是本研究依最小權限、可量測性、現有替代方案做的排序，不是市場需求或收益分數。

| 應用 | 受益者／痛點 | Mod 的必要增值 | 可替代方式 | 優先度與證據 |
| --- | --- | --- | --- | --- |
| Context 壓力與趨勢 | 長 session 常在壓縮後丟失脈絡 | 每回合趨勢、互動說明 | statusline、原生 context 指令 | P1；Token Weather 有參考 |
| 編輯回放與教學 | Reviewer 不知道變更先後 | 時間軸與逐步檢視 | Git diff、內建 `/diff` | P1；Replay Theater 有參考 |
| Tool 使用觀測 | 不知道 agent 花時間在哪 | 被動統計＋立即查詢 command | transcript 分析／settings hook | P1；本 repo 最小範例 |
| CI／測試狀態 pane | 多次切換瀏覽器查看 build | 可見的新鮮度、失敗詳情互動 | CI 網頁、MCP、通知 hook | P2；官方公告列為應用 |
| 風險操作影響預覽 | 不知道破壞性指令影響範圍 | 執行前資訊＋確認／取消 | permission rules、dry-run CLI | P2；Blast Radius 有參考 |
| Release checklist 面板 | 發版前跨系統確認容易漏項 | 顯示證據與過期狀態 | skill＋CI／PR checks | P2；本研究構想 |
| 工具結果秘密遮罩 | 避免把敏感結果送進模型 | 在指定事件點改寫結果 | 源頭脫敏、工具端限制 | P3；官方公告列有能力 |
| 跨 session 任務看板 | 多個 agent 的依賴／等待不透明 | 宿主內可操作的聚合狀態 | agent view／teams／外部任務板 | P3；本研究構想 |
| 專案上下文適配器 | 不同工具的指示檔重複 | structured context 整合 | 原生指示／skill | P3；agents-md 有參考 |
| 組織政策／操作紀錄 | 想管制 Mod 能力與追查行為 | tier／provenance／載入檢查 | managed settings、OS／IAM／外部 log | P3；sec-default 有參考 |

CI 與秘密遮罩的來源：[官方發表](https://claude.com/blog/claude-code-mods)。所有「可替代」項目都應先測；不必為了使用 Mods 而另造功能。

## P1：三個容易縮小範圍的起點

### 1. Context 壓力與趨勢

- **流程：**讀 usage → 保留有限長度歷史 → render 趨勢與「上次更新」；不自動 compact、不改 prompt。
- **驗收：**新 session、首次回應、資料讀取失敗與 reload 都有明確狀態；分清完整 window 與 auto-compact 點。
- **價值假說：**減少因看不見 context 壓力而反覆讀檔。以人工重工和任務成功率測量，不以圖表存在代替。
- **放棄條件：**使用者只要目前百分比，statusline 已滿足。

### 2. 編輯回放與教學

- **流程：**記錄工具嘗試與結果 → 以時間軸連到最終 Git diff → 使用者逐步檢查。
- **驗收：**失敗、被拒絕、Bash 產生的編輯、並行 subagent、檔案重新命名要分開呈現；不能將未執行 Edit 畫成成功。
- **價值假說：**Reviewer 更快理解意圖與順序，尤其適合教學。
- **放棄條件：**只關心最終 patch；內建 `/diff` 已足夠。

### 3. Tool 使用觀測

- **流程：**統計到達 hook 的工具名稱與次數，以無模型 command 回報；先不儲存 prompts／arguments／results。
- **驗收：**不吞事件、不重複執行、不改回傳；拒絕的呼叫與成功執行不能混稱；重設後只計新資料。
- **可讀範例：**[research-tally](../examples/research-tally/README.md) 展示最窄的做法。它不計費、不算 latency，也不是完整 audit log。
- **價值假說：**建立有根據的觀察後，再決定是否需要昂貴的模型式分析。

## P2：接外部系統前先定義副作用

### 4. CI／測試狀態 pane

- **流程：**讀特定 repo、commit、run ID 的狀態 → pane 標示檢查時間 → 點擊查看失敗詳情。
- **最小版本：**唯讀；不自動 rerun、不自動 merge。遇 API 429／離線時退避並顯示 stale，而不是持續顯示綠燈。
- **驗收：**畫面的 commit 必須等於正在 review 的 commit；其他 branch 綠燈不能被誤認為本次通過。無 UI surface 提供文字查詢。
- **價值：**減少切換與發現失敗的延遲；MCP／existing CLI 可保留為資料連線層。

### 5. 風險操作影響預覽

- **流程：**對有限、明定的操作集合取得 dry-run 結果 → 使用者確認 → 執行相同目標。
- **最小版本：**只支援一個可結構化的工具／操作，優於號稱涵蓋所有 shell。讀取失敗顯示「未知」，不能顯示「安全」。
- **驗收：**目標在預覽與執行間改變、使用者取消、超時、沒有 UI、未知 wrapper、重複確認都要測。取消不能偷偷重試。
- **價值：**改善決策資訊，不承諾完全防止破壞。強制限制必須另由權限或環境控制。

### 6. Release checklist 面板

- **流程：**彙整 tests、migration review、版本與 release notes；每項有證據 URL、commit 和時間。
- **最小版本：**只讀取、提醒，最終部署仍經原 CI/CD 的批准管線。
- **驗收：**過期結果、缺項、部分成功不能被畫成「全部完成」；重跑應更新證據而非只打勾。
- **價值假說：**減少漏項與查找證據時間；如果一份 skill＋CI checks 已解決，就不必增加 pane。

## P3：高價值也高風險的研究方向

### 7. 工具結果秘密遮罩

官方列出 redaction 能力，但**後處理不等於 DLP**。秘密可能已出現在 command、原始 logs、其他 Mod、MCP server 或非文字資料裡。

建議限定資料格式與工具，先用合成秘密測 precision／recall，再驗證改寫後 schema 不破壞模型或下游工具。優先在資料源限制秘密、移除不需要的權限；不應先收集所有 transcript 再聲稱能遮罩。

### 8. 跨 session 任務看板

Mods API 可連到 session messaging，但應先比較官方 agent view／teams。若再做看板，要處理 session 消失、訊息重送、同檔案 ownership、發送者來源以及任何「以使用者身分送 prompt」的確認。價值應以依賴等待時間與重複工作率衡量，不是啟動的 agent 越多越好。

### 9. 專案上下文適配器

`agents-md` 展示結構化 instruction files 整合。若有內部規範系統，先定義信任根、優先順序、檔案範圍、何時重新讀取，以及如何防止第三方內容升格為指令。不要每個 request 注入時間戳或大段動態文字，破壞 prompt cache。一般穩定規範優先用原生指示與 skills。

### 10. 組織政策與操作紀錄

以 `plugin.register`／managed tier 控制特定 Mod 能力，或為事件建立可追溯紀錄，有研究價值；但 installed policy mod 可能停用或 crash，並非 OS 強制邊界。需另外具備部署控制、異常監測、保留／刪除期限與外部不可竄改記錄。

先寫清楚威脅模型：是防誤操作、惡意 repo，還是惡意本機使用者？三者不能共用一句「有安全 Mod 就安全」。細節見[安全章](05-security.md)。

## 哪些可能有產品或商業價值？

**以下未做訪談、市場規模或付費意願驗證。**

- 個人開發者工具：低成本、免設定的狀態／review 輔助較容易試用，但內建功能或免費 statusline 替代性高。
- 團隊內部工具：特定 CI、release、incident 流程的整合，價值來自團隊已有的反覆摩擦；通常比泛用 UI 裝飾更容易量測。
- 平臺／企業工具：政策、來源准入、稽核和版本治理可能有預算，但也要求 OS／IAM 整合、法遵與長期維護，不能只靠一個 Mod。

有競爭力的部分可能是**領域流程、整合品質、驗證證據與維運**，不只是幾個 event handlers。先用[對照實驗](06-evaluation.md)證明有人因此少做重工，再討論收費。
