const http = require('http');

function testPageLoad(path, pageName) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    // 檢查是否有明顯的語法錯誤標記
                    const hasErrors = data.includes('SyntaxError') || 
                                    data.includes('Unexpected token') ||
                                    data.includes('Invalid left-hand side');
                    
                    if (hasErrors) {
                        console.log(`❌ ${pageName}: Contains syntax error markers`);
                        resolve(false);
                    } else {
                        console.log(`✅ ${pageName}: Loaded successfully (${data.length} bytes)`);
                        resolve(true);
                    }
                } else {
                    console.log(`❌ ${pageName}: HTTP ${res.statusCode}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${pageName}: ${err.message}`);
            resolve(false);
        });

        req.end();
    });
}

async function runTests() {
    console.log('Testing frontend page loading...\n');
    
    const testApiResult = await testPageLoad('/testAPI.html', 'testAPI.html');
    const demoResult = await testPageLoad('/demo.html', 'demo.html');
    
    console.log('\n=== Summary ===');
    console.log(`testAPI.html: ${testApiResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`demo.html: ${demoResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (testApiResult && demoResult) {
        console.log('\n🎉 All frontend pages are loading correctly!');
    } else {
        console.log('\n⚠️ Some pages have loading issues.');
    }
}

runTests().catch(console.error);
