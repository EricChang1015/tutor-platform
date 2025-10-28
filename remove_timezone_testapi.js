// 用於移除 testAPI.html 中時區相關代碼的腳本
const fs = require('fs');

let content = fs.readFileSync('apps/api/public/testAPI.html', 'utf8');

// 移除時區選擇器的 CSS
content = content.replace(/\.timezone-selector[^}]+}/g, '');

// 移除時區選擇器的 HTML
content = content.replace(/<div class="timezone-selector">[\s\S]*?<\/div>/g, '');

// 移除時區相關的變數和函數
content = content.replace(/let currentTimezone[^;]+;/g, '');
content = content.replace(/function getCurrentTimezone\(\)[^}]+}/g, '');
content = content.replace(/function updateTimezone\(\)[^}]+}/g, '');
content = content.replace(/function updateCurrentTimeDisplay\(\)[^}]+}/g, '');
content = content.replace(/function initializeTimezone\(\)[^}]+}/g, '');

// 移除時區相關的初始化調用
content = content.replace(/initializeTimezone\(\);[^\n]*/g, '');

// 移除時區相關的測試
content = content.replace(/timezone=\${getCurrentTimezone\(\)}/g, '');
content = content.replace(/&timezone=[^&"']+/g, '');
content = content.replace(/\?timezone=[^&"']+/g, '');

// 移除時區相關的測試案例
content = content.replace(/'搜尋可用教師 \(台北時區\)'/g, "'搜尋可用教師'");
content = content.replace(/'教師時間表 \(當前時區\)'/g, "'教師時間表'");
content = content.replace(/'預約清單 \(當前時區\)'/g, "'預約清單'");
content = content.replace(/'建立預約 \(台北時區\)'/g, "'建立預約'");

// 移除跨時區測試案例
content = content.replace(/,\s*{\s*id:\s*'[^']*cross_timezone[^}]+}/gs, '');
content = content.replace(/,\s*{\s*id:\s*'[^']*timezone_validation[^}]+}/gs, '');

// 移除時區參數
content = content.replace(/timezone:\s*'[^']+',?/g, '');

// 修復標題
content = content.replace(/支援時區功能/g, '統一使用 Asia/Taipei 時區');

fs.writeFileSync('apps/api/public/testAPI.html', content);
console.log('已移除 testAPI.html 中的時區相關代碼');
