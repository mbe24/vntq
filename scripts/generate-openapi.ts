import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getOpenApiDocument } from '../src/lib/server/api/openapi';

async function run() {
  const outDir = join(process.cwd(), 'docs');
  await mkdir(outDir, { recursive: true });

  const outPath = join(outDir, 'openapi.json');
  const document = getOpenApiDocument();

  await writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`OpenAPI document generated: ${outPath}`);
}

run().catch((error) => {
  console.error('OpenAPI generation failed:', error);
  process.exit(1);
});
