# 07 · 來源、快照與研究方法

[回首頁](../README.md)

## 研究範圍與日期

- **查閱日：2026-10-05，Asia/Taipei。** 內容是一次性快照；沒有設定持續監控或自動更新。
- 對象是 2026-10-01 發表的**原生 Claude Code Mods**，以及容易混淆的周邊擴充機制。
- 先透過網路搜尋找出 canonical sources，再閱讀官方文件、原始碼／README／manifest／license；GitHub 內容以固定 commit 連結，避免 `main` 漂移。
- 分別調查能力與安全邊界、官方範例、周邊生態，再交叉查核有爭議的限制。未使用本機已安裝 plugin 設定來代表上游版本。
- 七個官方範例、一個社群原生 Mod、六個周邊專案是目的性取樣，不是完整生態普查。

## 搜尋策略

先搜尋 `Claude Code mods tweakcc`、`Claude Code plugins skills hooks MCP official documentation` 與 workflow framework，辨認名詞；找到官方 Mods 後，改查 `Claude Code mods modules register October 2026`、`Claude Code mods examples github` 與 `site:claude.dev mods`。

搜尋摘要只用於找來源。最後結論優先引用官方 live docs 和原專案的固定版本，不以聚合清單、行銷文章或 Reddit 評價當相容性／效能證據。第二輪確認到 `next-steps`，因此沒有把舊 plugin 清單誤寫成全部原生 Mods。

## 官方文件索引

本表記錄本研究使用的主要文件及用途；均以本次查閱日為準。詳細爭議敘述仍在各章附近提供來源。

| 來源 | 用於確認 |
| --- | --- |
| [Customize Claude Code with mods](https://claude.com/blog/claude-code-mods) | 2026-10-01 發表、定位、官方應用構想 |
| [Mods overview](https://code.claude.com/docs/en/plugins/mods/overview) | 定義、最低版本、平臺、安全、built-ins |
| [Create a mod](https://code.claude.com/docs/en/plugins/mods/create) | 檔案結構、module、載入、types、validate |
| [React to events](https://code.claude.com/docs/en/plugins/mods/events) | next、順序、改寫、失敗與 classic hooks |
| [Use the mods API](https://code.claude.com/docs/en/plugins/mods/api) | command、模型、程序、網路與 session 能力 |
| [Draw in the interface](https://code.claude.com/docs/en/plugins/mods/interface) | pane、band、互動、state |
| [Mods reference](https://code.claude.com/docs/en/plugins/mods/reference) | 本次頁面描述 2.1.289 的 API／限制 |
| [Test a mod](https://code.claude.com/docs/en/plugins/mods/test) | 無 session test kit、stubs、UI 測試限制 |
| [Manage mods for your organization](https://code.claude.com/docs/en/plugins/mods/admin) | managed guard、deny override、停用與 crash 邊界 |
| [Plugins overview](https://code.claude.com/docs/en/plugins/overview) | Plugin 是封裝單位，不等於 Mod |
| [Extend Claude Code](https://code.claude.com/docs/en/features-overview) | 指示、skill、subagent、hooks、MCP 的分工 |
| [Customize your status line](https://code.claude.com/docs/en/statusline) | Statusline 的較窄替代能力 |
| [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) | 宿主外程式化 agent 的選擇 |
| [Manage costs](https://code.claude.com/docs/en/costs)／[Prompt caching](https://code.claude.com/docs/en/prompt-caching) | 用量與快取分析背景，不是本研究收益測量 |
| [Mods 展示頁](https://claude.dev/mods) | 社群 native Mod 的發現來源 |
| [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods) | 教學版本與 playground 快照的交叉比較 |

## GitHub 快照

下列 commit 是本次引用的版本，不是保證之後仍為最新。授權是該快照的檔案／metadata 狀態，不是法律意見。

| Repository | 固定 commit | 本次研究用途 | 授權觀察 |
| --- | --- | --- | --- |
| anthropics/claude-code-playground | [569c5283d9a0](https://github.com/anthropics/claude-code-playground/commit/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86) | 三個 sample mods | Apache-2.0 |
| anthropics/claude-code | [2bfb629dfaff](https://github.com/anthropics/claude-code/commit/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18) | 四個 built-in source examples | 保留所有權利，Commercial Terms；非開源授權 |
| anthropics/claude-plugins-community | [87c843d52c12](https://github.com/anthropics/claude-plugins-community/commit/87c843d52c12f4bc91bb23b47132eb08b70e6cb6) | next-steps | Root Apache-2.0；plugin metadata MIT，範圍需釐清 |
| obra/superpowers | [8ca22dba9a94](https://github.com/obra/superpowers/commit/8ca22dba9a94f28898bbce59f2537ff4d87c747d) | Skills／工程流程 | MIT |
| Yeachan-Heo/oh-my-claudecode | [13543f9d6fc1](https://github.com/Yeachan-Heo/oh-my-claudecode/commit/13543f9d6fc1a13a15b68fe5c97baeb3268569e2) | 多代理／command hooks | MIT |
| thedotmack/claude-mem | [1caee126ae25](https://github.com/thedotmack/claude-mem/commit/1caee126ae256a36fd02e89f78b38333273516ca) | 持久記憶／隱私文件 | Apache-2.0 |
| sirmalloc/ccstatusline | [35440e4a93ac](https://github.com/sirmalloc/ccstatusline/commit/35440e4a93ac8aba7e57973ac004a68adcc51089) | Statusline 與相關 hooks | MIT |
| musistudio/claude-code-router | [f2e01bfe0c01](https://github.com/musistudio/claude-code-router/commit/f2e01bfe0c01e0c7ea7a37077747473f69869048) | 外部 gateway／profiles | MIT |
| Piebald-AI/tweakcc | [30909c129e20](https://github.com/Piebald-AI/tweakcc/commit/30909c129e2096ba993d006628e52f0e059197c4) | Client patcher 與版本耦合 | MIT |

## 矛盾與過時資料怎麼處理

1. **發布公告 vs 細部文件：**公告說支援 CLI／Desktop，不足以描述 VS Code、SDK、cloud 的 hook 行為。平臺表依 overview；權限依 admin，而不是廣義宣傳語句。
2. **執行環境限制 vs 安全 sandbox：**開發者教學以 sandbox 形容無 DOM／Node 的 module 環境；overview／admin 明說 Mod 不受安全 sandbox 保護。能經 `$` 存取使用者資源，不能由「無 Node」推論安全隔離。
3. **同名範例的不同版本：**教學文章的 Token Weather 使用 host `$.state` 保留 reload 歷史，並從 `e.props` 讀 UI props；本研究固定的 playground 程式仍用 module-local history 和事件頂層 props。因此[範例章](02-official-examples.md)的狀態限制與相容性疑慮限定於該 commit，不泛化到所有 Token Weather 版本。
4. **上游自述 vs 現況：**Blast Radius README 明示後續修正未重新 live-test；保留此限制，不只引用最早成功影片。
5. **同 repo 文件矛盾：**claude-mem 的 security 與 telemetry 文件不一致；在[周邊比較](03-alternatives.md)雙列，不寫「零遙測」。
6. **Metadata vs 授權全文：**next-steps 的 plugin metadata 和 root license 不同；在[個案章](08-community-mod.md)揭露，而非自行決定法律結論。
7. **舊 early-access 說法：**repo README 若仍寫 early access／舊測試版本，不能推翻最新 overview 的 ≥2.1.287 預設啟用規則，也不能保證所有舊範例相容。

## 研究沒有做到的事

- 沒有把所有第三方插件裝在一起、做完整安全 audit，或執行官方樣本的危險操作。
- 沒有實測生產力、端到端效能、成本改善、付費意願或市場規模。
- 沒有驗證每個 OS／surface／provider 的相容性。
- 唯一執行的 Mod 程式驗證是本 repo 原創範例的 static validation 與 stubbed test harness；詳見[實測紀錄](../examples/research-tally/README.md)。

## 更新方式

新增資料時記錄查閱日、固定 commit、具體檔案／行數和證據種類。若 API 升版，先更新範例與測試，再改實測版本；沒有跑過的矩陣格保留「未測」。若推翻舊結論，說明舊版本與新版本差異，不靜默把過去研究改寫成最新事實。
