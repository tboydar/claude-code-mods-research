# research-tally：最小原生 Mod 研究範例

[回研究首頁](../../README.md)

用不到 40 行 hooks module 示範 **observe + 自訂 command + 記憶體 state**。這是依[官方 Create a mod](https://code.claude.com/docs/en/plugins/mods/create) 與[測試 API](https://code.claude.com/docs/en/plugins/mods/test) 撰寫的原創教學範例，不是官方 sample 的完整移植，不宣稱有生產力收益。

## 行為與邊界

- `/research-tally`：列出自 module 載入或上次 reset 以來，**到達本 hook 的 tool.call 嘗試**，按工具名稱排序。
- `/research-tally reset`：清除計數。其他參數顯示 usage、不清除。
- 保留的只有工具名稱與次數；不保留 command、路徑、prompt、arguments、results 或 transcript。
- 每次工具事件原封不動交給 `next(e)` 一次，回傳下游結果；不批准、不拒絕、不重試工具。
- 不呼叫模型、檔案、程序、網路、持久化 API；唯一 Mods API call 是註冊 command。
- 沒有 UI render hook、pane 或 spinner 改動；結果是 command 的文字輸出。

**不是成功執行次數。** 下游拒絕的呼叫仍計數；在上游被攔截、沒有傳到此 hook 的呼叫不計。只要事件送達就計入，沒有主 agent／subagent 拆分；不能當完整稽核、billing 或成功率資料。

Module reload／新 session 重置記憶體；這裡沒有使用 host `$.state` 或 `$.store` 保留資料。它也不以 `/clear` 作為計數邊界；要明確重新計數請用 `reset`。工具名稱本身也可能透露整合名稱，分享輸出前仍需檢查。

## 檔案

- [Plugin manifest](.claude-plugin/plugin.json)
- [Hooks module 設定](hooks/hooks.json)
- [完整實作](hooks/register.js)
- [六個行為測試](tests/research-tally.test.ts)

## 無 session／無模型的檢查

需要支援 Mods 的 Claude Code；官方最低版本是 2.1.287，本範例在 **2.1.289、macOS arm64** 驗證。沒有 npm dependencies 或 install script；執行以下命令不會安裝此 plugin：

```bash
# 從研究 repo 根目錄執行
claude plugin validate --strict examples/research-tally
claude plugin test examples/research-tally
```

2026-10-05 本機實際結果：

```text
hooks: session.start, tool.call, command.run{command=research-tally}
calls: $.command.register
Validation passed

6 pass
0 fail
Ran 6 tests across 1 file.
```

測試先在空的 `register` 實作上得到 **0 pass／6 fail**，再加入行為得到上述結果。測試涵蓋：command 註冊與 session 轉交、零次與重複查詢、Read 2 次／Bash 1 次的不對稱計數、下游 denial 保留、reset、不明參數與無關 command 不被攔截。

**測試工具呼叫都有 stub，不會真的讀檔或執行 Bash。** 驗證的是 Mod 處理事件的邏輯；不是實際模型工作、完整權限引擎或跨平臺驗證。本次沒有在互動 session／Desktop 載入它，也沒有進行 headless 真實 session smoke test；未測過的部分不標示通過。

## 讀過來源後，才自行試用

以下是讀者可自行執行的步驟，**不是本次已執行紀錄**。Mod 沒有 sandbox；只在你信任的環境載入。

```bash
claude --plugin-dir ./examples/research-tally
```

在該 Claude Code session 先輸入 `/research-tally`，應顯示 0；要求它做少量唯讀工作後再查詢，數量依真正到達 hook 的工具呼叫而定；最後試 `/research-tally reset`。熱重載也會讓記憶體計數歸零。

沒有額外 installation；離開 session、下次不傳 `--plugin-dir`，就不會從這條路徑載入它。未提供 marketplace，避免把研究 clone 變成自動安裝來源。

## 不要直接加成安全閘門

本範例刻意不改 permission、不讀完整 tool results。如果要延伸成 masking、policy 或持久 log，先重新設計[資料與權限邊界](../../docs/05-security.md)，補失敗／重入／多 Mod 順序測試；不能把計數測試通過當成安全功能已驗證。
