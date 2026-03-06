\# トラブルシューティング



\## データ件数が合わない



原因



visit\_key が null



---



\## 修正



Supabase SQL



update responses

set visit\_key = (created\_at at time zone 'Asia/Tokyo')::date::text

where visit\_key is null;



---



\## Adminアクセス不可



確認



ADMIN\_TOKEN



---



\## Supabase接続エラー



確認



env設定

