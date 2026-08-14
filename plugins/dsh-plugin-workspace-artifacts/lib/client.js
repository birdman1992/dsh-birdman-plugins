/**
 * dsh-plugin-workspace-artifacts - client half.
 */
window.__ModuleLoader__.load({
	id: "dsh-plugin-workspace-artifacts",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		const React = require("react");
		const inject = ["slots", "connection"];
		const styles = {
			insert(css) {
				const el = document.createElement("style");
				el.textContent = css;
				document.head.append(el);
				return el;
			}
		};
		let host = null;
		const PLUGIN = (function() {
return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    styles.insert(`
.maf-view { height: 100%; display: flex; flex-direction: row; padding: 12px 16px; box-sizing: border-box; gap: 14px; overflow: hidden; }
.maf-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
.maf-right { width: 320px; flex: none; display: flex; flex-direction: column; gap: 8px; overflow: hidden; border-left: 1px solid rgba(128,128,128,.22); padding-left: 14px; }
.maf-head { display: flex; align-items: center; gap: 8px; font-size: 13px; flex: none; }
.maf-path { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .8; font-family: ui-monospace, monospace; }
.maf-btn { border: 1px solid rgba(128,128,128,.35); background: transparent; color: inherit; border-radius: 4px; padding: 2px 10px; font-size: 12px; cursor: pointer; }
.maf-btn:hover { background: rgba(128,128,128,.15); }
.maf-btn:disabled { opacity: .4; cursor: default; }
.maf-list { flex: 1; overflow: auto; border: 1px solid rgba(128,128,128,.22); border-radius: 6px; padding: 4px; }
.maf-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 13px; }
.maf-row:hover { background: rgba(128,128,128,.12); }
.maf-row.sel { background: rgba(90,140,255,.18); }
.maf-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.maf-meta { opacity: .55; font-size: 11px; flex: none; }
.maf-error { color: #e5484d; font-size: 12px; flex: none; }
.maf-empty { opacity: .6; font-size: 13px; padding: 12px; text-align: center; }
.maf-icon { flex: none; opacity: .7; }
.maf-hint { flex: 1; display: flex; align-items: center; justify-content: center; opacity: .55; font-size: 13px; border: 1px dashed rgba(128,128,128,.25); border-radius: 6px; }
.maf-tok-keyword { color: #cf222e; }
.maf-tok-string { color: #0a7d33; }
.maf-tok-comment { color: #6e7781; font-style: italic; }
.maf-tok-number { color: #0550ae; }
.maf-tok-function { color: #8250df; }
.maf-tok-tag { color: #116329; }
.maf-tok-attr { color: #953800; }
body[data-ds-dark-theme] .maf-tok-keyword { color: #c678dd; }
body[data-ds-dark-theme] .maf-tok-string { color: #98c379; }
body[data-ds-dark-theme] .maf-tok-comment { color: #7f848e; }
body[data-ds-dark-theme] .maf-tok-number { color: #d19a66; }
body[data-ds-dark-theme] .maf-tok-function { color: #61afef; }
body[data-ds-dark-theme] .maf-tok-tag { color: #e06c75; }
body[data-ds-dark-theme] .maf-tok-attr { color: #d19a66; }
.maf-md { flex: 1; overflow: auto; border: 1px solid rgba(128,128,128,.22); border-radius: 6px; padding: 12px 16px; font-size: 13px; line-height: 1.6; }
.maf-md h1 { font-size: 1.5em; margin: .5em 0 .4em; border-bottom: 1px solid rgba(128,128,128,.2); padding-bottom: .2em; }
.maf-md h2 { font-size: 1.3em; margin: .5em 0 .4em; border-bottom: 1px solid rgba(128,128,128,.2); padding-bottom: .2em; }
.maf-md h3 { font-size: 1.15em; margin: .5em 0 .4em; }
.maf-md h4, .maf-md h5, .maf-md h6 { font-size: 1em; margin: .5em 0 .4em; }
.maf-md p { margin: .4em 0; }
.maf-md a { color: #0969da; }
body[data-ds-dark-theme] .maf-md a { color: #58a6ff; }
.maf-md code { font-family: ui-monospace, monospace; background: rgba(128,128,128,.15); border-radius: 3px; padding: 0 4px; font-size: .92em; }
.maf-md pre { background: rgba(128,128,128,.1); border-radius: 6px; padding: 10px; overflow: auto; margin: .5em 0; }
.maf-md pre code { background: none; padding: 0; }
.maf-md blockquote { margin: .5em 0; padding: 2px 12px; border-left: 3px solid rgba(128,128,128,.4); color: rgba(128,128,128,.9); }
.maf-md ul, .maf-md ol { margin: .4em 0; padding-left: 24px; }
.maf-md li { margin: .15em 0; }
.maf-md hr { border: none; border-top: 1px solid rgba(128,128,128,.3); margin: .8em 0; }
`)

    // ---------- 轻量语法高亮（内置分词器，无外部依赖） ----------
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const QUOTES = '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)'
    const TRIPLE = '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\')'
    const NUMBER = '(\\b(?:0[xX][0-9a-fA-F_]+|\\d[\\d_]*(?:\\.[\\d_]+)?(?:[eE][+-]?\\d+)?)\\b)'
    const FN_CALL = '([A-Za-z_$][\\w$]*)(?=\\s*\\()'
    const KEY_PAIR = '([A-Za-z_][\\w.-]*)(?=\\s*[:=])'
    const SH_VAR = '(\\$\\{?[A-Za-z_][\\w]*\\}?)'
    const LINE_COMMENT = (s) => '(' + esc(s) + '[^\\n]*)'
    const BLOCK_COMMENT = (a, b) => '(' + esc(a) + '[\\s\\S]*?' + esc(b) + ')'
    const KEY_RE = (words) => '(\\b(?:' + words.join('|') + ')\\b)'

    function makeTokenizer(opts) {
      const parts = []
      const types = []
      const add = (re, type) => {
        parts.push(re)
        types.push(type)
      }
      if (opts.triple) add(TRIPLE, 'string')
      if (opts.lineComment) add(LINE_COMMENT(opts.lineComment), 'comment')
      if (opts.blockComment) add(BLOCK_COMMENT(opts.blockComment[0], opts.blockComment[1]), 'comment')
      add(QUOTES, 'string')
      add(NUMBER, 'number')
      if (opts.shellVar) add(SH_VAR, 'attr')
      if (opts.keys) add(KEY_PAIR, 'attr')
      if (opts.keywords && opts.keywords.length) add(KEY_RE(opts.keywords), 'keyword')
      add(FN_CALL, 'function')
      return { re: new RegExp(parts.join('|'), 'g'), types }
    }

    const KW = {
      javascript: 'break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return static super switch this throw true try typeof var void while with yield async await of get set'.split(' '),
      typescript: 'break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof let new null return static super switch this throw true try typeof var void while with yield async await of get set interface type namespace declare abstract readonly implements private protected public as is keyof never unknown any satisfies override'.split(' '),
      java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null'.split(' '),
      clike: 'alignas alignof and asm auto bitand bitor bool break case catch char class compl concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do double dynamic_cast else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor xor_eq'.split(' '),
      go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'.split(' '),
      rust: 'as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while'.split(' '),
      python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '),
      shell: 'if then else elif fi for while until do done case esac function in select time coproc export local readonly unset set shift source alias echo printf return exit break continue trap wait eval exec read test cd ls mkdir rm cp mv grep sed awk cat'.split(' '),
      yaml: 'true false null yes no on off ~'.split(' '),
      sql: 'select from where insert into values update set delete create table index view drop alter add primary key foreign references join left right inner outer on as and or not null is in exists between like order by group having limit offset union all distinct count sum avg min max case when then else end'.split(' '),
    }

    const MARKUP = (() => {
      const re = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][\w-]*)|([a-zA-Z-]+(?=\s*=))|("[^"]*"|'[^']*')|(&[a-zA-Z#0-9]+;)/g
      return { re, types: ['comment', 'tag', 'attr', 'string', 'attr'] }
    })()
    const CSS = (() => {
      const re = /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|fr|deg|ch|ex)?\b)|(\b(?:important|inherit|initial|unset|none|auto|block|inline|flex|grid|absolute|relative|fixed|sticky|solid|dashed|dotted|transparent|bold|italic|normal)\b)|([a-zA-Z-]+(?=\s*:))/g
      return { re, types: ['comment', 'string', 'number', 'keyword', 'attr'] }
    })()

    const EXT_LANG = {
      js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
      ts: 'typescript', tsx: 'typescript', mts: 'typescript', cts: 'typescript',
      json: 'json', jsonc: 'json',
      html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup', xhtml: 'markup',
      css: 'css', scss: 'css', less: 'css',
      py: 'python',
      go: 'go',
      rs: 'rust',
      java: 'java',
      c: 'clike', h: 'clike', cpp: 'clike', hpp: 'clike', cc: 'clike', cxx: 'clike', cs: 'clike',
      sh: 'shell', bash: 'shell', zsh: 'shell',
      yaml: 'yaml', yml: 'yaml',
      toml: 'toml',
      sql: 'sql',
      md: 'markdown', markdown: 'markdown',
    }

    const TOKENS = {}
    function getSpec(lang) {
      if (TOKENS[lang]) return TOKENS[lang]
      let spec
      if (lang === 'markup') spec = MARKUP
      else if (lang === 'css') spec = CSS
      else if (lang === 'json') spec = makeTokenizer({ keywords: ['true', 'false', 'null'] })
      else if (KW[lang]) {
        const base = {
          python: { lineComment: '#', triple: true },
          shell: { lineComment: '#', shellVar: true },
          yaml: { lineComment: '#', keys: true },
          toml: { lineComment: '#', keys: true },
          sql: { lineComment: '--', blockComment: ['/*', '*/'] },
        }[lang] || { lineComment: '//', blockComment: ['/*', '*/'] }
        spec = makeTokenizer({ ...base, keywords: KW[lang] })
      }
      TOKENS[lang] = spec
      return spec
    }

    function basenameExt(path) {
      const s = String(path || '')
      const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'))
      const base = i >= 0 ? s.slice(i + 1) : s
      const dot = base.lastIndexOf('.')
      if (dot <= 0) return ''
      return base.slice(dot + 1).toLowerCase()
    }

    function tokenize(spec, code) {
      if (!spec) return [{ t: 'plain', v: code }]
      const re = spec.re
      const types = spec.types
      const out = []
      re.lastIndex = 0
      let last = 0
      let m
      while ((m = re.exec(code)) !== null) {
        if (m.index > last) out.push({ t: 'plain', v: code.slice(last, m.index) })
        let type = 'plain'
        for (let i = 1; i < m.length; i++) {
          if (m[i] !== undefined) {
            type = types[i - 1]
            break
          }
        }
        out.push({ t: type, v: m[0] })
        last = m.index + m[0].length
        if (m[0].length === 0) re.lastIndex = m.index + 1
      }
      if (last < code.length) out.push({ t: 'plain', v: code.slice(last) })
      return out
    }

    function highlight(path, code) {
      const lang = EXT_LANG[basenameExt(path)] || 'text'
      if (lang === 'text') return [{ t: 'plain', v: code }]
      return tokenize(getSpec(lang), code)
    }

    function specForName(name) {
      const n = String(name || '').toLowerCase()
      const canonical = EXT_LANG[n] || (n === 'text' ? null : n)
      return canonical ? getSpec(canonical) : undefined
    }

    function renderTokens(tokens, keyBase) {
      const out = []
      tokens.forEach((tok, i) => {
        if (tok.t === 'plain') out.push(tok.v)
        else out.push(React.createElement('span', { key: keyBase + '-' + i, className: 'maf-tok maf-tok-' + tok.t }, tok.v))
      })
      return out
    }

    // ---------- Markdown 渲染（块解析 + 行内格式） ----------
    function parseBlocks(src) {
      const lines = String(src || '').split('\n')
      const blocks = []
      let i = 0
      const isListLine = (l) => /^\s*([-*+]|\d+[.)])\s+/.test(l)
      while (i < lines.length) {
        const line = lines[i]
        const fence = /^\s*(```+|~~~+)\s*([\w+-]*)\s*$/.exec(line)
        if (fence) {
          const marker = fence[1][0]
          const lang = fence[2]
          const buf = []
          i++
          const close = new RegExp('^\\s*' + marker + '{3,}\\s*$')
          while (i < lines.length && !close.test(lines[i])) {
            buf.push(lines[i])
            i++
          }
          if (i < lines.length) i++
          blocks.push({ type: 'code', lang, text: buf.join('\n') })
          continue
        }
        const h = /^(#{1,6})\s+(.*)$/.exec(line)
        if (h) {
          blocks.push({ type: 'heading', level: h[1].length, text: h[2] })
          i++
          continue
        }
        if (/^\s*([-*_])\s*(\1\s*){2,}\s*$/.test(line)) {
          blocks.push({ type: 'hr' })
          i++
          continue
        }
        if (/^\s*>\s?/.test(line)) {
          const buf = []
          while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
            buf.push(lines[i].replace(/^\s*>\s?/, ''))
            i++
          }
          blocks.push({ type: 'quote', text: buf.join('\n') })
          continue
        }
        const ul = /^\s*([-*+])\s+(.*)$/.exec(line)
        const ol = /^\s*(\d+)[.)]\s+(.*)$/.exec(line)
        if (ul || ol) {
          const ordered = !!ol
          const items = []
          const itemRe = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/
          while (i < lines.length) {
            const m2 = itemRe.exec(lines[i])
            if (!m2) break
            items.push(m2[1])
            i++
          }
          blocks.push({ type: 'list', ordered, items })
          continue
        }
        if (/^( {4}|\t)/.test(line)) {
          const buf = []
          while (i < lines.length && (/^( {4}|\t)/.test(lines[i]) || lines[i].trim() === '')) {
            buf.push(lines[i].replace(/^( {4}|\t)/, ''))
            i++
          }
          blocks.push({ type: 'code', lang: '', text: buf.join('\n') })
          continue
        }
        if (line.trim() === '') {
          i++
          continue
        }
        const buf = []
        while (i < lines.length) {
          const l = lines[i]
          if (l.trim() === '' || /^(#{1,6})\s/.test(l) || /^\s*(```+|~~~+)/.test(l) || /^\s*>/.test(l) || isListLine(l) || /^\s*([-*_])\s*(\1\s*){2,}\s*$/.test(l)) break
          buf.push(l.trim())
          i++
        }
        blocks.push({ type: 'p', text: buf.join(' ') })
      }
      return blocks
    }

    const INLINE_RE = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`\n]+`)|(\[[^\]]*\]\([^)\s]+\))|(~~[^~]+~~)/g
    function renderInline(text, keyBase) {
      const out = []
      let last = 0
      let k = 0
      let m
      const re = new RegExp(INLINE_RE.source, 'g')
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index))
        if (m[1]) out.push(React.createElement('strong', { key: keyBase + '-' + k++ }, m[1].slice(2, -2)))
        else if (m[2]) out.push(React.createElement('em', { key: keyBase + '-' + k++ }, m[2].slice(1, -1)))
        else if (m[3]) out.push(React.createElement('code', { key: keyBase + '-' + k++ }, m[3].slice(1, -1)))
        else if (m[4]) out.push(React.createElement('a', { key: keyBase + '-' + k++, href: m[6], target: '_blank', rel: 'noreferrer' }, m[5]))
        else if (m[7]) out.push(React.createElement('del', { key: keyBase + '-' + k++ }, m[7].slice(2, -2)))
        last = m.index + m[0].length
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    function renderBlocks(blocks) {
      return blocks.map((b, i) => {
        const key = 'md-' + i
        switch (b.type) {
          case 'heading':
            return React.createElement('h' + b.level, { key }, renderInline(b.text, key + '-h'))
          case 'p':
            return React.createElement('p', { key }, renderInline(b.text, key + '-p'))
          case 'quote':
            return React.createElement('blockquote', { key }, renderInline(b.text, key + '-q'))
          case 'list':
            return React.createElement(b.ordered ? 'ol' : 'ul', { key }, b.items.map((it, j) =>
              React.createElement('li', { key: j }, renderInline(it, key + '-l' + j))))
          case 'hr':
            return React.createElement('hr', { key })
          case 'code':
            return React.createElement('pre', { key, className: 'maf-md-pre' },
              React.createElement('code', null, ...renderTokens(tokenize(specForName(b.lang), b.text), key + '-c')))
          default:
            return null
        }
      })
    }

    // ---------- 视图组件 ----------
    function basenameOf(path) {
      const s = String(path || '')
      const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'))
      return i >= 0 ? s.slice(i + 1) : s
    }

    function ArtifactBrowser(props) {
      const sessionId = props.sessionId

      const [root, setRoot] = React.useState(null)
      const [ready, setReady] = React.useState(false)
      const [expanded, setExpanded] = React.useState({})
      const [childrenMap, setChildrenMap] = React.useState({})
      const [file, setFile] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [loading, setLoading] = React.useState(false)

      React.useEffect(() => {
        let cancelled = false
        ;(async () => {
          try {
            const result = await host.call('artifacts.workspace', { sessionId })
            if (!cancelled && result && !result.error && result.path) setRoot(result.path)
            else if (!cancelled) setError(result && result.error ? result.error : 'workspace resolve failed')
          } catch (e) {
            if (!cancelled) setError(String(e && e.message || e))
          }
        })()
        return () => {
          cancelled = true
        }
      }, [sessionId])

      // 初始化：展开根目录并加载其子项
      React.useEffect(() => {
        if (root && !ready) {
          setReady(true)
          ;(async () => {
            setLoading(true)
            setError(null)
            try {
              const result = await host.call('artifacts.list', { path: root })
              if (result && !result.error) {
                setChildrenMap((prev) => ({ ...prev, [root]: result.entries }))
                setExpanded((prev) => ({ ...prev, [root]: true }))
              } else setError(result && result.error ? result.error : 'list failed')
            } catch (e) {
              setError(String(e && e.message || e))
            } finally {
              setLoading(false)
            }
          })()
        }
      }, [root, ready])

      const view = async (path) => {
        setLoading(true)
        setError(null)
        try {
          const result = await host.call('artifacts.read', { path })
          if (!result || result.error) {
            setError(result && result.error ? result.error : 'read failed')
            return
          }
          const isMd = EXT_LANG[basenameExt(result.path)] === 'markdown'
          const blocks = isMd ? parseBlocks(result.content) : null
          if (isMd && result.truncated) blocks.push({ type: 'p', text: '…(内容超过256KB，已截断)' })
          setFile({
            path: result.path,
            size: result.size,
            truncated: result.truncated,
            isMd,
            blocks,
            tokens: isMd ? null : highlight(result.path, result.content),
          })
        } catch (e) {
          setError(String(e && e.message || e))
        } finally {
          setLoading(false)
        }
      }

      const toggle = async (node) => {
        if (node.kind !== 'dir') {
          view(node.path)
          return
        }
        if (expanded[node.path]) {
          setExpanded((prev) => ({ ...prev, [node.path]: false }))
          return
        }
        if (!childrenMap[node.path]) {
          setLoading(true)
          setError(null)
          try {
            const result = await host.call('artifacts.list', { path: node.path })
            if (result && !result.error) {
              setChildrenMap((prev) => ({ ...prev, [node.path]: result.entries }))
              setExpanded((prev) => ({ ...prev, [node.path]: true }))
            } else setError(result && result.error ? result.error : 'list failed')
          } catch (e) {
            setError(String(e && e.message || e))
          } finally {
            setLoading(false)
          }
        } else {
          setExpanded((prev) => ({ ...prev, [node.path]: true }))
        }
      }

      const refresh = async () => {
        if (!root) return
        setLoading(true)
        setError(null)
        try {
          const result = await host.call('artifacts.list', { path: root })
          if (result && !result.error) {
            setChildrenMap({ [root]: result.entries })
            setExpanded({ [root]: true })
          } else setError(result && result.error ? result.error : 'list failed')
        } catch (e) {
          setError(String(e && e.message || e))
        } finally {
          setLoading(false)
        }
      }

      const renderNode = (node, depth) => {
        const isDir = node.kind === 'dir'
        const isExpanded = !!expanded[node.path]
        const kids = isDir && isExpanded ? (childrenMap[node.path] || []) : []
        const isSel = !isDir && file && file.path === node.path
        const row = React.createElement('div', {
          key: node.path,
          className: 'maf-row' + (isSel ? ' sel' : ''),
          onClick: () => toggle(node),
          title: node.path,
          style: { paddingLeft: 8 + depth * 14 },
        },
          React.createElement('span', { className: 'maf-icon' }, isDir ? (isExpanded ? '📂' : '📁') : '📄'),
          React.createElement('span', { className: 'maf-name' + (isDir ? ' maf-dir' : '') }, node.name),
          React.createElement('span', { className: 'maf-meta' }, isDir ? (isExpanded ? '▾' : '▸') : (node.size != null ? node.size + ' B' : '')))
        if (!isDir || !isExpanded || kids.length === 0) return row
        return [row].concat(kids.map((k) => renderNode(k, depth + 1)))
      }

      // 左侧：内容查看器（代码高亮 / Markdown 渲染）
      let leftPane
      if (file) {
        const head = React.createElement('div', { className: 'maf-head' },
          React.createElement('span', { className: 'maf-path', title: file.path }, file.path),
          React.createElement('span', { className: 'maf-meta' },
            (file.size != null ? file.size + ' B' : '') + (file.truncated && !file.isMd ? ' · 已截断(前256KB)' : '')))
        if (file.isMd) {
          leftPane = React.createElement('div', { className: 'maf-left' },
            head,
            React.createElement('div', { className: 'maf-md' }, ...renderBlocks(file.blocks)))
        } else {
          const preNodes = renderTokens(file.tokens, 'tok')
          if (file.truncated) preNodes.push('\n…(内容超过256KB，已截断)')
          leftPane = React.createElement('div', { className: 'maf-left' },
            head,
            React.createElement('pre', { className: 'maf-pre' }, ...preNodes))
        }
      } else {
        leftPane = React.createElement('div', { className: 'maf-left' },
          React.createElement('div', { className: 'maf-hint' }, '在右侧树中选择文件查看内容'))
      }

      // 右侧：文件树
      const rootNode = root ? { path: root, name: basenameOf(root), kind: 'dir', size: null } : null
      const treeRows = rootNode ? renderNode(rootNode, 0) : []

      const rightPane = React.createElement('div', { className: 'maf-right' },
        React.createElement('div', { className: 'maf-head' },
          React.createElement('span', { className: 'maf-path', title: root || '' }, root || '正在加载工作区…'),
          React.createElement('button', { className: 'maf-btn', onClick: refresh, disabled: loading || !root }, '刷新')),
        error ? React.createElement('div', { className: 'maf-error' }, error) : null,
        React.createElement('div', { className: 'maf-list' },
          loading && !ready
            ? React.createElement('div', { className: 'maf-empty' }, '加载中…')
            : treeRows.length === 0
              ? React.createElement('div', { className: 'maf-empty' }, root ? '（空目录）' : '正在加载工作区…')
              : treeRows))

      return React.createElement('div', { className: 'maf-view' }, leftPane, rightPane)
    }

    slots.inject('conversation.view', () => slots.register(
      { name: 'conversation.view', id: 'artifacts', order: 20, label: () => '产物' },
      (props) => React.createElement(ArtifactBrowser, props),
    ))
  },
}

		})();
		function apply(ctx) {
			const connection = ctx.connection;
			if (connection === undefined) return;
			host = {
				call: async (endpoint, payload) => {
					const res = await connection.rpc.call("/rpc", endpoint, payload);
					if (res.ok) return res.value;
					throw new Error((res.error && res.error.message) || ("rpc failed: " + endpoint));
				}
			};
			PLUGIN.apply(ctx);
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
