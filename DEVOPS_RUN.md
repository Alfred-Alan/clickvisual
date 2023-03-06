

## 启动容器
docker-compose -f docker-compose.devops.yml up


## 打包前端代码
cd ./ui

yarn install

npm run build 

cp -r ./dist ../api/internal/ui/dist

## 启动主程序
go run ./api/main.go --config=./config/default.toml

## 页面账号密码
clickvisual

clickvisual


## 本地clickhost dsn
clickhouse://root:root@127.0.0.1:9000/default?dial_timeout=200ms&max_execution_time=60

