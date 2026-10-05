# 參與研究

歡迎以繁體中文補充原生 Mods、相鄰替代方案、實際失敗案例與可重跑評估。不要把廣告文案、GitHub stars 或未執行的範例當成驗證。

## 提交一個案例時

請附上：

- 名稱、canonical repo、版本／固定 commit、查閱日期與授權來源。
- 實際機制：原生 hooks module、settings hook、skill、MCP、statusline、gateway 或 binary patcher。
- 使用者情境、為何比較窄的原生功能不夠、具體價值假說。
- 權限、資料目的端、模型呼叫、持久化、背景服務及已知限制。
- 證據種類：文件、原始碼、上游自述、本機實測或待驗證構想。
- 如有實測，提供環境、測試步驟、預期／實際輸出與失敗案例；先去識別化。

來源與快照格式見[研究方法](docs/07-sources.md)。原始碼請連到固定 commit，不只連 `main`。

## 驗證原創範例

在 repo 根目錄使用支援 Mods 的 Claude Code：

```bash
claude --version
claude plugin validate --strict examples/research-tally
claude plugin test examples/research-tally
git diff --check
```

這些是 static／stubbed checks，不會安裝 plugin。改到 UI 的範例還要實際檢視目標介面；不要只靠 element-tree tests 宣稱畫面正確。新增模型／程序／網路能力時，必須同步更新資料流與安全說明。

本 repo 沒有宣稱已設定遠端 CI。提交前也請檢查所有相對連結能從 GitHub 正確開啟。

## 不應提交的內容

- API keys、token、私密 session transcript、個人本機路徑、內部 repo／客戶資料。
- 含秘密的 screenshots、logs、環境變數或已安裝插件設定。
- 未核對授權的第三方程式碼副本。
- 虛構效能數字、未公開的安全漏洞利用步驟、或默默更改使用者設定的安裝程式。

原創貢獻依本 repo 的 [MIT 授權](LICENSE) 提供；第三方來源仍適用原條款。此 repo 為獨立研究，不代表 Anthropic 背書。
