// 用於移除 demo.html 中時區相關代碼的腳本
const fs = require('fs');

let content = fs.readFileSync('apps/api/public/demo.html', 'utf8');

// 移除時區相關的變數引用
content = content.replace(/currentTimezone/g, "'Asia/Taipei'");

// 移除時區相關的 API 參數
content = content.replace(/&timezone=\${[^}]+}/g, '');
content = content.replace(/\?timezone=\${[^}]+}/g, '');
content = content.replace(/timezone=\${encodeURIComponent\([^)]+\)}/g, '');

// 移除時區選擇器相關的 DOM 操作
content = content.replace(/\$\("#new-user-timezone"\)[^;]+;/g, '');
content = content.replace(/\$\("#edit-user-timezone"\)[^;]+;/g, '');
content = content.replace(/\$\("#editTimezone"\)[^;]+;/g, '');

// 移除時區相關的表單欄位
content = content.replace(/timezone:\s*\$\('#[^']+'\)\.value[,}]/g, '');

// 移除時區顯示
content = content.replace(/時區：\${[^}]+}/g, '時區：Asia/Taipei');

fs.writeFileSync('apps/api/public/demo.html', content);
console.log('已移除 demo.html 中的時區相關代碼');
