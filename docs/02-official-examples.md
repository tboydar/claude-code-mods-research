# 02 · 七個官方範例：能學什麼，不能推論什麼

[回首頁](../README.md) · 2026-10-05 快照 · **本章是文件／原始碼研究，未安裝或執行這七個 Mod。**

## 先區分 playground 與 built-in

- [Claude Code Playground](https://github.com/anthropics/claude-code-playground/tree/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods) 提供三個可學習的完整 plugin：Token Weather、Blast Radius、Replay Theater。採 [Apache-2.0](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/LICENSE)，[按原樣提供，沒有支援／維護承諾](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/README.md#L1-L10)。
- [Claude Code 的 mods 目錄](https://github.com/anthropics/claude-code/tree/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods) 公開部分 built-in 原始碼。其 repo [保留所有權利並指向 Commercial Terms](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/LICENSE.md)，**公開可讀不等於開源授權**。本研究不複製其程式。

| 範例 | 可以學的模式 | 相較簡單方案的增值 | 最重要限制 |
| --- | --- | --- | --- |
| Token Weather | usage → session state → AbovePrompt | 每回合趨勢與結構化 UI | 不是壓縮點預測，與同位置 UI 可能競爭 |
| Blast Radius | tool.call hold → 影響分析 → 人工確認 | 在同一次工具呼叫前提供互動資訊 | 啟發式 shell 偵測，不是安全邊界 |
| Replay Theater | tool.call 記錄 → command → timeline | 按順序理解編輯嘗試 | 執行前記錄，失敗 edit 也會出現 |
| diff | Git 狀態 → 即時 pane → prompt context | 變更檢視和對話整合 | Git 限定，不是任意檔案的完整歷史 |
| agents-md | instruction context 改寫 | 跨 agent 指示檔整合 | 與原生指示載入器並非完全等價 |
| sec-default | managed hook-chain／載入政策 | 保護組織控制不被 user mods 改寫 | 只保護指定 managed 邊界，非 sandbox |
| telemetry | 共用 API namespace → 批次傳送 | 展示內建 Mod 的 API 組合 | 限 built-in caller，非通用 telemetry SDK |

以下把已讀取的程式行為和上游自述分開。表中的「增值」是研究判斷，沒有量化效率證據。

## Token Weather：先問 statusline 是否已足夠

**情境：**長 session 中，希望知道 context 是否持續變大，不用反覆打開資訊指令。

**原始碼確認：**`session.start` 初始化，`turn.complete` 排除 subagent 後呼叫 `$.session.usage()`，`ui.render` 在 `AbovePrompt` 繪製 token 百分比、天氣級別和最近 12 回合趨勢。天氣判斷是本地邏輯，不需要另叫模型。[事件與資料流](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/token-weather/hooks/token-weather.mjs#L29-L75)

**價值：**把靜態數字變成可掃讀的趨勢。若只需要目前百分比，statusline 通常更輕，不值得只為裝飾引進 Mod。

**限制：**百分比相對完整 context window，不是 auto-compact 觸發點；每回合更新而非 token 級串流；記憶體歷史會重設；首次回應前可能為零。讀 usage 失敗時程式保留舊值，因此 UI 也可能過期。[上游限制](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/token-weather/README.md#L111-L119)

**同名不代表同版：**[官方開發教學](https://claude.dev/blog/getting-started-with-claude-code-mods/) 已使用可跨 reload 的 `$.state`，並強調 UI props 應從 `e.props` 讀取；此 playground 快照仍使用 module-local history，以及 `e.hasSurvey`／`e.bodyColumns`。因此不能把教學版本的狀態保留或 UI 相容性直接套到該快照；本研究未執行它，不能保證目前版本的 survey 讓位與寬度適配正常。

**應量測：**發現 context 壓力的時間、是否真的減少不必要讀檔，而不是把「天氣變晴」當品質提升。

## Blast Radius：高價值的人機確認，不是完整防護

**情境：**執行刪檔、Git reset／clean／force push 或 migration 前，先看可能受影響的資產，再決定繼續或取消。

**原始碼確認：**攔截 Bash `tool.call`，做檢查、開 pane，等按鈕決定；視窗太窄時退回 `AbovePrompt`。取消、等待逾時或處理錯誤時拒絕該次被攔截的呼叫。量測會用 `$.process.run` 執行 Bash、Git、find、du 或專案 migration status 工具。[持有工具呼叫](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/blast-radius/hooks/blast-radius.mjs#L26-L121)

**不能省略的限制：**

- 它用 regex 分段與簡化 tokenizer，**不是完整 shell parser**；間接執行、`bash -c`、`xargs rm`、`find -delete` 等可能漏網。
- 同行有多個危險片段時只量測第一個，按 Proceed 執行的卻是整行。
- 只看 Bash，不攔截其他工具或所有檔案編輯。
- migration 的「查狀態」會在人工確認之前載入專案程式碼，不能保證無副作用。
- force-push 分析依賴上次 fetch 的資料；檔案計數是估計。
- `AbovePrompt` 被其他 Mod 佔用時可能看不到操作按鈕。

來源：[classifier](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/blast-radius/hooks/blast-radius.mjs#L139-L291)、[上游限制](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/blast-radius/README.md#L113-L126)。

**上游測試自述也有限制：**README 說 live tests 發生於後續安全修正之前；修正後使用 Node stand-in 測試，未重新跑 live session。不能將它描述為「全面實戰驗證」。[測試紀錄](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/blast-radius/README.md#L57-L62)

**價值與驗收：**應看誤報率、漏報率、確認時間，以及取消後是否確實沒有執行；不可只展示一個成功攔下 `rm` 的影片。真正禁止操作仍需獨立權限邊界。

## Replay Theater：編輯時間軸不是落盤稽核

**情境：**一個長回合改了好幾個檔案，使用者想逐步瞭解 Claude 做了什麼。

**原始碼確認：**以 `tool.call` 觀察 Edit／Write／MultiEdit，在執行之前記錄；`session.start` 註冊 `/replay`，以 command 和 pane／band 顯示 before／after。Write 會嘗試先讀舊內容，diff 有行數上限。[事件處理](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/replay-theater/hooks/replay-theater.mjs#L182-L248)

**價值：**適合教學、理解推進順序，補充 Git 最終 diff 沒有的時間資訊。

**限制：**被拒絕或失敗的編輯也會被記錄；Edit 只比較替換字串，並非完整檔案；大檔 diff 會退化；reload／session 結束後歷史消失。README 還列出 MultiEdit 與某些 fallback 未測。[上游限制](https://github.com/anthropics/claude-code-playground/blob/569c5283d9a0a7ee7938df85bb32e4f48cbb8c86/claude-code/mods/replay-theater/README.md#L111-L121)

**選型：**只要知道最終落盤變更，先用 Git 和內建 `/diff`；需要教學時間軸才增加 replay。若用於稽核，還必須對應 tool outcome、落盤快照與不可竄改紀錄。

## diff：成熟宿主功能如何成為 Mod

**情境：**一邊讓 Claude 修改、一邊檢查 working tree hunks，並把需要討論的部分帶回 prompt。

**原始碼／README 確認：**使用 command、工具事件、pane render、scroll/focus、prompt submit、session messages、Git subprocess 與 state。內建功能不需另外從研究 repo 安裝；可以研究其架構，不能假設 source directory 的載入方式與所有 built-in 權限相同。[能力與事件](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/diff/README.md#L68-L101)

**價值：**展示 Mod 可承載可替換的宿主功能，不只小型裝飾。**代價：**Git backend、輪詢／refresh、pane layout、state 和效能都要維護；本研究沒有量化其 overhead。

## agents-md：指示檔整合不是單純字串拼接

**情境：**團隊在多種 agent 之間共用 `AGENTS.md`，希望正確載入祖先及子目錄指示。

**原始碼確認：**改寫 `prompt.context` 的 structured instruction files；Read 後處理 nested 指示，fork 時複製已交付集合。這比把文字直接塞進 prompt 更能配合宿主 framing。[原始碼](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/agents-md/hooks/register.ts#L99-L255)

**限制：**README 列出與 CLAUDE.md loader 的差異，包含檔案類型、IDE opened file、`--add-dir`、symlink、`/memory` 等，不可宣稱完全等價。[差異清單](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/agents-md/README.md#L125-L158)

**價值：**減少跨工具重複規範；**風險：**repo 中的指示本身可能不可信。先檢查內建設定是否已符合需求，不要直接 fork 一套 loader。

## sec-default：保護 managed 邊界，不能替代 sandbox

**情境：**組織允許工程師裝 Mod，但不想讓它覆寫既有 managed policies。

**原始碼確認：**檢查 hook chain 的來源／tier，保護 managed hooks、部分 prompt／settings／tool metadata／deny 規則，並可限制 user-tier mod 載入。它保護既有政策，不會自動新增完整組織政策。[guard 實作](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/sec-default/hooks/register.ts#L20-L115)

**重要限制：**需要正確的 managed prepend 位置；當一般 user plugin 用 `--plugin-dir` 載入，不能取得同等 tier 控制力。也不阻止 Mod 使用自己的檔案／程序能力。[tier 限制](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/sec-default/README.md#L178-L188)、[官方管理文件](https://code.claude.com/docs/en/plugins/mods/admin)

**價值：**研究政策如何組合及保留 provenance。企業應讀[安全章](05-security.md)，不要將它作為可下載即得的安全認證。

## telemetry：學 API 組合，而不是拿來當第三方 SDK

**情境：**Claude Code 的 built-in mods 共用產品分析介面，批次傳送第一方 metadata。

**原始碼確認：**在 `engine.create` 提供 namespace，處理 `telemetry.log/mark`，限制 caller，並於結束時 flush。[事件與授權](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/telemetry/hooks/register.ts#L23-L85)

**限制：**不接受一般 user／managed plugin caller；README 明示不是以 `--plugin-dir` 安裝的工具。它是遙測，並非可靠稽核傳輸；開關、網路失敗、重試上限會影響送達。[README](https://github.com/anthropics/claude-code/blob/2bfb629dfaff0c8318047a4beb93cf1dc5b58b18/mods/telemetry/README.md#L41-L97)

**價值：**證明 Mod 可以提供給其他元件使用的 API，不只攔單一事件。第三方如要記錄資料，仍須設計自己的同意、最小化、保留、刪除與目的端管理。

## 如果要親自試官方 playground

先讀該固定版本的 README 與 hooks module，再在無生產憑證的可拋棄環境試用。以下僅為讀者操作流程，**本研究未執行載入步驟**：

```bash
git clone https://github.com/anthropics/claude-code-playground.git
git -C claude-code-playground switch --detach 569c5283d9a0a7ee7938df85bb32e4f48cbb8c86
claude plugin validate ./claude-code-playground/claude-code/mods/token-weather
# 閱讀 validate 的 hooks/calls 與來源後，才自願載入單次 session：
claude --plugin-dir ./claude-code-playground/claude-code/mods/token-weather
```

不要在含生產憑證的日常環境，以破壞性操作示範 Blast Radius；它的原理與已知漏網案例，光是閱讀程式就值得研究。
