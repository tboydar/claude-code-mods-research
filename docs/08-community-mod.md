# 08 · next-steps：真正使用原生 Mods 的社群案例

[回首頁](../README.md) · 查閱日期：2026-10-05 · 本章為原始碼／文件研究，未安裝或執行。

官方 [Mods 展示頁](https://claude.dev/mods) 在本次查閱時，於「FROM THE COMMUNITY」列出 **next-steps**。它與[六個周邊專案](03-alternatives.md)不同，確實使用新的 hooks module。這不代表所有社群 Mod 只有一個，只表示該展示頁當時列出一個。

研究對象：[anthropics/claude-plugins-community 的固定快照](https://github.com/anthropics/claude-plugins-community/tree/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps)，plugin metadata 版本 1.0.0、作者 Thariq Shihipar。

## 使用者看到什麼

一個回答結束後，在輸入框上方出現最多三個下一步，例如補測試、處理剛發現的錯誤或執行合適的 skill。

- 按 `1`／`2`／`3` 或點擊，把建議放進 prompt composer，**只是草稿，不自動送出**。
- 按 `0` 隱藏建議。
- 第一項也可成為 ghost-text suggestion，按 Tab 接受；最後仍由使用者編輯、按 Enter。
- 新 turn 開始時隱藏舊建議；README 限定 terminal 顯示，不可由「Mods 支援 Desktop」推論這一個 plugin 也有 Desktop UI。

來源：[README](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/README.md#L13-L27)、[草稿互動程式](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/hooks/register.tsx#L186-L226)。

## 為什麼這是 Mod，而不只是 skill

[Hooks 設定](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/hooks/hooks.json) 的 `modules` 指向 `register.tsx`。程式註冊 `turn.start`、`turn.complete` 和 `ui.render`／`AbovePrompt`，在正常且足夠長的回答後用 `$.model.fork` 產生建議，再透過 `$.prompt.fill` 填草稿。

Skill 可以教 Claude 建議下一步，但不能直接提供這種宿主 event → 背景推論 → 原生互動的整合。Settings hook 也能在結束時通知，卻不是這個可選取並填入 composer 的 UI。

## 資料與成本並不為零

- `$.model.fork` 使用 session 對話上下文；預設也用 `$.command.list()` 加入非 builtin command／skill 的名稱與經整理的描述。設定 `suggestSkills` 可停用後者。
- 原始碼未自行讀 API key 或設定第三方 endpoint；它仍新增一次使用宿主憑證的模型推論，不等於沒有額外資料處理或用量。
- README 將成本描述成約一個短回覆，這是**作者自述**，不是固定價格或實測 benchmark。模型、context、cache 命中與使用頻率都會影響成本。
- 背景生成不阻塞原 turn completion，但結果仍有等待時間；預設回答未達 80 字元就跳過，減少不必要生成。

來源：[commands 與 prompt](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/hooks/register.tsx#L60-L106)、[fork 及過期結果檢查](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/hooks/register.tsx#L150-L183)、[設定](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/.claude-plugin/plugin.json#L10-L24)。

## 值得學的防錯與尚未證明的事

程式有輸出長度限制、控制字元／不可見字元整理、slash-command 名稱驗證，以及 turn ID 過期結果防護；這些是值得研究的原始碼模式，不代表建議內容必然正確。Command listing 失敗等降級情況也要再測。[解析與清理](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/hooks/register.tsx#L23-L139)

狀態是 module-local；hot reload 重設，沒有持久化。此快照目錄未附 plugin-specific 自動化測試檔，本研究也未做 live test，所以不宣稱上述防護已由本站驗證。

**價值假說：**降低「下一步該做什麼」的認知負擔，但也可能誘發不必要的追加工作。應量測建議接受率、編輯率、誤導／撤回率，以及每個有用建議的額外成本。只算點擊率會把誘導操作誤認為價值。

## 安裝識別字與授權注意

展示頁的識別字是 `next-steps@claude-community`。若讀者決定自行試用，先按[市集說明](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/README.md#L11-L22) 加入 `anthropics/claude-plugins-community`，審查目前版本，再安裝；本 repo 不會代為安裝。

Plugin [manifest](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/next-steps/.claude-plugin/plugin.json#L1-L9) 宣告 MIT，但此快照沒有 plugin-specific MIT 授權全文或 notice，repo 根 [LICENSE](https://github.com/anthropics/claude-plugins-community/blob/87c843d52c12f4bc91bb23b47132eb08b70e6cb6/LICENSE) 則為 Apache-2.0。研究可連結與說明；若要複製、修改或再散佈，應先釐清授權範圍，不把兩者混寫成單一確定結論。
