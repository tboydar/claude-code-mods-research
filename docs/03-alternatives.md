# 03 · 六個周邊專案：不是同一類 Mods

[回首頁](../README.md) · 查閱日期：2026-10-05

以下是**不同需求類別的代表樣本，不是市場完整清單或熱門度排名**。已核對各 repo 的 README、manifest／入口、相關原始碼與授權；未安裝、未 benchmark。固定版本見[來源快照](07-sources.md)。

在本次查核的 Claude Code 整合入口中，六者都不是官方 hooks-module Mod：有的提供 skills／settings hooks，有的是常駐記憶服務、statusline、模型 gateway，或直接 patch 客戶端。名稱有 hook、native、plugin，不足以認定使用新的 Mods API。

## 快速比較

| 專案 | 本次確認的主要機制 | 主要使用者／任務 | 先比較的較輕方案 | 額外代價 |
| --- | --- | --- | --- | --- |
| Superpowers | Plugin、skills、SessionStart command hook | 想固定設計、TDD、驗證流程的開發者 | Project instructions + 少量 skills | 流程與 context 負擔 |
| oh-my-claudecode（OMC） | Skills、command hooks、MCP、CLI／worker 協調 | 多代理、跨 CLI 的複雜工作 | 官方 subagents／agent teams／workflows | Node、tmux／CLI、狀態與相容性 |
| claude-mem | Command hooks、worker、資料庫、MCP | 跨 session 找回知識與觀察 | 官方 memory／resume／專案文件 | 背景服務、資料保留、額外模型與外連 |
| ccstatusline | Statusline command，部分 settings hooks | 在 terminal 看 branch、context、用量 | 自訂短 statusline script | Widget subprocess、可選外部服務 |
| claude-code-router | 外部 HTTP gateway、client profiles | 跨供應商路由、fallback、觀測 | 官方 model 設定／單一 gateway | 憑證、資料轉送、協定及 fallback 風險 |
| tweakcc | JS／native binary patcher | 官方擴充面未支援的客戶端實驗 | 原生設定、statusline 或 Mod | 版本強耦合、執行檔完整性與復原 |

## Superpowers：買的是工程方法，不是新的 runtime

[Superpowers README](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/README.md#L1-L46) 描述先釐清、設計、計畫，再以子代理、TDD 和驗證執行的工作法；[hooks 設定](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/hooks/hooks.json#L1-L17) 是 SessionStart 外部 command，而不是 `modules`。

**具體例子：**團隊常收到「寫完但沒測」的 agent 產物，想把測試與驗收紀律變成預設流程。它的價值假說是降低漏步驟，而不是增加模型智力。

**何時值得：**多個專案確實需要同一套完整流程。**何時不值得：**只改一行文件，卻引入完整訪談、設計與分代理週期。此時一份精簡 skill 可能更適合。

**代價與資料：**所查 Claude hook 未見網路呼叫，不等於整個工作流無資料外傳；Claude 推論、技能所驅動的工具、subagents 仍受其各自資料與費用邊界影響。授權：[MIT](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/LICENSE)。

## OMC：協調能力多，也多了必須維護的狀態

[OMC 的 team 工作流](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/13543f9d6fc1a13a15b68fe5c97baeb3268569e2/README.md#L169-L226) 涵蓋 plan／execute／verify／fix；[manifest](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/13543f9d6fc1a13a15b68fe5c97baeb3268569e2/.claude-plugin/plugin.json#L1-L69) 和 [hooks](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/13543f9d6fc1a13a15b68fe5c97baeb3268569e2/hooks/hooks.json#L1-L131) 顯示它是組合式 plugin／CLI 系統，不是單一 native Mod。

**具體例子：**把大量 TypeScript 錯誤分成獨立工作，再合併驗證；或讓不同 CLI worker 處理不同範圍。

**價值：**狀態追蹤、工作分配、恢復及較完整的操作流程。**代價：**相較官方 subagent，多了框架自己的設定、session 檔案、hooks、外部 CLI 登入與可能的 tmux；必須解決重複工作、檔案碰撞、工作何時停止等問題。

本快照 [package 設定](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/13543f9d6fc1a13a15b68fe5c97baeb3268569e2/package.json#L92-L124) 列 Node 20–26 及 Agent SDK、MCP SDK、SQLite 等依賴；可選通知／外部 worker 會擴大資料目的端。不要由未啟用某一整合的「zero egress」推論整個 agent 工作不連網。授權：[MIT](https://github.com/Yeachan-Heo/oh-my-claudecode/blob/13543f9d6fc1a13a15b68fe5c97baeb3268569e2/LICENSE)。

## claude-mem：記憶問題也是資料治理問題

[架構說明](https://github.com/thedotmack/claude-mem/blob/1caee126ae256a36fd02e89f78b38333273516ca/README.md#L227-L257) 包含 lifecycle hooks、本機 Bun worker、SQLite、Chroma 和 MCP 搜尋，不只是把幾行記憶塞進 prompt。

**具體例子：**工程師隔週處理同一模組時，檢索上次 bug 的根因、試過但失敗的方法與決策背景。

**價值：**自動捕捉與可搜尋的跨 session 脈絡。**替代：**若知識量少且穩定，專案文件／原生 memory 更容易理解、修正與刪除；不一定需要第二條模型摘要管線。

**特別注意來源矛盾：**本快照 [SECURITY.md](https://github.com/thedotmack/claude-mem/blob/1caee126ae256a36fd02e89f78b38333273516ca/SECURITY.md#L148-L185) 的「不收 telemetry」敘述與[專門 telemetry 文件](https://github.com/thedotmack/claude-mem/blob/1caee126ae256a36fd02e89f78b38333273516ca/docs/public/telemetry.mdx#L1-L24) 不一致，後者明確寫 **PostHog analytics 預設開啟、opt-out**。因此本研究不將它標為零遙測或純本機工具；部署前要再核對所選版本的程式與實際設定。

Observation／prompt／transcript 可能依 provider 設定送往模型服務；本機 logs 也可能保留未遮罩細節。私密標記、刪除策略、備份、向量服務、雲端同步與 observer 費用都要一起審查，而非只問資料庫放在哪。授權：[Apache-2.0](https://github.com/thedotmack/claude-mem/blob/1caee126ae256a36fd02e89f78b38333273516ca/LICENSE)。

## ccstatusline：比 Mod 更窄，也可能已滿足需求

[ccstatusline](https://github.com/sirmalloc/ccstatusline/blob/35440e4a93ac8aba7e57973ac004a68adcc51089/README.md#L12-L20) 使用 Claude Code 的原生 statusline command；部分 widgets 透過[外部 settings hooks](https://github.com/sirmalloc/ccstatusline/blob/35440e4a93ac8aba7e57973ac004a68adcc51089/src/utils/hooks.ts#L16-L30) 更新狀態。

**具體例子：**常常忘記目前 Git branch 或 context 用量，想在底部一次看清楚。

**價值：**現成 widgets、設定 TUI 和格式化；不需要自己建立 pane。若只顯示 model 和 branch，自寫短 script 可能更易審核。

**代價：**statusline 頻繁執行，慢 subprocess 可能影響互動；usage、PR／CI、更新查詢等 widgets 不必然是 local-only。尤其 custom command 與讀取 CLI 憑證的功能，應按啟用項目審查。授權：[MIT](https://github.com/sirmalloc/ccstatusline/blob/35440e4a93ac8aba7e57973ac004a68adcc51089/LICENSE)。

## claude-code-router：路由的價值不能只看 token 單價

[CCR README](https://github.com/musistudio/claude-code-router/blob/f2e01bfe0c01e0c7ea7a37077747473f69869048/README.md#L31-L70) 描述多 client gateway／control plane；[profile 程式](https://github.com/musistudio/claude-code-router/blob/f2e01bfe0c01e0c7ea7a37077747473f69869048/packages/core/src/profiles/service.ts#L63-L118) 修改 client 環境與 base URL。這是在 Claude Code 外面的代理層。

**具體例子：**模型服務異常時依規則 fallback，或不同任務送到不同合約下的 provider。

**價值：**集中 provider、key pool、相容性轉換、重試與觀測。**替代：**只要固定 gateway 或切 model，先查官方設定，不必另建控制平面。

**代價：**每個 request／response 會經 gateway；fallback 可能把資料送往原本沒打算使用的供應商。需審查 body logs／raw traces、憑證、管理介面綁定、模型品質、快取失效、額外延遲及服務條款；沒有跨供應商實測，不能宣稱既便宜又不降品質。授權：[MIT](https://github.com/musistudio/claude-code-router/blob/f2e01bfe0c01e0c7ea7a37077747473f69869048/LICENSE)。

## tweakcc：官方 Mods 之外的高維護成本實驗

[工作原理](https://github.com/Piebald-AI/tweakcc/blob/30909c129e2096ba993d006628e52f0e059197c4/README.md#L160-L166) 是修改 minified JS，或抽出 native binary 內的 JS、修改後重新封裝。它不透過官方 hooks module 接口。

**具體例子：**研究某個官方擴充點尚未提供的內部 prompt／UI 行為。若只想改 spinner 或新增 pane，先確認新 Mods API 是否已能做到。

**限制：**本快照 README 的非 prompt patches 驗證範圍只到 **2.1.162**；不能由新版本 prompt 檔案存在，就推論所有 patch 都相容 ≥2.1.287。升級可能覆寫 patch，且 layout 改動可能讓 patch 失效。

**安全：**遠端 config／patch script 的執行隔離，不等於它產出的被修改 binary 安全；修改後的程式會在下次執行取得 Claude Code 的權限。來源自己要求審核 diff。[上游警告](https://github.com/Piebald-AI/tweakcc/blob/30909c129e2096ba993d006628e52f0e059197c4/README.md#L271-L297)

**研究建議：**不要把它列為一般使用者的第一步；只在可拋棄、可復原、無生產憑證的實驗環境評估。授權：[MIT](https://github.com/Piebald-AI/tweakcc/blob/30909c129e2096ba993d006628e52f0e059197c4/LICENSE)；該授權不代表取得修改對象的任意再散佈權利。

## 組合時先防重複

同時裝 workflow framework、記憶系統、statusline 與 Mod，可能重複攔 SessionStart／Stop、重複注入指示、重複通知或顯示相同數據。先逐一建立 baseline，再測組合；本研究沒有驗證這六者與原生 Mods 的互通性。
