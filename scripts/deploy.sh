tsc
rm *.ts
cp build/index.js .
rm -rf node_modules/ts*
rm -rf node_modules/typescript*
zip -r ../deploy.zip . -x "*.json" -x ".gitignore" -x "build" -x "node_modules/ts*" -x "node_modules/typescript"