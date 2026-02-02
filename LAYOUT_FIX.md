# カセット窓リール配置の実寸比修正

## 修正概要
コンパクトカセットの実寸比（100mm × 63mm）に基づき、カセット窓内のリール配置を自然に見えるように修正しました。

## 実装した実寸比（CSS変数で管理）

```css
:root {
    /* コンパクトカセット規格準拠 */
    --cassette-aspect-ratio: 1.587;  /* 100mm / 63mm */
    --reel-center-left: 27%;         /* 左リール中心位置 */
    --reel-center-right: 73%;        /* 右リール中心位置 */
    --reel-center-y: 52%;            /* リール垂直位置（中央より少し上） */
    --reel-size: 30%;                /* リール直径（視覚的最適化） */
    --tape-strip-inset: 29%;         /* テープ帯インセット */
}
```

## 実寸比の根拠

### カセット外形
- 幅: 100mm
- 高さ: 63mm
- アスペクト比: 1.587

### リール配置
- **中心間距離**: 約46mm（外形幅の46%）
  - 実装: 左27% + 右73% = 中心間46%
- **リール直径**: 約23mm（外形幅の23%）
  - 本体内部高さ約48mmに対して23mm = 48%
  - 視覚的バランスで30%に調整
- **垂直位置**: 中央より少し上（52%）

## 主な変更点

### 1. カセット窓のアスペクト比固定
```css
.cassette-window {
    aspect-ratio: var(--cassette-aspect-ratio);
    width: 100%;
    /* 高さは自動計算されるため固定値削除 */
}
```

### 2. リールの絶対配置
```css
.reel {
    position: absolute;
    width: var(--reel-size);
    height: var(--reel-size);
    aspect-ratio: 1;  /* 真円保証 */
    top: var(--reel-center-y);
    transform: translateY(-50%);
}

.reel-left {
    left: var(--reel-center-left);
    transform: translate(-50%, -50%);
}

.reel-right {
    left: var(--reel-center-right);
    transform: translate(-50%, -50%);
}
```

### 3. カセット本体の配置変更
```css
.cassette-body {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 88%;
    height: 68%;
    /* flexbox削除、子要素は絶対配置 */
}
```

### 4. リール回転アニメーション修正
```css
@keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
```
配置のtransformと回転を共存させるため、アニメーション内でtranslateを維持。

### 5. テープストリップの位置調整
```css
.tape-strip {
    position: absolute;
    top: var(--reel-center-y);
    transform: translateY(-50%);
    left: var(--tape-strip-inset);
    right: var(--tape-strip-inset);
}
```

### 6. リール内部パーツの比率化
```css
.reel-center {
    width: 33%;   /* リール直径の33% */
    height: 33%;
}

.reel-spoke {
    width: 3%;    /* 相対的な太さ */
    min-width: 2px;
}
```

## レスポンシブ対応

### モバイルでの調整
- 固定サイズ（60px, 45px, 30px等）を削除
- CSS変数による比率ベースの計算に統一
- アスペクト比は全画面サイズで維持
- 小画面ではボーダー幅を調整（2px → 1.5px）

```css
@media (max-width: 480px) and (max-height: 900px) {
    .reel {
        border-width: 1.5px;
    }
}
```

## デバッグ機能

ブラウザのコンソールに配置情報を出力：
```javascript
function debugCassetteLayout() {
    // 窓サイズ、リール位置、中心間距離等を計算して出力
    console.log('=== カセット窓レイアウト情報 ===');
    // ...
}
```

開発者ツールで以下の情報を確認可能：
- 窓のアスペクト比
- リール中心座標（ピクセル・パーセント）
- リール中心間距離
- リール直径

## 期待される効果

✅ リール間隔が自然（狭すぎ/広すぎない）
✅ リールが真円（楕円にならない）
✅ 画面サイズが変わっても比率維持
✅ iPhone Safariでも崩れない
✅ より実物に近い見た目

## 使用方法

1. ブラウザでindex.htmlを開く
2. F12で開発者ツールを開く
3. コンソールに配置情報が表示される
4. 画面サイズを変更しても比率が維持されることを確認

---

© 2026 Cassette Deck Simulator
