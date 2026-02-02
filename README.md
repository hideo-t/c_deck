# カセットデッキ・シミュレーター

TASCAM 202 mkVIIの雰囲気を持つ、精密なカセットデッキのブラウザシミュレーター。

## 特徴

- **リアルな操作感**: POWER、EJECT、PLAY、STOP、PAUSE、REW、FFWD、RECORD など完全な操作
- **精密なカセット窓**: コンパクトカセット（100mm×63mm）の実寸比に基づくリール配置
  - リール中心間距離: 本体幅の46%（実寸準拠）
  - リール直径: 視覚的バランスで最適化
  - 真円保証とアスペクト比固定で画面サイズに依らず自然な見た目
- **アニメーション**: リールの回転、LEDメーター、カウンター表示
- **テープ劣化システム**: 使用状況によりテープが劣化し、最終的には絡まるイベントも
- **サウンドエフェクト**: ボタンクリック音、テープヒス、トランスポート音（WebAudio API）
- **モバイル完全対応**: スマートフォンの縦画面1画面に最適化、スクロール不要

## 使い方

1. **POWER** ボタンを押して電源ON
2. カセットが入っている状態で **PLAY** を押すと再生開始
3. **EJECT** でカセットを取り出し（テープメンテナンス効果）
4. **REC** + **PLAY** で録音（テープ劣化が進む）
5. **REW/FFWD** で巻き戻し・早送り（多用すると劣化）
6. **RETURN TO ZERO** でカウンター0まで自動巻き戻し
7. テープ劣化が進むとメーターが暴れたり、カウンターが飛んだりします
8. 劣化が極限に達すると「テープ絡まり」イベントが発生！

## ファイル構成

```
cassette-deck-simulator/
├── index.html    # メインHTML
├── style.css     # スタイルシート
├── main.js       # JavaScript ロジック
└── README.md     # このファイル
```

## GitHub Pages デプロイ手順

1. GitHubで新規リポジトリを作成
2. このフォルダの内容をリポジトリにプッシュ:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. リポジトリの Settings → Pages
4. Source を "main branch" に設定
5. 数分後、`https://YOUR_USERNAME.github.io/YOUR_REPO/` でアクセス可能

## 技術スタック

- Vanilla HTML/CSS/JavaScript のみ
- 外部ライブラリ不要
- WebAudio API（サウンド）
- CSS Animations（リール回転）
- requestAnimationFrame（メーター更新）

## ブラウザ対応

- Chrome/Edge（推奨）
- Safari（iOS含む）
- Firefox

音声機能は最初のユーザー操作後に有効化されます（ブラウザの自動再生ポリシー対応）。

---

© 2026 Cassette Deck Simulator - レトロハードウェアへのオマージュ
