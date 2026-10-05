# 01 · Mods 是 plugin 裡的程式內事件處理器

[回首頁](../README.md) · 查閱日期：2026-10-05

## 定義與適用版本

官方 Mods 自 Claude Code **v2.1.287** 起預設開啟。Mod 由 JavaScript／TypeScript 函式處理 Claude Code 內部事件，可觀察、改寫或直接回覆；它透過 plugin 分發，不需要修改 Claude Code binary。[官方概覽](https://code.claude.com/docs/en/plugins/mods/overview)

不要混淆三個名詞：

- **Plugin**：封裝／安裝單位，可以同時攜帶 skills、agents、settings hooks、MCP 和 Mod。
- **Settings hook**：設定檔裡的 command／HTTP／prompt 等生命週期處理器；官方也稱它為 hook，但不是 Mod 的函式。
- **Mod**：plugin 裡的 hooks module，在 Claude Code 內部處理事件；不是「修改版客戶端」的同義詞。

最小結構如下；`modules` 路徑相對於 hooks 設定檔，而不是 repo root：

```text
my-mod/
├── .claude-plugin/plugin.json
└── hooks/
    ├── hooks.json       # { "modules": ["./register.js"] }
    └── register.js      # export function register(on) { ... }
```

來源：[Create a mod](https://code.claude.com/docs/en/plugins/mods/create)、[Plugins overview](https://code.claude.com/docs/en/plugins/overview)。

## Observe、rewrite、answer 是三種不同責任

處理器收到 `($, e, next)`：`$` 是 Mods API，`e` 是事件，`next` 將事件交給下一個處理器，最後才到 Claude Code。

- **Observe**：記錄統計後 `return next(e)`；不改參數、不改結果。
- **Rewrite**：建立事件副本後交給 `next`；事件本身是 deeply frozen，不可就地修改。
- **Answer**：不呼叫 `next`，直接回覆／拒絕；下游 Mod 與原行為可能完全不執行。

第一個 Mod 先看到事件、最後看到結果，近似 middleware 的包覆關係；但真正順序還包含 managed prepend、user、append、built-in 及 plugin dependencies，不能只假設安裝順序。[事件文件](https://code.claude.com/docs/en/plugins/mods/events)

這對安全很重要：計數器漏呼叫 `next` 會改變工具行為；保護性 Mod 若丟例外，預設跳過 handler 的行為又可能使它 **fail open**。詳見[安全章](05-security.md)。

## 先選最小足夠的機制

以下為文件能力比較；「優先選它」是研究建議，不代表其他方式絕對做不到。

| 機制 | 主要控制面 | 適合的例子 | 何時不必升級成 Mod |
| --- | --- | --- | --- |
| Project instructions／memory | 專案長期指示與記憶 | 語言、測試指令、團隊慣例 | 只是讓 Claude 知道規範 |
| Skill | 按需載入的知識與工作流程 | 發版檢查、特定框架操作 | 不需要攔截事件或 native UI |
| Subagent | 工作委派與 context 隔離 | 分別分析測試、架構、效能 | 需要角色分工而非改宿主行為 |
| Settings hook | 生命週期上的腳本／HTTP／prompt | 格式化、通知、工具呼叫檢查 | 現有 script 就能完成 |
| MCP server | 外部工具／資料連線 | 查 Jira、資料庫、內部 API | 能力重點在資料源與工具 |
| Statusline | 自訂狀態列 command | model、branch、context 百分比 | 只需要單行資訊、不需按鈕 |
| **Mod** | 程式內事件、UI、commands、turns | pane、確認按鈕、事件改寫 | 確實需要上述控制面才選 |
| Agent SDK | 在自己程式裡嵌入 agent | 後端任務、CI agent、獨立產品 | 目標不在 Claude Code 宿主內 |
| Client patcher | 修改供應商程式／binary | 未有官方擴充點的實驗 | 官方設定或 Mod 可做就先避免 |

依據：[擴充功能總覽](https://code.claude.com/docs/en/features-overview)、[Mods 比較](https://code.claude.com/docs/en/plugins/mods/overview#compare-mods-settings-hooks-skills-and-mcp-servers)、[statusline](https://code.claude.com/docs/en/statusline)、[Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)。Client patcher 的個案依據見 [tweakcc 比較](03-alternatives.md)。

**MCP 與 Mod 可以互補**：MCP 提供有認證、可重用的外部工具；Mod 呈現狀態與處理互動。不要為了畫一個面板，把認證、重試、資料存取全部重新塞進 Mod。

## 能執行 hook，不代表看得到 UI

| 執行位置 | 已載入 plugin 的 hooks | Mod 的 pane／band／替換列 |
| --- | --- | --- |
| Terminal CLI，含 IDE integrated terminal、JetBrains | 執行 | 顯示 |
| Desktop Code tab，非 WSL | 執行 | 顯示；部分元件只支援 terminal |
| Desktop 的 WSL session | 不執行，該處不支援 plugins | 不顯示 |
| VS Code extension chat panel | 執行 | 不顯示 |
| `claude -p`／Agent SDK | 執行 | 不顯示 |
| Remote Control | 在承載 session 的本機執行 | 在該機 terminal 顯示，不是手機端 |
| Cloud session | plugin 有帶入 session 才執行 | 不顯示 |

來源：[Where mods run](https://code.claude.com/docs/en/plugins/mods/overview#where-mods-run)。UI-only Mod 要明示限制，或提供 command text／transcript fallback；不要默默等待不存在的按鈕。

## API、版本和載入限制

- Claude Code 直接載入 JS／TS，無需 npm runtime 或 bundler；不代表任意 npm 套件可 import。
- hooks module 不是 Node.js 環境：沒有 Node APIs、`require`、動態 import 或一般 timer globals。檔案／網路／程序透過 `$` API 存取。
- 使用頂層相對 import，檔案必須在 plugin 內；正式 hooks module 唯一允許的 bare import 是 `claude-code`。測試檔另使用專用 `claude-code/testing`。
- 事件名稱須為 literal；`$` API 呼叫須能靜態分析，不可任意 alias／destructure／computed access。可把 `$` 傳入同檔頂層函式，但不能任意傳給 imported／巢狀函式。
- `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` 是失效的 early-access 旗標；≥2.1.287 不理會它，設 `0` 不能用來停用 Mods。
- `--plugin-dir` 適合開發與單 session 試用；已安裝 plugin 有 version cache，修改來源後需要版本與更新流程。

來源：[Create](https://code.claude.com/docs/en/plugins/mods/create)、[API](https://code.claude.com/docs/en/plugins/mods/api)、[Reference](https://code.claude.com/docs/en/plugins/mods/reference)。本次讀取的 reference 描述 2.1.289；升級後以該 build 產生的 types 為準，不把本頁視為永久 API 保證。

## 建議導入順序

1. 找出具體痛點，先試官方設定、skill、hook 或 statusline。
2. 若需要互動或事件鏈，先做不連網、不改權限的 observer。
3. 驗證不吞事件、不重複執行工具、不保存敏感參數。
4. 才加入 UI、持久化或外部 API；每新增一種能力都重新審查資料流。
5. 政策／權限控制最後做，而且不能替代 OS、容器、IAM 或 CI 的獨立控制。
