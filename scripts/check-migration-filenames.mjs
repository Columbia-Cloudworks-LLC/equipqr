#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Check migration filenames to ensure they follow the correct pattern
 * Pattern: ^\\d{14}_[a-z0-9][a-z0-9_-]*\\.sql$
 */

const MIGRATION_DIR = 'supabase/migrations';
const FILENAME_PATTERN = /^\d{14}_[a-z0-9][a-z0-9_-]*\.sql$/;

function checkMigrationFilenames() {
  console.log('🔍 Checking migration filenames...');
  
  // Check if migrations directory exists
  if (!fs.existsSync(MIGRATION_DIR)) {
    console.log('ℹ️  No migrations directory found, skipping filename check');
    return;
  }

  const files = fs.readdirSync(MIGRATION_DIR);
  const sqlFiles = files.filter(file => file.endsWith('.sql'));
  
  if (sqlFiles.length === 0) {
    console.log('ℹ️  No SQL migration files found');
    return;
  }

  const invalidFiles = [];
  
  for (const file of sqlFiles) {
    if (!FILENAME_PATTERN.test(file)) {
      invalidFiles.push(file);
    }
  }
  
  if (invalidFiles.length > 0) {
    console.error('❌ Migration filename validation failed!');
    console.error('\nThe following files have invalid names:');
    
    for (const file of invalidFiles) {
      console.error(`  ❌ ${file}`);
    }
    
    console.error('\nMigration files must follow the pattern:');
    console.error('  ✅ YYYYMMDDHHMMSS_descriptive_name.sql');
    console.error('  ✅ Example: 20250818123456_add_user_preferences.sql');
    console.error('\nRules:');
    console.error('  - Must start with 14 digits (timestamp)');
    console.error('  - Must have underscore after timestamp');
    console.error('  - Name part must start with lowercase letter or number');
    console.error('  - Can contain lowercase letters, numbers, underscores, hyphens');
    console.error('  - Must end with .sql');
    
    process.exit(1);
  }
  
  console.log(`✅ All ${sqlFiles.length} migration files have valid names`);
}

checkMigrationFilenames();