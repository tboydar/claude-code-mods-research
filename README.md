# Claude Code Mods 研究

以繁體中文研究 **Claude Code 官方 Mods**：能做什麼、何時值得用、有哪些真實範例，以及相較 skills、hooks、MCP 與第三方工具的價值和代價。

**研究快照：2026-10-05（Asia/Taipei）。** 官方於 [2026-10-01 發表 Mods](https://claude.com/blog/claude-code-mods)；[文件要求 Claude Code ≥2.1.287](https://code.claude.com/docs/en/plugins/mods/overview)。這是獨立研究，不是 Anthropic 官方產品、完整安全稽核或效能排行榜。

## 先講結論

- **Mods 不是「所有外掛」的別名。** 官方 Mod 是 plugin 裡的 JavaScript／TypeScript hooks module，能在 Claude Code 內部觀察、改寫或接手事件；skill、MCP server、模型代理和 binary patcher 是不同機制。
- **最有辨識度的價值是互動 UI 與事件整合。** 例如在工具執行前呈現影響範圍、用面板追蹤 CI、逐步回放變更，或加入不需要模型回合的指令。
- **需求能由較窄的擴充完成，就不必使用 Mod。** 重複指示用 skill、格式化腳本用 settings hook、外部資料用 MCP、單行資訊用 statusline。
- **Mods 不受 sandbox 保護。** 它以使用者權限讀寫檔案、啟動程序和連網；`validate` 通過不代表安全。請先讀[安全邊界](docs/05-security.md)。
- **價值必須量測，不以 stars 或展示影片代替。** 本研究沒有宣稱提升多少效率、節省多少 token；附有[對照實驗與 ROI 方法](docs/06-evaluation.md)。

以上機制與權限定義來自[官方概覽](https://code.claude.com/docs/en/plugins/mods/overview)；選型和導入順序是本研究的判斷。

## 閱讀路線

| 想回答的問題 | 內容 |
| --- | --- |
| Mods 的運作方式、版本和介面限制？ | [01 · 原生 Mods 與選型](docs/01-native-mods.md) |
| 有哪些可查原始碼的實例？ | [02 · 7 個官方範例](docs/02-official-examples.md) |
| 跟 Superpowers、OMC、記憶、狀態列等工具差在哪？ | [03 · 6 個周邊專案](docs/03-alternatives.md) |
| 可以做哪些應用，誰會受益？ | [04 · 10 個應用與優先順序](docs/04-use-cases.md) |
| 權限、隱私、供應鏈和政策有哪些陷阱？ | [05 · 安全與部署](docs/05-security.md) |
| 如何證明值得導入？ | [06 · 評估、成本與實驗](docs/06-evaluation.md) |
| 哪些是一手資料？如何處理版本與矛盾？ | [07 · 來源與研究方法](docs/07-sources.md) |
| 社群是否已有真正使用原生 Mods 的案例？ | [08 · next-steps 個案](docs/08-community-mod.md) |
| 想讀最小可驗證的原創程式？ | [research-tally 範例](examples/research-tally/README.md) |

## 三個最值得先研究的方向

1. **Context／工作狀態可視化**：先比較 Token Weather 與 statusline，確認歷史趨勢或互動是否真的必要。
2. **變更理解**：先用內建 `/diff`，再看 Replay Theater 的逐步回放；不要把「嘗試編輯」當成「成功落盤」。
3. **高風險操作的說明與確認**：Blast Radius 是互動模式的好教材，但它不是完整 shell parser，也不是不可繞過的安全控制。

逐例來源、限制與授權在[官方範例比較](docs/02-official-examples.md)。三者是建議研究順序，不是實測排名。

## 最小範例：先觀察，不替使用者決策

本 repo 的 `research-tally` 只計數**到達該 hook 的工具呼叫嘗試**，以 `/research-tally` 回報、`/research-tally reset` 清除；不保存參數或結果，不呼叫檔案、程序、網路或模型 API，不改寫權限，也不加入 UI 面板。

從 repo 根目錄執行以下檢查，不會安裝 plugin 或啟動模型對話：

```bash
claude --version
claude plugin validate --strict examples/research-tally
claude plugin test examples/research-tally
```

完整行為、手動載入方式與**已做／未做驗證**見[範例說明](examples/research-tally/README.md)。本 repo 不是 marketplace，clone 不等於安裝；也不會自動更動你的 Claude Code 設定。

## 證據標示

- **文件／原始碼確認**：已讀取官方頁面或固定 commit 的程式碼；不等於本機執行成功。
- **上游自述**：作者描述的功能或測試；保留其限制，沒有代替作者重跑。
- **本 repo 實測**：只涵蓋[明列的檢查](examples/research-tally/README.md)，不能延伸為其他 mod 的驗證。
- **研究建議／待驗證假設**：應用構想、優先順序和商業價值；不是已交付功能或既成效益。

API、介面和政策仍會變動。比較以快照為準；升級時重跑驗證，並以該版本產生的 types 和最新文件交叉確認。

## 參與與授權

歡迎補充有永久來源連結、版本、測試步驟及反例的研究，方式見 [CONTRIBUTING](CONTRIBUTING.md)。原創說明與 `research-tally` 採 [MIT](LICENSE)；引用來源的商標、文件、程式碼仍依原作者條款，不因被引用而改變授權。
