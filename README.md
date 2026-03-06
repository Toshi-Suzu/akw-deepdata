\# DeepData



名古屋港水族館のアンケート分析ツール



来館者アンケートデータを分析し、人流データの傾向を説明するためのツール。



---



\## URL



https://akw-deepdata.vercel.app



Admin画面  

/admin



---



\## 技術構成



Framework  

Next.js



Hosting  

Vercel



Database  

Supabase



---



\## 主な機能



・期間比較  

・セグメント比較  

・CSV出力  

・AI分析用データ作成



---



\## 分析思想



① 人流データ  

↓  

異常値発見  



② DeepData  

↓  

アンケートから原因候補抽出  



③ AI分析  

↓  

仮説生成  



---



\## セットアップ

git clone https://github.com/Toshi-Suzu/akw-deepdata.git
cd akw-deepdata
npm install
npm run dev

http://localhost:3000

---

## ドキュメント

詳細は docs フォルダ参照
docs/system_overview.md
docs/setup_guide.md
docs/database_schema.md
docs/operation_manual.md
docs/troubleshooting.md


---

## 管理画面

/admin

初回アクセス時  
ADMIN_TOKEN入力

---

## ライセンス

Internal project

---

## AIサポート

このプロジェクトはAIを使った運用を前提にしています。

新しい担当者は以下の手順で作業してください。

1. このリポジトリの README.md を AI（ChatGPTなど）に読み込ませる
2. docs フォルダの内容も AI に共有する
3. 以下をAIに伝える

「このDeepDataプロジェクトの新しい担当者です。
環境構築と運用方法を教えてください。
1. 開発環境の構築方法
2. ローカル起動方法
3. デプロイ方法
4. システム構成」

AIが手順を説明します。
