tsc
cp build/index.js .
rm -rf build
mv package-lock.json ../temp-lock.json
zip -r deploy.zip . -x .gitignore *.zip *.ts *.git* node_modules/typescript/\* node_modules/@types*/\* node_modules/ts*/\* build/\*
mv ../temp-lock.json ./package-lock.json