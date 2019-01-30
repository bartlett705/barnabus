tsc
cp build/index.js .
rm -rf build
rm package-lock.json
zip -r deploy.zip . -x .gitignore *.zip *.ts *.git* node_modules/typescript/\* node_modules/@types*/\* node_modules/ts*/\* build/\*