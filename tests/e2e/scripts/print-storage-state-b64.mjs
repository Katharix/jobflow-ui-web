import fs from 'node:fs/promises';
import path from 'node:path';

const storageStatePath =
  process.env.JOBFLOW_UI_STORAGE_STATE_PATH ??
  './tests/e2e/.auth/admin-storage-state.json';

const fullPath = path.resolve(storageStatePath);
const content = await fs.readFile(fullPath);

console.log(content.toString('base64'));
