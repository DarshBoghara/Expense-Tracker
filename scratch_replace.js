const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalContent = content;
            
            // Replace \`import.meta.env.VITE_API_URL || 'http://localhost:5000'\` with \`import.meta.env.VITE_API_URL\`
            content = content.replace(/import\.meta\.env\.VITE_API_URL\s*\|\|\s*'http:\/\/localhost:5000'/g, 'import.meta.env.VITE_API_URL');
            content = content.replace(/import\.meta\.env\.VITE_API_URL\s*\|\|\s*"http:\/\/localhost:5000"/g, 'import.meta.env.VITE_API_URL');
            content = content.replace(/import\.meta\.env\.VITE_API_URL\s*\|\|\s*`http:\/\/localhost:5000`/g, 'import.meta.env.VITE_API_URL');
            
            // Just in case there are exact 'http://localhost:5000' strings lying around
            content = content.replace(/'http:\/\/localhost:5000'/g, 'import.meta.env.VITE_API_URL');
            content = content.replace(/"http:\/\/localhost:5000"/g, 'import.meta.env.VITE_API_URL');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}
replaceInDir('frontend/src');
