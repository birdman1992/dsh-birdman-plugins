/**
 * workspace-artifacts — host half（产物视图）。
 *
 * 在 Web 会话视图添加「产物」标签：浏览当前会话工作区（session.header.cwd）
 * 的目录树并查看文件内容（代码高亮 / Markdown 渲染）。
 *
 * 本文件是 host 面：通过 connection RPC 通道（/rpc）把文件系统能力暴露给
 * 浏览器 client 面（lib/client.js）调用。
 */
export const name = 'workspace-artifacts'
export const inject = ['fs', 'connection', 'sessions']

export function apply(ctx) {
  const fs = ctx.get('fs')
  const connection = ctx.get('connection')
  if (!fs || !connection) return

  const TEXT_CAP = 256 * 1024

  function parentOf(path) {
    let s = String(path).replace(/[\\/]+$/, '')
    const i = Math.max(s.lastIndexOf('\\'), s.lastIndexOf('/'))
    if (i <= 0) return null
    return s.slice(0, i)
  }

  const fail = (message) => ({ ok: false, error: { code: 'internal', message } })

  ctx.effect(() => {
    const dispose = connection.rpc.handle('/rpc', async (endpoint, args) => {
      try {
        switch (endpoint) {
          // 当前会话的工作区路径（session.header.cwd）
          case 'artifacts/workspace': {
            const sessionId = args && typeof args.sessionId === 'string' && args.sessionId.length > 0 ? args.sessionId : ''
            if (!sessionId) return fail('missing sessionId')
            const sessions = ctx.get('sessions')
            if (sessions === undefined) return fail('sessions service unavailable')
            const session = sessions.get(sessionId)
            if (!session) return fail('session not found: ' + sessionId)
            const cwd = session.header && session.header.cwd
            if (!cwd) return fail('session has no cwd')
            return { ok: true, value: { path: cwd } }
          }
          // 目录列表：返回 { path, parent, entries: [{name, kind, size, path}] }
          case 'artifacts/list': {
            const path = args && typeof args.path === 'string' && args.path.length > 0 ? args.path : ''
            if (!path) return fail('missing path')
            const target = await fs.resolve(path)
            const listing = await fs.listDir(target)
            const entries = []
            for (const entry of listing) {
              entries.push({
                name: entry.name,
                kind: entry.type === 'directory' ? 'dir' : entry.type === 'file' ? 'file' : 'other',
                size: typeof entry.size === 'number' ? entry.size : null,
                path: entry.target.displayPath,
              })
            }
            entries.sort((a, b) => {
              if (a.kind === 'dir' && b.kind !== 'dir') return -1
              if (a.kind !== 'dir' && b.kind === 'dir') return 1
              return a.name.localeCompare(b.name)
            })
            return {
              ok: true,
              value: { path: target.displayPath, parent: parentOf(target.displayPath), entries },
            }
          }
          // 读取文件内容（文本查看，超过 256KB 截断）
          case 'artifacts/read': {
            const path = args && typeof args.path === 'string' && args.path.length > 0 ? args.path : ''
            if (!path) return fail('missing path')
            const target = await fs.resolve(path)
            const info = await fs.stat(target)
            if (!info) return fail('not found: ' + path)
            if (info.type !== 'file') return fail('not a file: ' + path)
            const size = typeof info.size === 'number' ? info.size : 0
            let content
            let truncated = false
            if (size > TEXT_CAP) {
              const bytes = await fs.readBytes(target, undefined, TEXT_CAP)
              content = new TextDecoder().decode(bytes)
              truncated = true
            } else {
              content = await fs.readText(target)
            }
            return { ok: true, value: { path: target.displayPath, content, truncated, size } }
          }
          default:
            return { ok: false, error: { code: 'bad-request', message: 'unknown endpoint: ' + endpoint } }
        }
      } catch (error) {
        return fail(String(error && error.message || error))
      }
    }, { authority: 'loopback' })
    return () => dispose()
  }, 'workspace-artifacts: rpc channel')
}
