const puppeteer = require('puppeteer');

async function testPage(url, pageName) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // 監聽控制台錯誤
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
    });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
        
        // 等待頁面載入完成
        await page.waitForTimeout(2000);
        
        if (errors.length === 0) {
            console.log(`✅ ${pageName}: No JavaScript errors detected`);
        } else {
            console.log(`❌ ${pageName}: Found ${errors.length} error(s):`);
            errors.forEach(error => console.log(`   - ${error}`));
        }
    } catch (error) {
        console.log(`❌ ${pageName}: Failed to load - ${error.message}`);
    }
    
    await browser.close();
    return errors.length === 0;
}

async function runTests() {
    console.log('Testing frontend pages for JavaScript errors...\n');
    
    const testApiResult = await testPage('http://localhost:3001/testAPI.html', 'testAPI.html');
    const demoResult = await testPage('http://localhost:3001/demo.html', 'demo.html');
    
    console.log('\n=== Summary ===');
    console.log(`testAPI.html: ${testApiResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`demo.html: ${demoResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (testApiResult && demoResult) {
        console.log('\n🎉 All frontend pages are working correctly!');
    } else {
        console.log('\n⚠️ Some pages have issues that need to be fixed.');
    }
}

runTests().catch(console.error);
