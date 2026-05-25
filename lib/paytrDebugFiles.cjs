const fs = require('fs');
const path = require('path');

function resolvePaytrDebugDir() {
  if (process.env.PAYTR_DEBUG_DIR) {
    return path.resolve(process.env.PAYTR_DEBUG_DIR);
  }
  return path.join(process.cwd(), 'logs', 'paytr-debug');
}

function shouldWritePaytrDebugFiles() {
  const raw = String(process.env.PAYTR_DEBUG_FILES ?? '0').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function ensurePaytrDebugDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writePaytrDebugTxtFiles({
  slug,
  hashMessage,
  token,
  formBody,
  curlCommand,
  extra = {},
}) {
  const dir = resolvePaytrDebugDir();
  ensurePaytrDebugDir(dir);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `${stamp}_${slug}`;

  const files = {
    hash: path.join(dir, `${base}-hash.txt`),
    token: path.join(dir, `${base}-token.txt`),
    body: path.join(dir, `${base}-body.txt`),
    curl: path.join(dir, `${base}-curl.txt`),
  };

  fs.writeFileSync(files.hash, `${hashMessage}\n`, 'utf8');
  fs.writeFileSync(files.token, `${token}\n`, 'utf8');
  fs.writeFileSync(files.body, `${formBody}\n`, 'utf8');
  fs.writeFileSync(files.curl, `${curlCommand}\n`, 'utf8');

  if (Object.keys(extra).length) {
    files.meta = path.join(dir, `${base}-meta.json`);
    fs.writeFileSync(files.meta, `${JSON.stringify(extra, null, 2)}\n`, 'utf8');
  }

  return { dir, base, files };
}

module.exports = {
  resolvePaytrDebugDir,
  shouldWritePaytrDebugFiles,
  writePaytrDebugTxtFiles,
};
