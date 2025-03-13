#docker build -t margiet-crawl-engine:0.0.1 --progress=plain --platform linux/amd64 . --network=host
docker build -f ./bun.Dockerfile -t crawl-engine-bun:0.0.1 --progress=plain --platform linux/amd64 . --network=host
