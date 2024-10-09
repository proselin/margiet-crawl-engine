rm -rf node_temp
mkdir  node_temp &&
cp     package.json node_temp &&
cp     -r libs node_temp/libs &&
npm    i --prefix node_temp &&
docker build -t crawl-engine:0.0.1 --progress=plain --platform linux/amd64 . &&
rm     -rf node_temp
