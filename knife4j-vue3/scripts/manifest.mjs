import { readdir, readFile, writeFile, copyFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

// 发布资源始终记录精确源码提交和逐文件校验和。
const root = path.resolve('dist')
await mkdir(path.join(root, 'openapi-ui'), { recursive: true })
await copyFile('../LICENSE', path.join(root, 'openapi-ui/LICENSE'))
await copyFile('../NOTICE', path.join(root, 'openapi-ui/NOTICE'))
let notices = ''
async function collectLicenses(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const location = path.join(directory, entry.name)
    if (entry.name.startsWith('@')) { await collectLicenses(location); continue }
    try {
      const pkg = JSON.parse(await readFile(path.join(location, 'package.json'), 'utf8'))
      const license = (await readdir(location)).find(name => /^licen[sc]e(?:\.(?:md|txt))?$/i.test(name))
      notices += '\n--- ' + pkg.name + '@' + pkg.version + ' (' + (pkg.license || 'see upstream') + ') ---\n'
      if (license) notices += await readFile(path.join(location, license), 'utf8')
    } catch (error) { if (error.code !== 'ENOENT') throw error }
  }
}
await collectLicenses('node_modules')
await writeFile(path.join(root, 'openapi-ui/THIRD-PARTY-LICENSES.txt'), notices.replaceAll('\r\n', '\n'))
const files = {}
async function walk(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const location = path.join(directory, entry.name)
    if (entry.isDirectory()) await walk(location)
    else if (entry.name !== 'manifest.json') files[path.relative(root, location).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(location)).digest('hex')
  }
}
await walk(root)
const manifest = {
  version: '0.1.0', protocolVersion: 1, openapi: ['3.2.0'],
  repository: 'https://github.com/goark-projects/goark-openapi-ui',
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  upstream: 'https://github.com/xiaoymin/knife4j', upstreamRelease: 'v4.5.0',
  upstreamCommit: '030ad003fcad75ebfb523dfb730a540309e2c20d', files
}
await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
