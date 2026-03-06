\# DeepData システム概要



\## 目的



名古屋港水族館の来館者アンケートを分析するためのツール。



主な用途



・期間比較  

・セグメント比較  

・CSV出力  

・AI分析



---



\## システム構成



Next.js  

↓  

API Routes  

↓  

Supabase  

↓  

Vercel



---



\## URL



https://akw-deepdata.vercel.app



管理画面  

/admin



---



\## データ設計



アンケート回答は



table: responses



に保存される。



分析基準



visit\_key = 来館日



created\_at = 回答日時



分析は visit\_key を使用する。



理由  

人流データと合わせるため。

