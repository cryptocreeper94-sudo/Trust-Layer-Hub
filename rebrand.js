import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_DIR = __dirname;

const EXCLUDE_DIRS = [
    'node_modules', '.git', '.cache', 'dist', 'dist-electron', 'release', 'build', 'attached_assets', '.expo', '.git-old'
];

const EXCLUDE_EXTS = [
    '.png', '.jpg', '.jpeg', '.mp4', '.mp3', '.ico', '.svg', '.lock'
];

const REPLACEMENTS = [
    { regex: /TrustVault/g, replacement: 'Axiom42 Suite' },
    { regex: /Trust Vault/g, replacement: 'Axiom42 Suite' },
    { regex: /trustvault/g, replacement: 'axiom42suite' },
    { regex: /TRUSTVAULT/g, replacement: 'AXIOM42SUITE' }
];

let filesChanged = 0;

function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                walk(filePath);
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (!EXCLUDE_EXTS.includes(ext) && file !== 'package-lock.json' && file !== 'rebrand.js') {
                processFile(filePath);
            }
        }
    }
}

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        for (const { regex, replacement } of REPLACEMENTS) {
            newContent = newContent.replace(regex, replacement);
        }

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`[UPDATED] ${filePath}`);
            filesChanged++;
        }
    } catch (e) {
        // Skip binary or unreadable files
    }
}

console.log('Starting global rebrand for ' + TARGET_DIR);
walk(TARGET_DIR);
console.log(`Rebrand complete. Files updated: ${filesChanged}`);
