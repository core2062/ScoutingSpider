/* JavaRTE.js
   Single-file runtime + lightweight JScript (<JScript>) processor with external .JScript support.
   - Include via <script src="JavaSyntaxPortJScript.js"></script>
   - Write Java-like code inside <JScript> ... </JScript>
   - Or use <JScript src="Demo.JScript">Example.run(null)</JScript>
   - In addition, you may use data-args='[...]' to pass JSON args to the inline invocation.
   - PascalCase used for public API names.
*/

(function (root, factory) {
    if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
        module.exports = factory();
    } else {
        root.JavaSyntaxPort = factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this), function () {
    'use strict';

    /* ==========================
       Runtime: Java-like API
       ========================== */

    const _IsNode = typeof process !== "undefined" && process.versions && process.versions.node;
    const _Global = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : this);

    // --- Utility
    function _TypeNameOf(value) {
        if (value === null) return "Null";
        if (value === undefined) return "Undefined";
        if (Array.isArray(value)) return "Array";
        return (value && value.constructor && value.constructor.name) || typeof value;
    }

    // --- Primitive wrappers
    class Int {
        constructor(Value = 0) { this.Value = Number(Value) | 0; }
        GetValue() { return this.Value; }
        ToString() { return String(this.Value); }
    }

    class Float {
        constructor(Value = 0.0) { this.Value = Number(Value); }
        GetValue() { return this.Value; }
        ToString() { return String(this.Value); }
    }

    class JavaBoolean {
        constructor(Value = false) { this.Value = !!Value; }
        GetValue() { return this.Value; }
        ToString() { return String(this.Value); }
    }

    class JavaString {
        constructor(Value = "") { this.Value = String(Value); }
        GetValue() { return this.Value; }
        ToString() { return this.Value; }
        Length() { return this.Value.length; }
    }

    // --- Exceptions
    class JavaException extends Error {
        constructor(Message = "") {
            super(Message);
            this.Name = this.constructor.name;
        }
        GetMessage() { return this.message; }
        ToString() { return `${this.Name}: ${this.message}`; }
    }
    class RuntimeException extends JavaException {}
    class IllegalArgumentException extends JavaException {}
    class IndexOutOfBoundsException extends JavaException {}
    class IOException extends JavaException {}
    class InterruptedException extends JavaException {}

    // --- System.out.Println
    class PrintStream {
        Println(...Args) {
            const Out = Args.map(a => (a && typeof a.ToString === "function") ? a.ToString() : String(a)).join(' ');
            if (_IsNode) console.log(Out); else console.log(Out);
        }
        Print(...Args) {
            const Out = Args.map(a => (a && typeof a.ToString === "function") ? a.ToString() : String(a)).join(' ');
            if (_IsNode) process.stdout.write(Out); else console.log(Out);
        }
        Errorln(...Args) {
            const Out = Args.map(a => (a && typeof a.ToString === "function") ? a.ToString() : String(a)).join(' ');
            console.error(Out);
        }
    }
    const System = { Out: new PrintStream() };

    // Expose System globally for compiled code convenience
    if (!_Global.System) _Global.System = System;

    // --- Collections
    class ArrayList {
        constructor(Iterable = []) { this.List = Array.from(Iterable); }
        Add(Item) { this.List.push(Item); return true; }
        Get(Index) {
            if (Index < 0 || Index >= this.List.length) throw new IndexOutOfBoundsException("Index out of bounds");
            return this.List[Index];
        }
        Set(Index, Value) {
            if (Index < 0 || Index >= this.List.length) throw new IndexOutOfBoundsException("Index out of bounds");
            this.List[Index] = Value;
        }
        RemoveAt(Index) {
            if (Index < 0 || Index >= this.List.length) throw new IndexOutOfBoundsException("Index out of bounds");
            return this.List.splice(Index, 1)[0];
        }
        Size() { return this.List.length; }
        IsEmpty() { return this.List.length === 0; }
        Clear() { this.List.length = 0; }
        ToArray() { return this.List.slice(); }
        ForEach(Fn) { this.List.forEach(Fn); }
        [Symbol.iterator]() { return this.List[Symbol.iterator](); }
        ToString() { return `[${this.List.join(',')}]`; }
    }

    class HashMap {
        constructor(Entries = []) { this.Map = new Map(Entries); }
        Put(Key, Value) { this.Map.set(Key, Value); return Value; }
        Get(Key) { return this.Map.get(Key); }
        ContainsKey(Key) { return this.Map.has(Key); }
        Remove(Key) { const v = this.Map.get(Key); this.Map.delete(Key); return v; }
        Size() { return this.Map.size; }
        Clear() { this.Map.clear(); }
        Keys() { return Array.from(this.Map.keys()); }
        Values() { return Array.from(this.Map.values()); }
        Entries() { return Array.from(this.Map.entries()); }
        ForEach(Fn) { for (const [k, v] of this.Map) Fn(k, v); }
        ToString() { return `HashMap(${this.Map.size})`; }
    }

    // --- Enum helper
    function Enum(NamesArray) {
        const Result = {};
        for (let i = 0; i < NamesArray.length; i++) {
            const Name = NamesArray[i];
            Result[Name] = { name: Name, ordinal: i, ToString() { return this.name; } };
        }
        Object.defineProperty(Result, "Values", { value: function () { return NamesArray.map(n => Result[n]); }, enumerable: false });
        Object.defineProperty(Result, "ValueOf", { value: function (Name) { return Result[Name]; }, enumerable: false });
        return Object.freeze(Result);
    }

    // --- StringBuilder
    class StringBuilder {
        constructor() { this.Buffer = []; }
        Append(Value) { this.Buffer.push((Value && typeof Value.ToString === "function") ? Value.ToString() : String(Value)); return this; }
        ToString() { return this.Buffer.join(''); }
        Clear() { this.Buffer.length = 0; return this; }
    }

    // --- Math utilities
    class JavaMath {
        static Random() { return Math.random(); }
        static Abs(v) { return Math.abs(v); }
        static Floor(v) { return Math.floor(v); }
        static Ceil(v) { return Math.ceil(v); }
        static Round(v) { return Math.round(v); }
        static Max(a, b) { return Math.max(a, b); }
        static Min(a, b) { return Math.min(a, b); }
    }

    // --- Generic wrapper (runtime)
    function Generic(TypeConstructor) {
        return class GenericWrapper {
            constructor(Value) {
                if (!(Value instanceof TypeConstructor)) {
                    throw new IllegalArgumentException(`Generic mismatch: expected instance of ${TypeConstructor.name}`);
                }
                this.Value = Value;
            }
            Get() { return this.Value; }
            Set(v) { if (!(v instanceof TypeConstructor)) throw new IllegalArgumentException(`Generic mismatch: expected ${TypeConstructor.name}`); this.Value = v; }
            ToString() { return `Generic<${TypeConstructor.name}>(${this.Value})`; }
        };
    }

    // --- Thread (lightweight async)
    class Thread {
        constructor(Runnable) {
            this.Runnable = Runnable;
            this._handle = null;
            this._isAlive = false;
        }
        Start() {
            if (this._isAlive) return;
            this._isAlive = true;
            this._handle = setTimeout(() => {
                try {
                    if (typeof this.Runnable === "function") this.Runnable();
                    else if (this.Runnable && typeof this.Runnable.Run === "function") this.Runnable.Run();
                } catch (e) {
                    if (!(e instanceof JavaException)) throw new RuntimeException(e && e.message ? e.message : String(e));
                } finally { this._isAlive = false; }
            }, 0);
        }
        Join() {
            return new Promise((resolve) => {
                const check = () => { if (!this._isAlive) resolve(); else setTimeout(check, 10); };
                check();
            });
        }
        Interrupt() { if (this._handle) clearTimeout(this._handle); this._isAlive = false; }
        IsAlive() { return this._isAlive; }
    }

    // --- Try helper
    function Try(Block) {
        return {
            Catch: function (ExceptionType, Handler) {
                try { Block(); } catch (E) {
                    if (ExceptionType && (E instanceof ExceptionType || ExceptionType === null)) Handler(E); else throw E;
                }
                return this;
            },
            Finally: function (F) { try { F(); } catch (e) { /* ignore */ } }
        };
    }

    // --- File I/O (Node only)
    const File = {
        Read: function (Path) {
            if (!_IsNode) throw new IOException("File.Read only available in Node.js");
            const Fs = require('fs');
            try { return Fs.readFileSync(Path, 'utf8'); } catch (e) { throw new IOException(e.message); }
        },
        Write: function (Path, Data) {
            if (!_IsNode) throw new IOException("File.Write only available in Node.js");
            const Fs = require('fs');
            try { Fs.writeFileSync(Path, Data, 'utf8'); return true; } catch (e) { throw new IOException(e.message); }
        },
        Exists: function (Path) { if (!_IsNode) return false; const Fs = require('fs'); return Fs.existsSync(Path); }
    };

    // --- Simple Overload dispatcher (runtime)
    class OverloadDispatcher {
        constructor() { this._map = new Map(); }
        Register(MethodName, SignatureArray, Fn) {
            if (!this._map.has(MethodName)) this._map.set(MethodName, []);
            this._map.get(MethodName).push({ Sig: SignatureArray.slice(), Fn });
        }
        Dispatch(Context, MethodName, Args) {
            const candidates = this._map.get(MethodName) || [];
            const sig = Array.from(Args).map(a => (a && a.constructor && a.constructor.name) ? a.constructor.name : typeof a);
            // exact match
            for (const c of candidates) {
                if (c.Sig.length === sig.length && c.Sig.every((s,i) => s === sig[i])) return c.Fn.apply(Context, Args);
            }
            // by length
            for (const c of candidates) if (c.Sig.length === sig.length) return c.Fn.apply(Context, Args);
            if (candidates.length > 0) return candidates[0].Fn.apply(Context, Args);
            throw new RuntimeException(`No overload found for ${MethodName}(${sig.join(',')})`);
        }
    }

    /* ==========================
       JScript Runtime: Compiler + Loader
       ========================== */

    // Lightweight, conservative transformations (see prior version).
    // Helper transform functions (same logic as before)...

    function _stripAccessModifiers(code) {
        return code.replace(/\b(public|private|protected|final|volatile|transient)\b/g, '');
    }

    function _stripTypeAnnotationsInParams(code) {
        return code.replace(/\(([^)]*)\)/g, function (m, inside) {
            if (!inside.trim()) return '()';
            const parts = inside.split(',');
            const newParts = parts.map(p => {
                let s = p.trim();
                s = s.replace(/@\w+\s*/g, '');
                const tokens = s.split(/\s+/);
                if (tokens.length === 1) return tokens[0];
                const eqIndex = s.indexOf('=');
                let defaultPart = '';
                if (eqIndex !== -1) {
                    defaultPart = s.slice(eqIndex);
                }
                const nameToken = tokens[tokens.length - 1];
                return nameToken + (defaultPart || '');
            });
            return '(' + newParts.join(', ') + ')';
        });
    }

    function _stripLocalTypeDeclarations(code) {
        return code.replace(/\b(?:byte|short|int|long|float|double|boolean|char|String|Integer|Double|Long|Float|Boolean)\s+([A-Za-z_]\w*)(\s*=\s*[^;;]+;|\s*;)/g, 'var $1$2');
    }

    function _mapSystemPrints(code) {
        code = code.replace(/\bSystem\.out\.println\s*\(/g, 'System.Out.Println(');
        code = code.replace(/\bSystem\.out\.print\s*\(/g, 'System.Out.Print(');
        code = code.replace(/(^|\s|\;|\)|\{)\s*println\s*\(/g, '$1System.Out.Println(');
        return code;
    }

    function _transformEnumDeclarations(code) {
        return code.replace(/enum\s+([A-Za-z_]\w*)\s*\{([^}]+)\}/g, function (m, name, body) {
            const parts = body.split(',').map(p => p.replace(/\/\/.*$/g, '').replace(/\/\*.*?\*\//g, '').trim()).filter(Boolean);
            const names = parts.map(p => {
                const eq = p.indexOf('=');
                return eq === -1 ? p : p.slice(0, eq).trim();
            });
            return `const ${name} = Enum(${JSON.stringify(names)});`;
        });
    }

    function _normalizeConstructorNames(code) {
        return code.replace(/class\s+([A-Za-z_]\w*)\s*\{([\s\S]*?)\n\}/g, function (m, className, body) {
            const newBody = body.replace(new RegExp('(^|\\n|\\r)\\s*' + className + '\\s*\\(', 'g'), '$1constructor(');
            return `class ${className} {${newBody}\n}`;
        });
    }

    function _handleMethodOverloadsInClass(code) {
        // For brevity and because this is a best-effort heuristic, we reuse the earlier approach.
        // (The implementation is identical to the previous version's function.)
        return code.replace(/class\s+([A-Za-z_]\w*)\s*\{([\s\S]*?)\n\}/g, function (m, className, body) {
            const methodRegex = /(?:^[ \t]*)(?:static\s+)?([A-Za-z_]\w*)\s*\(([^\)]*)\)\s*\{/gm;
            let methods = [];
            let match;
            while ((match = methodRegex.exec(body)) !== null) {
                const name = match[1];
                const params = match[2].trim();
                methods.push({ name, params, idx: match.index });
            }
            const counts = methods.reduce((acc, it) => { acc[it.name] = (acc[it.name] || 0) + 1; return acc; }, {});
            const overloadedNames = Object.keys(counts).filter(n => counts[n] > 1);
            if (overloadedNames.length === 0) return `class ${className} {${body}\n}`;

            function extractMethodsBodies(src) {
                const res = [];
                const rx = /((?:^[ \t]*)(?:static\s+)?([A-Za-z_]\w*)\s*\(([^\)]*)\)\s*\{)/gm;
                let mm;
                while ((mm = rx.exec(src)) !== null) {
                    const start = mm.index + mm[1].length;
                    const methodName = mm[2];
                    const params = mm[3];
                    let depth = 1;
                    let pos = start;
                    while (pos < src.length && depth > 0) {
                        const ch = src[pos];
                        if (ch === '{') depth++;
                        else if (ch === '}') depth--;
                        pos++;
                    }
                    const bodyText = src.slice(start, pos - 1);
                    res.push({ fullStart: mm.index, header: mm[1], name: methodName, params, bodyText, fullEnd: pos });
                    rx.lastIndex = pos;
                }
                return res;
            }
            const extracted = extractMethodsBodies(body);
            const toRewrite = extracted.filter(e => overloadedNames.includes(e.name));
            if (toRewrite.length === 0) return `class ${className} {${body}\n}`;

            let newBody = body;
            toRewrite.sort((a, b) => b.fullStart - a.fullStart);
            const dispatcherVarName = '__overloads';
            const registrationLines = [];
            let helperCount = 0;
            for (const item of toRewrite) {
                helperCount++;
                const helperName = `__ov_${item.name}_${helperCount}`;
                const isStatic = /^\s*static\b/.test(item.header);
                const helperDecl = `${isStatic ? 'static ' : ''}${helperName}(${item.params}) {${item.bodyText}}`;
                newBody = newBody.slice(0, item.fullStart) + '\n    ' + helperDecl + newBody.slice(item.fullEnd);
                const paramCount = item.params.trim() ? item.params.split(',').length : 0;
                registrationLines.push({ name: item.name, helperName, paramCount, isStatic });
            }

            let ctorRegex = /(?:^[ \t]*)constructor\s*\(([^\)]*)\)\s*\{([\s\S]*?)\n\s*\}/m;
            let ctorMatch = ctorRegex.exec(newBody);
            if (ctorMatch) {
                const ctorStartIndex = newBody.indexOf('constructor(');
                const ctorOpen = newBody.indexOf('{', ctorStartIndex);
                let depth = 1; let pos = ctorOpen + 1;
                while (pos < newBody.length && depth > 0) {
                    if (newBody[pos] === '{') depth++;
                    else if (newBody[pos] === '}') depth--;
                    pos++;
                }
                const ctorClose = pos - 1;
                const ctorBody = newBody.slice(ctorOpen + 1, ctorClose);
                let regCode = '\n        // overload registrations\n';
                regCode += `        if (!this.${dispatcherVarName}) this.${dispatcherVarName} = new OverloadDispatcher();\n`;
                for (const r of registrationLines) {
                    if (r.isStatic) {
                        regCode += `        this.constructor.${dispatcherVarName} = this.constructor.${dispatcherVarName} || new OverloadDispatcher();\n        this.constructor.${dispatcherVarName}.Register("${r.name}", ${JSON.stringify(Array(r.paramCount).fill('any'))}, this.constructor.${r.helperName});\n`;
                    } else {
                        regCode += `        this.${dispatcherVarName}.Register("${r.name}", ${JSON.stringify(Array(r.paramCount).fill('any'))}, this.${r.helperName}.bind(this));\n`;
                    }
                }
                const newCtor = 'constructor(' + ctorMatch[1] + ') {' + ctorBody + regCode + '\n    }';
                newBody = newBody.slice(0, ctorMatch.index) + newCtor + newBody.slice(ctorMatch.index + ctorMatch[0].length);
            } else {
                let regCode = '    constructor() {\n        // overload registrations\n        if (!this.__overloads) this.__overloads = new OverloadDispatcher();\n';
                for (const r of registrationLines) {
                    if (r.isStatic) {
                        regCode += `        this.constructor.__overloads = this.constructor.__overloads || new OverloadDispatcher();\n        this.constructor.__overloads.Register("${r.name}", ${JSON.stringify(Array(r.paramCount).fill('any'))}, this.constructor.${r.helperName});\n`;
                    } else {
                        regCode += `        this.__overloads.Register("${r.name}", ${JSON.stringify(Array(r.paramCount).fill('any'))}, this.${r.helperName}.bind(this));\n`;
                    }
                }
                regCode += '    }\n';
                newBody = regCode + newBody;
            }

            const proxies = {};
            for (const r of registrationLines) {
                if (!proxies[r.name]) proxies[r.name] = { isStatic: r.isStatic };
            }
            let proxyCode = '\n    // overload proxies\n';
            for (const pname of Object.keys(proxies)) {
                if (proxies[pname].isStatic) {
                    proxyCode += `    static ${pname}() { return this.__overloads.Dispatch(this, "${pname}", arguments); }\n`;
                } else {
                    proxyCode += `    ${pname}() { return this.__overloads.Dispatch(this, "${pname}", arguments); }\n`;
                }
            }
            return `class ${className} {${newBody}\n${proxyCode}\n}`;
        });
    }

    // Primary compile function (exposed)
    function CompileJScript(sourceCode) {
        try {
            let code = String(sourceCode);
            code = code.replace(/\r\n/g, '\n');
            code = _stripAccessModifiers(code);
            code = _transformEnumDeclarations(code);
            code = _normalizeConstructorNames(code);
            code = _stripTypeAnnotationsInParams(code);
            code = _stripLocalTypeDeclarations(code);
            code = _mapSystemPrints(code);
            code = _handleMethodOverloadsInClass(code);
            code = code.replace(/static\s+void\s+main\s*\(\s*String\s*\[\]\s*([A-Za-z_]\w*)\s*\)/g, 'static main($1)');
            code = code.replace(/void\s+main\s*\(\s*String\s*\[\]\s*([A-Za-z_]\w*)\s*\)/g, 'main($1)');
            return code;
        } catch (e) {
            throw new RuntimeException("CompileJScript failed: " + (e && e.message ? e.message : String(e)));
        }
    }

    // Execute compiled JS code in global scope safely
    function _executeGlobal(jsCode, meta) {
        try {
            const fn = new Function(jsCode);
            return fn();
        } catch (e) {
            const errMsg = `Error executing <JScript>${meta ? ' (block: ' + meta + ')' : ''}: ${e && e.message ? e.message : String(e)}`;
            console.error(errMsg);
            throw new RuntimeException(errMsg);
        }
    }

    // Public runner: compile then execute
    function RunJScriptBlock(sourceCode, meta) {
        const js = CompileJScript(sourceCode);
        return _executeGlobal(js, meta);
    }

    // --- New: fetch/read external .JScript content
    async function _LoadExternalSources(srcAttr) {
        // srcAttr may be comma-separated list
        const sources = String(srcAttr || '').split(',').map(s => s.trim()).filter(Boolean);
        let combined = '';
        for (const src of sources) {
            try {
                if (_IsNode) {
                    // Node: read file synchronously via File.Read
                    combined += File.Read(src) + '\n';
                } else {
                    // Browser: fetch the resource (CORS rules apply)
                    const resp = await fetch(src, { credentials: 'same-origin' });
                    if (!resp.ok) {
                        console.error(`JavaSyntaxPort: Failed to fetch ${src} (status ${resp.status})`);
                        continue;
                    }
                    const txt = await resp.text();
                    combined += txt + '\n';
                }
            } catch (e) {
                console.error(`JavaSyntaxPort: Error loading ${src}: ${e && e.message ? e.message : e}`);
            }
        }
        return combined;
    }

    // Process all <JScript> tags in document (now async to await external fetches)
    async function _processAllJScriptTags() {
        if (typeof document === 'undefined' || !document.getElementsByTagName) return;
        const blocks = document.getElementsByTagName('JScript');
        if (!blocks || blocks.length === 0) return;
        const arr = Array.prototype.slice.call(blocks);
        for (let idx = 0; idx < arr.length; idx++) {
            const blk = arr[idx];
            try {
                const srcAttr = blk.getAttribute && blk.getAttribute('src');
                let externalSource = '';
                if (srcAttr) {
                    externalSource = await _LoadExternalSources(srcAttr);
                    if (!externalSource.trim()) {
                        console.warn(`JavaSyntaxPort: No code loaded from src="${srcAttr}" (maybe CORS or missing file)`);
                    }
                }
                // Inline body (invocation or additional code)
                const inline = blk.textContent || blk.innerText || '';
                // Skip if data-run="false"
                const runAttr = blk.getAttribute && blk.getAttribute('data-run');
                if (runAttr === 'false') continue;

                // Process data-args attribute (JSON or simple CSV)
                let parsedArgs;
                const argsAttr = blk.getAttribute && blk.getAttribute('data-args');
                if (typeof argsAttr === 'string' && argsAttr.trim()) {
                    try {
                        parsedArgs = JSON.parse(argsAttr);
                    } catch (e) {
                        // fallback parse comma-separated
                        parsedArgs = argsAttr.split(',').map(s => {
                            const t = s.trim();
                            if (!t) return t;
                            if (/^\d+$/.test(t)) return parseInt(t, 10);
                            if (/^\d+\.\d+$/.test(t)) return parseFloat(t);
                            if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
                            if (/^null$/i.test(t)) return null;
                            // strip quotes if provided
                            const m = t.match(/^"(.*)"$/) || t.match(/^'(.*)'$/);
                            return m ? m[1] : t;
                        });
                    }
                    // expose to global for convenience
                    try { _Global.JScriptArgs = parsedArgs; _Global.Arguments = parsedArgs; } catch (e) { /* ignore */ }
                } else {
                    // ensure previous JScriptArgs doesn't leak unexpectedly; do not delete in case user expects it
                }

                // Execute external code first (so classes/defs are available)
                if (externalSource && externalSource.trim()) {
                    try {
                        RunJScriptBlock(externalSource, `external:${srcAttr}`);
                    } catch (e) {
                        console.error(`JavaSyntaxPort: Error executing external source ${srcAttr}:`, e && e.message ? e.message : e);
                        // continue to inline invocation — maybe it handles missing definitions, so we don't abort
                    }
                }

                // Execute inline content (if any)
                const inlineTrim = inline.trim();
                if (inlineTrim) {
                    try {
                        RunJScriptBlock(inlineTrim, `inline:${srcAttr || ('#' + idx)}`);
                    } catch (e) {
                        console.error(`JavaSyntaxPort: Error executing inline JScript block:`, e && e.message ? e.message : e);
                    }
                }
            } catch (e) {
                console.error("JavaSyntaxPort: Unexpected error processing <JScript> block:", e && e.message ? e.message : e);
            }
        }
    }

    // Hook to DOMContentLoaded (async-safe)
    if (typeof document !== 'undefined' && document.addEventListener) {
        if (document.readyState !== 'loading') {
            setTimeout(() => { _processAllJScriptTags().catch(err => console.error("JScript processing failed:", err)); }, 0);
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                _processAllJScriptTags().catch(err => console.error("JScript processing failed:", err));
            });
        }
    }

    /* ==========================
       Export API
       ========================== */

    const Exports = {
        // Runtime env
        IsNode: _IsNode,

        // Primitives
        Int, Float, JavaBoolean, JavaString,

        // Exceptions
        JavaException, RuntimeException, IllegalArgumentException, IndexOutOfBoundsException, IOException, InterruptedException,

        // IO / System
        System,

        // Collections
        ArrayList, HashMap,

        // Enum, StringBuilder
        Enum, StringBuilder,

        // Math
        JavaMath,

        // Generics, Thread, Try, File
        Generic, Thread, Try, File,

        // OverloadDispatcher exposed (runtime)
        OverloadDispatcher,

        // JScript compile/run and loader
        CompileJScript, RunJScriptBlock, _LoadExternalSources, _processAllJScriptTags,

        // Convenience
        ToJavaString: function (v) { if (v === null || v === undefined) return new JavaString(String(v)); if (v && typeof v.ToString === 'function') return new JavaString(v.ToString()); return new JavaString(String(v)); },
    };

    // also put JavaSyntaxPort global alias
    if (!_Global.JavaSyntaxPort) _Global.JavaSyntaxPort = Exports;

    // return
    return Exports;
});
