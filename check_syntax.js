const fs = require('fs');

function extractJavaScript(htmlContent) {
    const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
    return scriptMatch ? scriptMatch[1] : '';
}

function checkSyntax(filename, jsContent) {
    try {
        // Use Function constructor to check syntax without executing
        new Function(jsContent);
        console.log(`✅ ${filename}: No syntax errors detected`);
        return true;
    } catch (error) {
        console.log(`❌ ${filename}: Syntax error at line ${error.lineNumber || 'unknown'}`);
        console.log(`   Error: ${error.message}`);
        
        // Try to find the problematic line
        const lines = jsContent.split('\n');
        if (error.lineNumber && error.lineNumber <= lines.length) {
            const lineNum = error.lineNumber - 1;
            console.log(`   Line ${error.lineNumber}: ${lines[lineNum]}`);
            if (lineNum > 0) console.log(`   Line ${error.lineNumber - 1}: ${lines[lineNum - 1]}`);
            if (lineNum < lines.length - 1) console.log(`   Line ${error.lineNumber + 1}: ${lines[lineNum + 1]}`);
        }
        return false;
    }
}

// Check testAPI.html
try {
    const testApiContent = fs.readFileSync('apps/api/public/testAPI.html', 'utf8');
    const testApiJs = extractJavaScript(testApiContent);
    checkSyntax('testAPI.html', testApiJs);
} catch (error) {
    console.log(`❌ Error reading testAPI.html: ${error.message}`);
}

// Check demo.html
try {
    const demoContent = fs.readFileSync('apps/api/public/demo.html', 'utf8');
    const demoJs = extractJavaScript(demoContent);
    checkSyntax('demo.html', demoJs);
} catch (error) {
    console.log(`❌ Error reading demo.html: ${error.message}`);
}
