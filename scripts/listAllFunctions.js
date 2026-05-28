const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const outputFile = path.join(__dirname, '../all_functions_list.md');

let output = '# Project Functions List\n\n';

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Advanced Regex to match function declarations and arrow functions
            const functionRegex = /(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\s+([a-zA-Z0-9_]+)\s*\(|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/g;
            let match;
            const functions = new Set();
            while ((match = functionRegex.exec(content)) !== null) {
                const funcName = match[1] || match[2];
                if (funcName && funcName !== 'React' && funcName !== 'useEffect' && funcName !== 'useState') {
                    functions.add(funcName);
                }
            }
            if (functions.size > 0) {
                const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
                output += `## ${relativePath}\n`;
                functions.forEach(f => {
                    output += `- ${f}\n`;
                });
                output += '\n';
            }
        }
    }
}

try {
    walk(srcDir);
    fs.writeFileSync(outputFile, output);
    console.log(`Successfully extracted functions to ${outputFile}`);
} catch (error) {
    console.error('Error extracting functions:', error);
}
