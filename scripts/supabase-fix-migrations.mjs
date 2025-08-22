#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const TIMESTAMP_PATTERN = /^\d{14}_[a-f0-9-]+\.sql$/;
const NO_OP_COMMENT = '-- no-op migration (empty file normalized)';
const DASH_NO_OP_COMMENT = '-- no-op migration (dash file normalized)';

async function fixMigrations() {
  console.log('🔍 Scanning Supabase migrations...');
  
  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql'));
    
    console.log(`Found ${sqlFiles.length} SQL migration files`);
    
    let fixedCount = 0;
    let warnings = [];
    
    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const content = await readFile(filePath, 'utf8');
      const trimmedContent = content.trim();
      
      // Check for empty files
      if (trimmedContent.length === 0) {
        console.log(`📝 Fixing empty migration: ${file}`);
        await writeFile(filePath, NO_OP_COMMENT + '\n');
        fixedCount++;
        continue;
      }
      
      // Check for dash-named files (e.g., "-.sql" or files starting with dash)
      if (file === '-.sql' || file.startsWith('-.') || file === '-') {
        console.log(`📝 Fixing dash-named migration: ${file}`);
        await writeFile(filePath, DASH_NO_OP_COMMENT + '\n');
        fixedCount++;
        continue;
      }
      
      // Check filename format (optional warning)
      if (!TIMESTAMP_PATTERN.test(file)) {
        warnings.push(`⚠️  Non-standard filename format: ${file}`);
      }
    }
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} migration files`);
    } else {
      console.log('✅ All migration files are properly formatted');
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(warning));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error scanning migrations:', error.message);
    process.exit(1);
  }
}

fixMigrations();