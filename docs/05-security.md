# 05 · Mods 不受 sandbox 保護

[回首頁](../README.md) · 查閱日期：2026-10-05 · 本章是來源型風險分析，不是對任何專案的完整安全稽核。

## 先畫對信任邊界

官方明說：**“Mods aren't sandboxed.”** Mod 以目前使用者權限執行，可以看 prompts／tool calls、讀檔與 secrets、啟動程序、連網、改寫事件、替使用者送 prompt、批准工具，也可能消耗模型用量。Claude Code Bash sandbox 不會隔離 Mod 自己啟動的程序。[官方概覽](https://code.claude.com/docs/en/plugins/mods/overview#what-a-mod-can-reach)

「hooks module 不能直接 import Node」不等於安全隔離：它仍能透過 `$.fs`、`$.process`、`$.http`、`$.env` 等 API 接觸敏感資源。靜態分析讓能力可列出，並沒有自動縮小使用者權限。[API](https://code.claude.com/docs/en/plugins/mods/api)、[管理文件](https://code.claude.com/docs/en/plugins/mods/admin)

## 三種威脅不要混為一談

| 威脅 | Mod 可以輔助什麼 | 不能靠 Mod 單獨保證什麼 |
| --- | --- | --- |
| 可信使用者誤操作 | 清楚顯示目標、風險與確認 | 所有 shell 語意／所有工具都被攔到 |
| 不可信 repo／工具輸出 | 有限來源的檢查、脫敏與顯示 | 已外洩秘密回收、全面 prompt injection 防護 |
| 惡意 Mod／本機使用者 | 組織准入、能力盤點與部分政策 | 對方沒有同使用者權限、不能另啟程序／CLI |

表中控制建議是研究判斷。高敏感工作仍須使用受限帳號、短效憑證、OS／容器／VM、IAM 與受控網路等獨立邊界。

## 不要把 permission prompt 當成最後防線

Mod 不能重畫真正的 permission prompt，但可以在 prompt 出現前批准或拒絕工具。依組織 guard 與設定，Mod 可能覆寫 `ask`、非 managed 的 `PreToolUse` block，甚至某些 deny。**「已設 deny rule」不足以推論任意 Mod 都不能觸及同樣資源。** Mod 自己的 `$.fs`／`$.process` 也不受同一組 tool deny rules 限制。[管理文件：預設行為](https://code.claude.com/docs/en/plugins/mods/admin#know-what-happens-by-default)

`sec-default` 預設在有 managed settings，或 Team／Enterprise 登入的情況載入。沒有 managed settings 的 API-key／第三方 provider 使用情境，不能假設一定有它。它保護指定 managed hooks、instructions、settings、MCP metadata 和 deny 邊界；官方同時強調其他行為仍被允許。

管理員可以調整 deny override 與 prepend 順序，因此部署時必須確認**實際生效設定與 hook chain**，不能只看 Mod 名稱。這份研究不更動任何組織設定。

## Middleware 順序與失敗模式

- Managed `PreToolUse` 在 mod `tool.call` 前執行，其 block 有更強的先行效果；其他 settings hooks 的相對位置不同。
- Handler 不呼叫 `next`，可能直接略過後面的 Mod、settings hooks 或工具行為。
- Hook 在 `next` 前 throw、timeout 或回傳錯誤形狀時，預設可被跳過，繼續下游；安全檢查要明確設計 `.catch` 的 fail-closed 行為。
- Hook 在 `next` 後失敗，已發生的副作用不能假裝撤銷；不能為了重試而把非冪等工具執行兩次。
- Installed mod worker 反覆 crash 可使非 built-in mods 被卸載；safe mode 也會略過 installed policy mods。因此政策 Mod 並非不可繞過的常駐防護。

依據：[Events](https://code.claude.com/docs/en/plugins/mods/events)、[Admin](https://code.claude.com/docs/en/plugins/mods/admin)。應對 timeout、異常、下游拒絕、重入、無 UI、順序互換做測試；不能只測 happy path。

## validate、test、live check 各能證明什麼

| 檢查 | 有用的證據 | 不能證明 |
| --- | --- | --- |
| `claude plugin validate --strict` | Manifest、可分析性、hooks／calls 能力清單 | 無惡意邏輯、無外洩、目的端可信 |
| `claude plugin test` | Stubbed events 下的行為、順序、回傳、UI element tree | 真實工具／網路／模型／組織政策都正常 |
| Live session check | 特定 OS、CLI、surface、設定下的實際行為 | 其他版本、平臺或所有輸入都安全 |
| 人工來源／資料流審查 | 能力是否符合目的、來源／版本與依賴是否合理 | 完整形式化證明或不可繞過性 |

官方 test kit 不需登入／session／network；UI 測試也不檢查真實畫面如何 paint。新的 UI layout 仍需 terminal／Desktop 實際檢視。[測試文件](https://code.claude.com/docs/en/plugins/mods/test)

## 安裝與升級前的人工檢查

1. **身份與版本：**確認真正 owner、固定 commit／release、授權與維護訊號；不要把 fork／近似名稱當原專案。
2. **能力盤點：**查看 validate 的 `hooks:`／`calls:`；讀取 `env`、`fs`、`process`、`http`、`model`、`session` 的理由是什麼？
3. **資料流：**哪些 prompts、code、tool results、credentials 會被保存或送出？誰可存取？留多久？如何刪除？
4. **權限：**是否會 override permission、改寫 prompt、代送消息或執行 arbitrary command？UI 上的確認是否真能阻止副作用？
5. **失敗／還原：**禁用、重載、crash、API 斷線時怎麼辦？有無額外 worker、設定修改、資料庫或被 patch binary 要清理？
6. **變更審查：**升版新增 API calls 等於新增能力，不能因上一版可信而自動信任。

`$.http.fetch` 雖受部分組織網路政策約束，但 `$.process.run` 啟動的程序仍有使用者網路權限；不能只 allowlist fetch domains 就宣稱完整 egress 控制。[Admin：仍適用的控制](https://code.claude.com/docs/en/plugins/mods/admin#know-which-controls-still-apply)

## 停用開關有不同範圍

- 停單一 installed Mod：disable／uninstall 它的 plugin。
- 個人 `disableAllHooks`：不只是 Mod，也影響 settings hooks／custom statusline；managed 層另有規則。
- `allowManagedModsOnly`：針對 user-installed Mods，不等於停掉同 plugin 的 skills、MCP 或所有 settings hooks。
- `allowManagedHooksOnly`：範圍更廣，與只禁 Mods 不同。
- `--safe-mode`：略過 installed 自訂內容，包括 installed organization Mod；不能視為「保留所有公司政策」。
- Built-in Mods 不受上述 installed-mod 開關以相同方式控制；各自停用方式以文件為準。

精確範圍、管理層級與優先順序請看[官方管理說明](https://code.claude.com/docs/en/plugins/mods/admin#choose-how-much-to-allow)，不要直接複製來路不明的「關閉所有風險」設定。

## 本 repo 採取的保守範圍

只提供不呼叫模型、不讀寫檔案、不啟動程序、不連網、不改權限的計數範例；在記憶體裡保存工具名稱與數量。不提供自動批准危險命令、憑證轉送或 binary patch 安裝腳本；也不把第三方 README 的測試敘述寫成本站實測。

這是縮小範例能力面，不是對 Claude Code 宿主本身宣稱離線或零遙測。
