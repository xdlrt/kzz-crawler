## 可转债投资系统

[![run](https://github.com/xdlrt/kzz-crawler/actions/workflows/run.yml/badge.svg?branch=main)](https://github.com/xdlrt/kzz-crawler/actions/workflows/run.yml)

基于集思录可转债数据，结合飞书多维表格，实现自动化更新行情数据，并筛选出值得投资的可转债。

仅供学习交流，不作为任何投资决策依据。

### 使用方法

fork 这个仓库，在 settings -> Secrets -> Actions 中添加 Secret。

- JSL_ACCOUNT：集思录账号（无需会员）
- JSL_SECRET：集思录密码
- app_id：飞书开放平台应用 app_id
- app_secret：飞书开放平台应用 app_secret
- app_token：多维表格文件 app_token
- table_id：多维表格文件中的表对应的 table_id

可手动触发 workflow 运行进行测试。

![image](https://user-images.githubusercontent.com/13093537/200153872-1be4aa00-66bc-46a2-8fbe-6f06c034a30e.png)
