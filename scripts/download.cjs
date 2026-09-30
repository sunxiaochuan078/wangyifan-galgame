#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const NAME = '67days-2.2.0-release.apk';
const SIZE = 124693068;
const HASH = '4e0ae8ea7a321e24d70244792cd76c07bb41554de88b14a0d42e7b16d3d10683';
const URL = 'https://github.com/sunxiaochuan078/wangyifan-galgame/releases/download/v2.2.0/' + NAME;
async function verify(file) {
  const hash = crypto.createHash('sha256');
  let size = 0;
  for await (const chunk of fs.createReadStream(file)) { size += chunk.length; hash.update(chunk); }
  return size === SIZE && hash.digest('hex') === HASH;
}
async function main() {
  // npm prepares Git dependencies in its cache before installing them.
  // Download only in the final install, not in that temporary packaging step.
  const installCwd = path.resolve(process.env.INIT_CWD || process.cwd());
  const packageRoot = path.resolve(__dirname, '..');
  const gitCachePattern = /[/\\]_cacache[/\\]tmp[/\\]git-clone[^/\\]+$/;
  if (process.env.npm_lifecycle_event === 'postinstall' &&
      installCwd === packageRoot && gitCachePattern.test(packageRoot)) {
    console.log('GitHub 临时打包完成，安装后将下载 APK。');
    return;
  }
  const target = path.resolve(process.env.INIT_CWD || process.cwd(), NAME);
  if (fs.existsSync(target)) {
    if (!await verify(target)) throw new Error('同名文件已存在且校验不匹配，请移走该文件后重试：' + target);
    console.log('安装包已存在，SHA-256 校验通过：' + target);
    return;
  }
  const temp = target + '.' + crypto.randomBytes(8).toString('hex') + '.part';
  try {
    console.log('正在从 GitHub 下载 67days 2.2.0（约 125 MB）…');
    let url = URL, response;
    for (let redirects = 0; redirects <= 5; redirects++) {
      const parsed = new globalThis.URL(url);
      if (parsed.protocol !== 'https:' || !['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(parsed.hostname)) throw new Error('下载地址不受信任');
      response = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(300000)});
      if (![301,302,303,307,308].includes(response.status)) break;
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirects === 5) throw new Error('下载重定向失败');
      url = new globalThis.URL(location, url).href;
    }
    if (!response.ok || !response.body) throw new Error('GitHub 下载失败：HTTP ' + response.status);
    let bytes = 0;
    const hash = crypto.createHash('sha256');
    const check = new Transform({transform(chunk, encoding, callback) {
      bytes += chunk.length;
      if (bytes > SIZE) return callback(new Error('下载大小异常'));
      hash.update(chunk); callback(null, chunk);
    }});
    await pipeline(Readable.fromWeb(response.body), check, fs.createWriteStream(temp, {flags:'wx'}));
    if (bytes !== SIZE || hash.digest('hex') !== HASH) throw new Error('安装包 SHA-256 校验失败');
    // Exclusive copy prevents overwriting a file created during the download.
    await fs.promises.copyFile(temp, target, fs.constants.COPYFILE_EXCL);
    console.log('下载完成，SHA-256 校验通过：' + target);
  } finally { await fs.promises.rm(temp, {force:true}); }
}
main().catch(error => { console.error('下载失败：' + error.message); process.exitCode = 1; });
