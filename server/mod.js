// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const internalErrorData = {
    code: -32603,
    message: "Internal error"
};
const parseErrorData = {
    code: -32700,
    message: "Parse error"
};
const methodNotFoundErrorData = {
    code: -32601,
    message: "Method not found"
};
const invalidParamsErrorData = {
    code: -32602,
    message: "Invalid params"
};
const invalidRequestErrorData = {
    code: -32600,
    message: "Invalid Request"
};
const authErrorData = {
    code: -32020,
    message: "Authorization error"
};
class CustomError extends Error {
    code;
    data;
    constructor(code, message, data){
        super(message);
        this.code = code;
        this.data = data;
    }
}
const osType = (()=>{
    const { Deno: Deno1 } = globalThis;
    if (typeof Deno1?.build?.os === "string") {
        return Deno1.build.os;
    }
    const { navigator } = globalThis;
    if (navigator?.appVersion?.includes?.("Win")) {
        return "windows";
    }
    return "linux";
})();
const isWindows = osType === "windows";
function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
function stripSuffix(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
function lastPathSegment(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
function assertArgs(path, suffix) {
    assertPath(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
}
const CHAR_FORWARD_SLASH = 47;
function stripTrailingSeparators(segment, isSep) {
    if (segment.length <= 1) {
        return segment;
    }
    let end = segment.length;
    for(let i = segment.length - 1; i > 0; i--){
        if (isSep(segment.charCodeAt(i))) {
            end = i;
        } else {
            break;
        }
    }
    return segment.slice(0, end);
}
function isPosixPathSeparator(code) {
    return code === 47;
}
function isPathSeparator(code) {
    return code === 47 || code === 92;
}
function isWindowsDeviceRoot(code) {
    return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function basename(path, suffix = "") {
    assertArgs(path, suffix);
    let start = 0;
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === 58) start = 2;
        }
    }
    const lastSegment = lastPathSegment(path, isPathSeparator, start);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPathSeparator);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function assertArg(path) {
    assertPath(path);
    if (path.length === 0) return ".";
}
function dirname(path) {
    assertArg(path);
    const len = path.length;
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return path;
                        }
                        if (j !== last) {
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}
function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    if (path.length >= 2 && path.charCodeAt(1) === 58 && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
    if (!dir) return base;
    if (base === sep) return dir;
    if (dir === pathObject.root) return dir + base;
    return dir + sep + base;
}
function assertArg1(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
}
function format(pathObject) {
    assertArg1(pathObject);
    return _format("\\", pathObject);
}
function assertArg2(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol !== "file:") {
        throw new TypeError("Must be a file URL.");
    }
    return url;
}
function fromFileUrl(url) {
    url = assertArg2(url);
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname !== "") {
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        if (len > 2 && path.charCodeAt(1) === 58) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
class AssertionError extends Error {
    constructor(message){
        super(message);
        this.name = "AssertionError";
    }
}
function assert(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
function assertArg3(path) {
    assertPath(path);
    if (path.length === 0) return ".";
}
function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for(let i = 0, len = path.length; i <= len; ++i){
        if (i < len) code = path.charCodeAt(i);
        else if (isPathSeparator(code)) break;
        else code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        } else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    } else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0) res += `${separator}..`;
                    else res = "..";
                    lastSegmentLength = 2;
                }
            } else {
                if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
                else res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        } else if (code === 46 && dots !== -1) {
            ++dots;
        } else {
            dots = -1;
        }
    }
    return res;
}
function normalize(path) {
    assertArg3(path);
    const len = path.length;
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
function join(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < paths.length; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart !== null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    if (len > 1) {
        if (isPathSeparator(code)) {
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                let j = 2;
                let last = j;
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    last = j;
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        last = j;
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            rootEnd = j;
                        } else if (j !== last) {
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            if (path.charCodeAt(1) === 58) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            ret.root = ret.dir = path;
                            ret.base = "\\";
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        ret.root = ret.dir = path;
        ret.base = "\\";
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    ret.base = ret.base || "\\";
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        const { Deno: Deno1 } = globalThis;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno1.cwd();
        } else {
            if (typeof Deno1?.env?.get !== "function" || typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        if (len > 1) {
            if (isPathSeparator(code)) {
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    let j = 2;
                    let last = j;
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        last = j;
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            last = j;
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                if (path.charCodeAt(1) === 58) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
function assertArgs1(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
}
function relative(from, to) {
    assertArgs1(from, to);
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== 92) break;
    }
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== 92) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== 92) break;
    }
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== 92) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === 92) {
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === 92) {
                    lastCommonSep = i;
                } else if (i === 2) {
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === 92) lastCommonSep = i;
    }
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === 92) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === 92) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20"
};
function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c)=>{
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname !== undefined && hostname !== "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
function toNamespacedPath(path) {
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === 92) {
            if (resolvedPath.charCodeAt(1) === 92) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== 63 && code !== 46) {
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            if (resolvedPath.charCodeAt(1) === 58 && resolvedPath.charCodeAt(2) === 92) {
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
function _common(paths, sep) {
    const [first = "", ...remaining] = paths;
    if (first === "" || remaining.length === 0) {
        return first.substring(0, first.lastIndexOf(sep) + 1);
    }
    const parts = first.split(sep);
    let endOfPrefix = parts.length;
    for (const path of remaining){
        const compare = path.split(sep);
        for(let i = 0; i < endOfPrefix; i++){
            if (compare[i] !== parts[i]) {
                endOfPrefix = i;
            }
        }
        if (endOfPrefix === 0) {
            return "";
        }
    }
    const prefix = parts.slice(0, endOfPrefix).join(sep);
    return prefix.endsWith(sep) ? prefix : `${prefix}${sep}`;
}
const SEP = "\\";
const SEP_PATTERN = /[\\/]+/;
function common(paths, sep = SEP) {
    return _common(paths, sep);
}
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
    "-",
    "\\",
    "]"
];
function _globToRegExp(c, glob, { extended = true, globstar: globstarOption = true, caseInsensitive = false } = {}) {
    if (glob === "") {
        return /(?!)/;
    }
    let newLength = glob.length;
    for(; newLength > 1 && c.seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        for(; i < glob.length && !c.seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] === c.escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] === "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] === "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] === "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] === ":") {
                    let k = i + 1;
                    let value = "";
                    while(glob[k + 1] !== undefined && glob[k + 1] !== ":"){
                        value += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] === ":" && glob[k + 2] === "]") {
                        i = k + 2;
                        if (value === "alnum") segment += "\\dA-Za-z";
                        else if (value === "alpha") segment += "A-Za-z";
                        else if (value === "ascii") segment += "\x00-\x7F";
                        else if (value === "blank") segment += "\t ";
                        else if (value === "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value === "digit") segment += "\\d";
                        else if (value === "graph") segment += "\x21-\x7E";
                        else if (value === "lower") segment += "a-z";
                        else if (value === "print") segment += "\x20-\x7E";
                        else if (value === "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value === "space") segment += "\\s\v";
                        else if (value === "upper") segment += "A-Z";
                        else if (value === "word") segment += "\\w";
                        else if (value === "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] === "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] === "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] === ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] !== "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type === "!") {
                    segment += c.wildcard;
                } else if (type !== "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] === "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] !== "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] === "+" && extended && glob[i + 1] === "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] === "@" && extended && glob[i + 1] === "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] === "?") {
                if (extended && glob[i + 1] === "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] === "!" && extended && glob[i + 1] === "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] === "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] === "}" && groupStack[groupStack.length - 1] === "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] === "," && groupStack[groupStack.length - 1] === "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] === "*") {
                if (extended && glob[i + 1] === "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] === "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars === 2 && [
                        ...c.seps,
                        undefined
                    ].includes(prevChar) && [
                        ...c.seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += c.globstar;
                        endsWithSep = true;
                    } else {
                        segment += c.wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        if (groupStack.length > 0 || inRange || inEscape) {
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? c.sep : c.sepMaybe;
            endsWithSep = true;
        }
        while(c.seps.includes(glob[i]))i++;
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
const constants = {
    sep: "(?:\\\\|/)+",
    sepMaybe: "(?:\\\\|/)*",
    seps: [
        "\\",
        "/"
    ],
    globstar: "(?:[^\\\\/]*(?:\\\\|/|$)+)*",
    wildcard: "[^\\\\/]*",
    escapePrefix: "`"
};
function globToRegExp(glob, options = {}) {
    return _globToRegExp(constants, glob, options);
}
function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|\?|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
function normalizeGlob(glob, { globstar = false } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
function joinGlobs(globs, { extended = true, globstar = false } = {}) {
    if (!globstar || globs.length === 0) {
        return join(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
const sep = "\\";
const delimiter = ";";
const mod = {
    sep: sep,
    delimiter: delimiter,
    basename,
    dirname,
    extname,
    format,
    fromFileUrl,
    isAbsolute,
    join,
    normalize,
    parse,
    relative,
    resolve,
    toFileUrl,
    toNamespacedPath,
    common,
    SEP,
    SEP_PATTERN,
    globToRegExp,
    isGlob,
    joinGlobs,
    normalizeGlob
};
function isPosixPathSeparator1(code) {
    return code === 47;
}
function basename1(path, suffix = "") {
    assertArgs(path, suffix);
    const lastSegment = lastPathSegment(path, isPosixPathSeparator1);
    const strippedSegment = stripTrailingSeparators(lastSegment, isPosixPathSeparator1);
    return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}
function dirname1(path) {
    assertArg(path);
    let end = -1;
    let matchedNonSeparator = false;
    for(let i = path.length - 1; i >= 1; --i){
        if (isPosixPathSeparator1(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                end = i;
                break;
            }
        } else {
            matchedNonSeparator = true;
        }
    }
    if (end === -1) {
        return isPosixPathSeparator1(path.charCodeAt(0)) ? "/" : ".";
    }
    return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator1);
}
function extname1(path) {
    assertPath(path);
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let preDotState = 0;
    for(let i = path.length - 1; i >= 0; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return "";
    }
    return path.slice(startDot, end);
}
function format1(pathObject) {
    assertArg1(pathObject);
    return _format("/", pathObject);
}
function fromFileUrl1(url) {
    url = assertArg2(url);
    return decodeURIComponent(url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
}
function isAbsolute1(path) {
    assertPath(path);
    return path.length > 0 && isPosixPathSeparator1(path.charCodeAt(0));
}
function normalize1(path) {
    assertArg3(path);
    const isAbsolute = isPosixPathSeparator1(path.charCodeAt(0));
    const trailingSeparator = isPosixPathSeparator1(path.charCodeAt(path.length - 1));
    path = normalizeString(path, !isAbsolute, "/", isPosixPathSeparator1);
    if (path.length === 0 && !isAbsolute) path = ".";
    if (path.length > 0 && trailingSeparator) path += "/";
    if (isAbsolute) return `/${path}`;
    return path;
}
function join1(...paths) {
    if (paths.length === 0) return ".";
    let joined;
    for(let i = 0, len = paths.length; i < len; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `/${path}`;
        }
    }
    if (!joined) return ".";
    return normalize1(joined);
}
function parse1(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    if (path.length === 0) return ret;
    const isAbsolute = isPosixPathSeparator1(path.charCodeAt(0));
    let start;
    if (isAbsolute) {
        ret.root = "/";
        start = 1;
    } else {
        start = 0;
    }
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    let preDotState = 0;
    for(; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPosixPathSeparator1(code)) {
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            matchedSlash = false;
            end = i + 1;
        }
        if (code === 46) {
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
            if (startPart === 0 && isAbsolute) {
                ret.base = ret.name = path.slice(1, end);
            } else {
                ret.base = ret.name = path.slice(startPart, end);
            }
        }
        ret.base = ret.base || "/";
    } else {
        if (startPart === 0 && isAbsolute) {
            ret.name = path.slice(1, startDot);
            ret.base = path.slice(1, end);
        } else {
            ret.name = path.slice(startPart, startDot);
            ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
    }
    if (startPart > 0) {
        ret.dir = stripTrailingSeparators(path.slice(0, startPart - 1), isPosixPathSeparator1);
    } else if (isAbsolute) ret.dir = "/";
    return ret;
}
function resolve1(...pathSegments) {
    let resolvedPath = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--){
        let path;
        if (i >= 0) path = pathSegments[i];
        else {
            const { Deno: Deno1 } = globalThis;
            if (typeof Deno1?.cwd !== "function") {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            path = Deno1.cwd();
        }
        assertPath(path);
        if (path.length === 0) {
            continue;
        }
        resolvedPath = `${path}/${resolvedPath}`;
        resolvedAbsolute = isPosixPathSeparator1(path.charCodeAt(0));
    }
    resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, "/", isPosixPathSeparator1);
    if (resolvedAbsolute) {
        if (resolvedPath.length > 0) return `/${resolvedPath}`;
        else return "/";
    } else if (resolvedPath.length > 0) return resolvedPath;
    else return ".";
}
function relative1(from, to) {
    assertArgs1(from, to);
    from = resolve1(from);
    to = resolve1(to);
    if (from === to) return "";
    let fromStart = 1;
    const fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (!isPosixPathSeparator1(from.charCodeAt(fromStart))) break;
    }
    const fromLen = fromEnd - fromStart;
    let toStart = 1;
    const toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (!isPosixPathSeparator1(to.charCodeAt(toStart))) break;
    }
    const toLen = toEnd - toStart;
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (isPosixPathSeparator1(to.charCodeAt(toStart + i))) {
                    return to.slice(toStart + i + 1);
                } else if (i === 0) {
                    return to.slice(toStart + i);
                }
            } else if (fromLen > length) {
                if (isPosixPathSeparator1(from.charCodeAt(fromStart + i))) {
                    lastCommonSep = i;
                } else if (i === 0) {
                    lastCommonSep = 0;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (isPosixPathSeparator1(fromCode)) lastCommonSep = i;
    }
    let out = "";
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || isPosixPathSeparator1(from.charCodeAt(i))) {
            if (out.length === 0) out += "..";
            else out += "/..";
        }
    }
    if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
    else {
        toStart += lastCommonSep;
        if (isPosixPathSeparator1(to.charCodeAt(toStart))) ++toStart;
        return to.slice(toStart);
    }
}
function toFileUrl1(path) {
    if (!isAbsolute1(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(path.replace(/%/g, "%25").replace(/\\/g, "%5C"));
    return url;
}
function toNamespacedPath1(path) {
    return path;
}
const SEP1 = "/";
const SEP_PATTERN1 = /\/+/;
function common1(paths, sep = SEP1) {
    return _common(paths, sep);
}
const constants1 = {
    sep: "/+",
    sepMaybe: "/*",
    seps: [
        "/"
    ],
    globstar: "(?:[^/]*(?:/|$)+)*",
    wildcard: "[^/]*",
    escapePrefix: "\\"
};
function globToRegExp1(glob, options = {}) {
    return _globToRegExp(constants1, glob, options);
}
function normalizeGlob1(glob, { globstar = false } = {}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize1(glob);
    }
    const s = SEP_PATTERN1.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize1(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
function joinGlobs1(globs, { extended = true, globstar = false } = {}) {
    if (!globstar || globs.length === 0) {
        return join1(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP1}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob1(joined, {
        extended,
        globstar
    });
}
const sep1 = "/";
const delimiter1 = ":";
const mod1 = {
    sep: sep1,
    delimiter: delimiter1,
    basename: basename1,
    dirname: dirname1,
    extname: extname1,
    format: format1,
    fromFileUrl: fromFileUrl1,
    isAbsolute: isAbsolute1,
    join: join1,
    normalize: normalize1,
    parse: parse1,
    relative: relative1,
    resolve: resolve1,
    toFileUrl: toFileUrl1,
    toNamespacedPath: toNamespacedPath1,
    common: common1,
    SEP: SEP1,
    SEP_PATTERN: SEP_PATTERN1,
    globToRegExp: globToRegExp1,
    isGlob,
    joinGlobs: joinGlobs1,
    normalizeGlob: normalizeGlob1
};
isWindows ? mod.sep : mod1.sep;
isWindows ? mod.delimiter : mod1.delimiter;
Deno.build.os === "windows";
Deno.build.os === "windows";
new Deno.errors.AlreadyExists("dest already exists.");
Deno.build.os === "windows";
const LF = "\n";
const CRLF = "\r\n";
Deno?.build.os === "windows" ? CRLF : LF;
const encoder = new TextEncoder();
function getTypeName(value) {
    const type = typeof value;
    if (type !== "object") {
        return type;
    } else if (value === null) {
        return "null";
    } else {
        return value?.constructor?.name ?? "object";
    }
}
function validateBinaryLike(source) {
    if (typeof source === "string") {
        return encoder.encode(source);
    } else if (source instanceof Uint8Array) {
        return source;
    } else if (source instanceof ArrayBuffer) {
        return new Uint8Array(source);
    }
    throw new TypeError(`The input must be a Uint8Array, a string, or an ArrayBuffer. Received a value of the type ${getTypeName(source)}.`);
}
new TextEncoder().encode("0123456789abcdef");
new TextEncoder();
new TextDecoder();
const base64abc = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/"
];
const encode = encodeBase64;
const decode = decodeBase64;
function encodeBase64(data) {
    const uint8 = validateBinaryLike(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc[uint8[i - 2] >> 2];
        result += base64abc[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
function decodeBase64(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
const mod2 = {
    encode: encode,
    decode: decode,
    encodeBase64: encodeBase64,
    decodeBase64: decodeBase64
};
function compareNumber(a, b) {
    if (isNaN(a) || isNaN(b)) {
        throw new Error("Comparison against non-numbers");
    }
    return a === b ? 0 : a < b ? -1 : 1;
}
function checkIdentifier(v1, v2) {
    if (v1.length && !v2.length) {
        return -1;
    } else if (!v1.length && v2.length) {
        return 1;
    } else {
        return 0;
    }
}
function compareIdentifier(v1, v2) {
    let i = 0;
    do {
        const a = v1[i];
        const b = v2[i];
        if (a === undefined && b === undefined) {
            return 0;
        } else if (b === undefined) {
            return 1;
        } else if (a === undefined) {
            return -1;
        } else if (typeof a === "string" && typeof b === "number") {
            return 1;
        } else if (typeof a === "number" && typeof b === "string") {
            return -1;
        } else if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            continue;
        }
    }while (++i)
    return 0;
}
const re = [];
const src = [];
let R = 0;
const NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = "0|[1-9]\\d*";
const NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-][a-zA-Z0-9-]*";
const MAINVERSION = R++;
const nid = src[NUMERICIDENTIFIER];
src[MAINVERSION] = `(${nid})\\.(${nid})\\.(${nid})`;
const PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = "(?:" + src[NUMERICIDENTIFIER] + "|" + src[NONNUMERICIDENTIFIER] + ")";
const PRERELEASE = R++;
src[PRERELEASE] = "(?:-(" + src[PRERELEASEIDENTIFIER] + "(?:\\." + src[PRERELEASEIDENTIFIER] + ")*))";
const BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = "[0-9A-Za-z-]+";
const BUILD = R++;
src[BUILD] = "(?:\\+(" + src[BUILDIDENTIFIER] + "(?:\\." + src[BUILDIDENTIFIER] + ")*))";
const FULL = R++;
const FULLPLAIN = "v?" + src[MAINVERSION] + src[PRERELEASE] + "?" + src[BUILD] + "?";
src[FULL] = "^" + FULLPLAIN + "$";
const GTLT = R++;
src[GTLT] = "((?:<|>)?=?)";
const XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + "|x|X|\\*";
const XRANGEPLAIN = R++;
src[XRANGEPLAIN] = "[v=\\s]*(" + src[XRANGEIDENTIFIER] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIER] + ")" + "(?:\\.(" + src[XRANGEIDENTIFIER] + ")" + "(?:" + src[PRERELEASE] + ")?" + src[BUILD] + "?" + ")?)?";
const XRANGE = R++;
src[XRANGE] = "^" + src[GTLT] + "\\s*" + src[XRANGEPLAIN] + "$";
const LONETILDE = R++;
src[LONETILDE] = "(?:~>?)";
const TILDE = R++;
src[TILDE] = "^" + src[LONETILDE] + src[XRANGEPLAIN] + "$";
const LONECARET = R++;
src[LONECARET] = "(?:\\^)";
const CARET = R++;
src[CARET] = "^" + src[LONECARET] + src[XRANGEPLAIN] + "$";
const COMPARATOR = R++;
src[COMPARATOR] = "^" + src[GTLT] + "\\s*(" + FULLPLAIN + ")$|^$";
const HYPHENRANGE = R++;
src[HYPHENRANGE] = "^\\s*(" + src[XRANGEPLAIN] + ")" + "\\s+-\\s+" + "(" + src[XRANGEPLAIN] + ")" + "\\s*$";
const STAR = R++;
src[STAR] = "(<|>)?=?\\s*\\*";
for(let i = 0; i < R; i++){
    if (!re[i]) {
        re[i] = new RegExp(src[i]);
    }
}
function isValidNumber(value) {
    return typeof value === "number" && !Number.isNaN(value) && (!Number.isFinite(value) || 0 <= value && value <= Number.MAX_SAFE_INTEGER);
}
function isValidString(value) {
    return typeof value === "string" && value.length > 0 && value.length <= 256 && !!value.match(/[0-9A-Za-z-]+/);
}
function isValidOperator(value) {
    if (typeof value !== "string") return false;
    switch(value){
        case "":
        case "=":
        case "==":
        case "===":
        case "!==":
        case "!=":
        case ">":
        case ">=":
        case "<":
        case "<=":
            return true;
        default:
            return false;
    }
}
function compare(s0, s1) {
    if (s0 === s1) return 0;
    return compareNumber(s0.major, s1.major) || compareNumber(s0.minor, s1.minor) || compareNumber(s0.patch, s1.patch) || checkIdentifier(s0.prerelease, s1.prerelease) || compareIdentifier(s0.prerelease, s1.prerelease);
}
function eq(s0, s1) {
    return compare(s0, s1) === 0;
}
function neq(s0, s1) {
    return compare(s0, s1) !== 0;
}
function gte(s0, s1) {
    return compare(s0, s1) >= 0;
}
function gt(s0, s1) {
    return compare(s0, s1) > 0;
}
function lt(s0, s1) {
    return compare(s0, s1) < 0;
}
function lte(s0, s1) {
    return compare(s0, s1) <= 0;
}
function cmp(s0, operator, s1) {
    switch(operator){
        case "":
        case "=":
        case "==":
        case "===":
            return eq(s0, s1);
        case "!=":
        case "!==":
            return neq(s0, s1);
        case ">":
            return gt(s0, s1);
        case ">=":
            return gte(s0, s1);
        case "<":
            return lt(s0, s1);
        case "<=":
            return lte(s0, s1);
        default:
            throw new TypeError(`Invalid operator: ${operator}`);
    }
}
const MAX = {
    major: Number.POSITIVE_INFINITY,
    minor: Number.POSITIVE_INFINITY,
    patch: Number.POSITIVE_INFINITY,
    prerelease: [],
    build: []
};
const MIN = {
    major: 0,
    minor: 0,
    patch: 0,
    prerelease: [],
    build: []
};
const INVALID = {
    major: Number.NEGATIVE_INFINITY,
    minor: Number.POSITIVE_INFINITY,
    patch: Number.POSITIVE_INFINITY,
    prerelease: [],
    build: []
};
const ANY = {
    major: Number.NaN,
    minor: Number.NaN,
    patch: Number.NaN,
    prerelease: [],
    build: []
};
const ALL = {
    operator: "",
    semver: ANY,
    min: MIN,
    max: MAX
};
const NONE = {
    operator: "<",
    semver: MIN,
    min: MAX,
    max: MIN
};
function formatNumber(value) {
    if (value === Number.POSITIVE_INFINITY) {
        return "∞";
    } else if (value === Number.NEGATIVE_INFINITY) {
        return "⧞";
    } else {
        return value.toFixed(0);
    }
}
function format2(semver, style = "full") {
    if (semver === ANY) {
        return "*";
    }
    const major = formatNumber(semver.major);
    const minor = formatNumber(semver.minor);
    const patch = formatNumber(semver.patch);
    const pre = semver.prerelease.join(".");
    const build = semver.build.join(".");
    const primary = `${major}.${minor}.${patch}`;
    const release = [
        primary,
        pre
    ].filter((v)=>v).join("-");
    const full = [
        release,
        build
    ].filter((v)=>v).join("+");
    switch(style){
        case "full":
            return full;
        case "release":
            return release;
        case "primary":
            return primary;
        case "build":
            return build;
        case "pre":
            return pre;
        case "patch":
            return patch;
        case "minor":
            return minor;
        case "major":
            return major;
    }
}
function comparatorFormat(comparator) {
    const { semver, operator } = comparator;
    return `${operator}${format2(semver)}`;
}
function comparatorIntersects(c0, c1) {
    const l0 = c0.min;
    const l1 = c0.max;
    const r0 = c1.min;
    const r1 = c1.max;
    return gte(l0, r0) && lte(l0, r1) || gte(r0, l0) && lte(r0, l1);
}
function comparatorMax(semver, operator) {
    if (semver === ANY) {
        return MAX;
    }
    switch(operator){
        case "!=":
        case "!==":
        case ">":
        case ">=":
            return MAX;
        case "":
        case "=":
        case "==":
        case "===":
        case "<=":
            return semver;
        case "<":
            {
                const patch = semver.patch - 1;
                const minor = patch >= 0 ? semver.minor : semver.minor - 1;
                const major = minor >= 0 ? semver.major : semver.major - 1;
                if (major < 0) {
                    return INVALID;
                } else {
                    return {
                        major,
                        minor: minor >= 0 ? minor : Number.POSITIVE_INFINITY,
                        patch: patch >= 0 ? patch : Number.POSITIVE_INFINITY,
                        prerelease: [],
                        build: []
                    };
                }
            }
    }
}
function pre(prerelease, identifier) {
    let values = [
        ...prerelease
    ];
    let i = values.length;
    while(--i >= 0){
        if (typeof values[i] === "number") {
            values[i]++;
            i = -2;
        }
    }
    if (i === -1) {
        values.push(0);
    }
    if (identifier) {
        if (values[0] === identifier) {
            if (isNaN(values[1])) {
                values = [
                    identifier,
                    0
                ];
            }
        } else {
            values = [
                identifier,
                0
            ];
        }
    }
    return values;
}
function parseBuild(build, metadata) {
    return metadata === undefined ? build : metadata.split(".").filter((m)=>m);
}
function increment(version, release, prerelease, build) {
    let result;
    switch(release){
        case "premajor":
            result = {
                major: version.major + 1,
                minor: 0,
                patch: 0,
                prerelease: pre(version.prerelease, prerelease),
                build: parseBuild(version.build, build)
            };
            break;
        case "preminor":
            result = {
                major: version.major,
                minor: version.minor + 1,
                patch: 0,
                prerelease: pre(version.prerelease, prerelease),
                build: parseBuild(version.build, build)
            };
            break;
        case "prepatch":
            result = {
                major: version.major,
                minor: version.minor,
                patch: version.patch + 1,
                prerelease: pre(version.prerelease, prerelease),
                build: parseBuild(version.build, build)
            };
            break;
        case "prerelease":
            if (version.prerelease.length === 0) {
                result = {
                    major: version.major,
                    minor: version.minor,
                    patch: version.patch + 1,
                    prerelease: pre(version.prerelease, prerelease),
                    build: parseBuild(version.build, build)
                };
                break;
            } else {
                result = {
                    major: version.major,
                    minor: version.minor,
                    patch: version.patch,
                    prerelease: pre(version.prerelease, prerelease),
                    build: parseBuild(version.build, build)
                };
                break;
            }
        case "major":
            if (version.minor !== 0 || version.patch !== 0 || version.prerelease.length === 0) {
                result = {
                    major: version.major + 1,
                    minor: 0,
                    patch: 0,
                    prerelease: [],
                    build: parseBuild(version.build, build)
                };
                break;
            } else {
                result = {
                    major: version.major,
                    minor: 0,
                    patch: 0,
                    prerelease: [],
                    build: parseBuild(version.build, build)
                };
                break;
            }
        case "minor":
            if (version.patch !== 0 || version.prerelease.length === 0) {
                result = {
                    major: version.major,
                    minor: version.minor + 1,
                    patch: 0,
                    prerelease: [],
                    build: parseBuild(version.build, build)
                };
                break;
            } else {
                result = {
                    major: version.major,
                    minor: version.minor,
                    patch: 0,
                    prerelease: [],
                    build: parseBuild(version.build, build)
                };
                break;
            }
        case "patch":
            if (version.prerelease.length === 0) {
                result = {
                    major: version.major,
                    minor: version.minor,
                    patch: version.patch + 1,
                    prerelease: [],
                    build: parseBuild(version.build, build)
                };
                break;
            } else {
                result = {
                    major: version.major,
                    minor: version.minor,
                    patch: version.patch,
                    prerelease: [],
                    build: parseBuild(version.build, build)
                };
                break;
            }
        case "pre":
            result = {
                major: version.major,
                minor: version.minor,
                patch: version.patch,
                prerelease: pre(version.prerelease, prerelease),
                build: parseBuild(version.build, build)
            };
            break;
        default:
            throw new Error(`invalid increment argument: ${release}`);
    }
    return result;
}
function comparatorMin(semver, operator) {
    if (semver === ANY) {
        return MIN;
    }
    switch(operator){
        case ">":
            return semver.prerelease.length > 0 ? increment(semver, "pre") : increment(semver, "patch");
        case "!=":
        case "!==":
        case "<=":
        case "<":
            return gt(semver, MIN) ? MIN : MAX;
        case ">=":
        case "":
        case "=":
        case "==":
        case "===":
            return semver;
    }
}
function compareBuild(s0, s1) {
    if (s0 === s1) return 0;
    return compareNumber(s0.major, s1.major) || compareNumber(s0.minor, s1.minor) || compareNumber(s0.patch, s1.patch) || checkIdentifier(s0.prerelease, s1.prerelease) || compareIdentifier(s0.prerelease, s1.prerelease) || checkIdentifier(s1.build, s0.build) || compareIdentifier(s0.build, s1.build);
}
function difference(s0, s1) {
    if (eq(s0, s1)) {
        return undefined;
    } else {
        let prefix = "";
        let defaultResult = undefined;
        if (s0 && s1) {
            if (s0.prerelease.length || s1.prerelease.length) {
                prefix = "pre";
                defaultResult = "prerelease";
            }
            for(const key in s0){
                if (key === "major" || key === "minor" || key === "patch") {
                    if (s0[key] !== s1[key]) {
                        return prefix + key;
                    }
                }
            }
        }
        return defaultResult;
    }
}
function testRange(version, range) {
    for (const r of range.ranges){
        if (r.every((c)=>gte(version, c.min) && lte(version, c.max))) {
            return true;
        }
    }
    return false;
}
function outside(version, range, hilo) {
    if (!hilo) {
        return outside(version, range, ">") || outside(version, range, "<");
    }
    const [gtfn, ltefn, ltfn, comp, ecomp] = (()=>{
        switch(hilo){
            case ">":
                return [
                    gt,
                    lte,
                    lt,
                    ">",
                    ">="
                ];
            case "<":
                return [
                    lt,
                    gte,
                    gt,
                    "<",
                    "<="
                ];
        }
    })();
    if (testRange(version, range)) {
        return false;
    }
    for (const comparators of range.ranges){
        let high = undefined;
        let low = undefined;
        for (let comparator of comparators){
            if (comparator.semver === ANY) {
                comparator = ALL;
            }
            high = high || comparator;
            low = low || comparator;
            if (gtfn(comparator.semver, high.semver)) {
                high = comparator;
            } else if (ltfn(comparator.semver, low.semver)) {
                low = comparator;
            }
        }
        if (!high || !low) return true;
        if (high.operator === comp || high.operator === ecomp) {
            return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
            return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
            return false;
        }
    }
    return true;
}
function gtr(version, range) {
    return outside(version, range, ">");
}
function testComparator(version, comparator) {
    return cmp(version, comparator.operator, comparator.semver);
}
function isSemVer(value) {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return false;
    if (typeof value !== "object") return false;
    if (value === INVALID) return true;
    if (value === ANY) return true;
    const { major, minor, patch, build, prerelease } = value;
    const result = typeof major === "number" && isValidNumber(major) && typeof minor === "number" && isValidNumber(minor) && typeof patch === "number" && isValidNumber(patch) && Array.isArray(prerelease) && Array.isArray(build) && prerelease.every((v)=>typeof v === "string" || typeof v === "number") && prerelease.filter((v)=>typeof v === "string").every((v)=>isValidString(v)) && prerelease.filter((v)=>typeof v === "number").every((v)=>isValidNumber(v)) && build.every((v)=>typeof v === "string" && isValidString(v));
    return result;
}
function isSemVerComparator(value) {
    if (value === null || value === undefined) return false;
    if (value === NONE) return true;
    if (value === ALL) return true;
    if (Array.isArray(value)) return false;
    if (typeof value !== "object") return false;
    const { operator, semver, min, max } = value;
    return isValidOperator(operator) && isSemVer(semver) && isSemVer(min) && isSemVer(max);
}
function isSemVerRange(value) {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return false;
    if (typeof value !== "object") return false;
    const { ranges } = value;
    return Array.isArray(ranges), ranges.every((r)=>Array.isArray(r) && r.every((c)=>isSemVerComparator(c)));
}
function ltr(version, range) {
    return outside(version, range, "<");
}
function sort(list) {
    return list.sort((a, b)=>compare(a, b));
}
function maxSatisfying(versions, range) {
    const satisfying = versions.filter((v)=>testRange(v, range));
    const sorted = sort(satisfying);
    return sorted.pop();
}
function minSatisfying(versions, range) {
    const satisfying = versions.filter((v)=>testRange(v, range));
    const sorted = sort(satisfying);
    return sorted.shift();
}
function parse2(version) {
    if (typeof version === "object") {
        if (isSemVer(version)) {
            return version;
        } else {
            throw new TypeError(`not a valid SemVer object`);
        }
    }
    if (typeof version !== "string") {
        throw new TypeError(`version must be a string`);
    }
    if (version.length > 256) {
        throw new TypeError(`version is longer than ${256} characters`);
    }
    version = version.trim();
    const r = re[FULL];
    const m = version.match(r);
    if (!m) {
        throw new TypeError(`Invalid Version: ${version}`);
    }
    const major = parseInt(m[1]);
    const minor = parseInt(m[2]);
    const patch = parseInt(m[3]);
    if (major > Number.MAX_SAFE_INTEGER || major < 0) {
        throw new TypeError("Invalid major version");
    }
    if (minor > Number.MAX_SAFE_INTEGER || minor < 0) {
        throw new TypeError("Invalid minor version");
    }
    if (patch > Number.MAX_SAFE_INTEGER || patch < 0) {
        throw new TypeError("Invalid patch version");
    }
    const numericIdentifier = new RegExp(`^(${src[NUMERICIDENTIFIER]})$`);
    const prerelease = (m[4] ?? "").split(".").filter((id)=>id).map((id)=>{
        const num = parseInt(id);
        if (id.match(numericIdentifier) && isValidNumber(num)) {
            return num;
        } else {
            return id;
        }
    });
    const build = m[5]?.split(".")?.filter((m)=>m) ?? [];
    return {
        major,
        minor,
        patch,
        prerelease,
        build
    };
}
function parseComparator(comparator) {
    const r = re[COMPARATOR];
    const m = comparator.match(r);
    if (!m) {
        return NONE;
    }
    const operator = m[1] ?? "";
    const semver = m[2] ? parse2(m[2]) : ANY;
    const min = comparatorMin(semver, operator);
    const max = comparatorMax(semver, operator);
    return {
        operator,
        semver,
        min,
        max
    };
}
function replaceTildes(comp) {
    return comp.trim().split(/\s+/).map((comp)=>replaceTilde(comp)).join(" ");
}
function replaceTilde(comp) {
    const r = re[TILDE];
    return comp.replace(r, (_, M, m, p, pr)=>{
        let ret;
        if (isX(M)) {
            ret = "";
        } else if (isX(m)) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        } else if (isX(p)) {
            ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
        } else if (pr) {
            ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0";
        } else {
            ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
        }
        return ret;
    });
}
function replaceCarets(comp) {
    return comp.trim().split(/\s+/).map((comp)=>replaceCaret(comp)).join(" ");
}
function replaceCaret(comp) {
    const r = re[CARET];
    return comp.replace(r, (_, M, m, p, pr)=>{
        let ret;
        if (isX(M)) {
            ret = "";
        } else if (isX(m)) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        } else if (isX(p)) {
            if (M === "0") {
                ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
            } else {
                ret = ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0";
            }
        } else if (pr) {
            if (M === "0") {
                if (m === "0") {
                    ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + m + "." + (+p + 1);
                } else {
                    ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0";
                }
            } else {
                ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + (+M + 1) + ".0.0";
            }
        } else {
            if (M === "0") {
                if (m === "0") {
                    ret = ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." + (+p + 1);
                } else {
                    ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
                }
            } else {
                ret = ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0";
            }
        }
        return ret;
    });
}
function replaceXRanges(comp) {
    return comp.split(/\s+/).map((comp)=>replaceXRange(comp)).join(" ");
}
function replaceXRange(comp) {
    comp = comp.trim();
    const r = re[XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, _pr)=>{
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
            gtlt = "";
        }
        if (xM) {
            if (gtlt === ">" || gtlt === "<") {
                ret = "<0.0.0";
            } else {
                ret = "*";
            }
        } else if (gtlt && anyX) {
            if (xm) {
                m = 0;
            }
            p = 0;
            if (gtlt === ">") {
                gtlt = ">=";
                if (xm) {
                    M = +M + 1;
                    m = 0;
                    p = 0;
                } else {
                    m = +m + 1;
                    p = 0;
                }
            } else if (gtlt === "<=") {
                gtlt = "<";
                if (xm) {
                    M = +M + 1;
                } else {
                    m = +m + 1;
                }
            }
            ret = gtlt + M + "." + m + "." + p;
        } else if (xm) {
            ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
        } else if (xp) {
            ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
        }
        return ret;
    });
}
function replaceStars(comp) {
    return comp.trim().replace(re[STAR], "");
}
function hyphenReplace(_$0, from, fM, fm, fp, _fpr, _fb, to, tM, tm, tp, tpr, _tb) {
    if (isX(fM)) {
        from = "";
    } else if (isX(fm)) {
        from = ">=" + fM + ".0.0";
    } else if (isX(fp)) {
        from = ">=" + fM + "." + fm + ".0";
    } else {
        from = ">=" + from;
    }
    if (isX(tM)) {
        to = "";
    } else if (isX(tm)) {
        to = "<" + (+tM + 1) + ".0.0";
    } else if (isX(tp)) {
        to = "<" + tM + "." + (+tm + 1) + ".0";
    } else if (tpr) {
        to = "<=" + tM + "." + tm + "." + tp + "-" + tpr;
    } else {
        to = "<=" + to;
    }
    return (from + " " + to).trim();
}
function isX(id) {
    return !id || id.toLowerCase() === "x" || id === "*";
}
function parseRange(range) {
    range = range.trim().replaceAll(/(?<=<|>|=) /g, "");
    if (range === "") {
        return {
            ranges: [
                [
                    ALL
                ]
            ]
        };
    }
    const ranges = range.trim().split(/\s*\|\|\s*/).map((range)=>{
        const hr = re[HYPHENRANGE];
        range = range.replace(hr, hyphenReplace);
        range = replaceCarets(range);
        range = replaceTildes(range);
        range = replaceXRanges(range);
        range = replaceStars(range);
        if (range === "") {
            return [
                ALL
            ];
        } else {
            return range.split(" ").filter((r)=>r).map((r)=>parseComparator(r));
        }
    });
    return {
        ranges
    };
}
function rangeFormat(range) {
    return range.ranges.map((c)=>c.map((c)=>comparatorFormat(c)).join(" ")).join("||");
}
function rangesSatisfiable(ranges) {
    return ranges.every((r)=>{
        return r.ranges.some((comparators)=>comparatorsSatisfiable(comparators));
    });
}
function comparatorsSatisfiable(comparators) {
    for(let i = 0; i < comparators.length - 1; i++){
        const c0 = comparators[i];
        for (const c1 of comparators.slice(i + 1)){
            if (!comparatorIntersects(c0, c1)) {
                return false;
            }
        }
    }
    return true;
}
function rangeIntersects(r0, r1) {
    return rangesSatisfiable([
        r0,
        r1
    ]) && r0.ranges.some((r00)=>{
        return r1.ranges.some((r11)=>{
            return r00.every((c0)=>{
                return r11.every((c1)=>comparatorIntersects(c0, c1));
            });
        });
    });
}
function rangeMax(range) {
    return sort(range.ranges.map((r)=>sort(r.filter((c)=>testRange(c.max, range)).map((c)=>c.max)).shift())).filter((v)=>v).pop() ?? INVALID;
}
function rangeMin(range) {
    return sort(range.ranges.map((r)=>sort(r.filter((c)=>testRange(c.min, range)).map((c)=>c.min)).pop()).filter((v)=>v)).shift() ?? INVALID;
}
function rcompare(s0, s1) {
    return compare(s1, s0);
}
function rsort(list) {
    return list.sort((a, b)=>compare(b, a));
}
const SEMVER_SPEC_VERSION = "2.0.0";
const mod3 = {
    SEMVER_SPEC_VERSION: SEMVER_SPEC_VERSION,
    cmp,
    eq,
    compare,
    neq,
    gte,
    gt,
    lt,
    lte,
    comparatorFormat,
    format: format2,
    MAX,
    MIN,
    INVALID,
    ANY,
    ALL,
    NONE,
    comparatorIntersects,
    comparatorMax,
    comparatorMin,
    increment,
    compareBuild,
    difference,
    gtr,
    outside,
    testRange,
    testComparator,
    isSemVerComparator,
    isSemVer,
    isSemVerRange,
    ltr,
    maxSatisfying,
    sort,
    minSatisfying,
    parseComparator,
    parse: parse2,
    parseRange,
    rangeFormat,
    rangeIntersects,
    rangeMax,
    rangeMin,
    rcompare,
    rsort
};
const encoder1 = new TextEncoder();
function getTypeName1(value) {
    const type = typeof value;
    if (type !== "object") {
        return type;
    } else if (value === null) {
        return "null";
    } else {
        return value?.constructor?.name ?? "object";
    }
}
function validateBinaryLike1(source) {
    if (typeof source === "string") {
        return encoder1.encode(source);
    } else if (source instanceof Uint8Array) {
        return source;
    } else if (source instanceof ArrayBuffer) {
        return new Uint8Array(source);
    }
    throw new TypeError(`The input must be a Uint8Array, a string, or an ArrayBuffer. Received a value of the type ${getTypeName1(source)}.`);
}
const base64abc1 = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "+",
    "/"
];
function encodeBase641(data) {
    const uint8 = validateBinaryLike1(data);
    let result = "", i;
    const l = uint8.length;
    for(i = 2; i < l; i += 3){
        result += base64abc1[uint8[i - 2] >> 2];
        result += base64abc1[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc1[(uint8[i - 1] & 0x0f) << 2 | uint8[i] >> 6];
        result += base64abc1[uint8[i] & 0x3f];
    }
    if (i === l + 1) {
        result += base64abc1[uint8[i - 2] >> 2];
        result += base64abc1[(uint8[i - 2] & 0x03) << 4];
        result += "==";
    }
    if (i === l) {
        result += base64abc1[uint8[i - 2] >> 2];
        result += base64abc1[(uint8[i - 2] & 0x03) << 4 | uint8[i - 1] >> 4];
        result += base64abc1[(uint8[i - 1] & 0x0f) << 2];
        result += "=";
    }
    return result;
}
function decodeBase641(b64) {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for(let i = 0; i < size; i++){
        bytes[i] = binString.charCodeAt(i);
    }
    return bytes;
}
function addPaddingToBase64url(base64url) {
    if (base64url.length % 4 === 2) return base64url + "==";
    if (base64url.length % 4 === 3) return base64url + "=";
    if (base64url.length % 4 === 1) {
        throw new TypeError("Illegal base64url string!");
    }
    return base64url;
}
function convertBase64urlToBase64(b64url) {
    if (!/^[-_A-Z0-9]*?={0,2}$/i.test(b64url)) {
        throw new TypeError("Failed to decode base64url: invalid character");
    }
    return addPaddingToBase64url(b64url).replace(/\-/g, "+").replace(/_/g, "/");
}
function convertBase64ToBase64url(b64) {
    return b64.endsWith("=") ? b64.endsWith("==") ? b64.replace(/\+/g, "-").replace(/\//g, "_").slice(0, -2) : b64.replace(/\+/g, "-").replace(/\//g, "_").slice(0, -1) : b64.replace(/\+/g, "-").replace(/\//g, "_");
}
const encode1 = encodeBase64Url;
const decode1 = decodeBase64Url;
function encodeBase64Url(data) {
    return convertBase64ToBase64url(encodeBase641(data));
}
function decodeBase64Url(b64url) {
    return decodeBase641(convertBase64urlToBase64(b64url));
}
const mod4 = {
    encode: encode1,
    decode: decode1,
    encodeBase64Url: encodeBase64Url,
    decodeBase64Url: decodeBase64Url
};
const encoder2 = new TextEncoder();
const decoder = new TextDecoder();
function isArray(input) {
    return Array.isArray(input);
}
function isDefined(input) {
    return input !== undefined;
}
function isNotNull(input) {
    return input !== null;
}
function isNotNumber(input) {
    return typeof input !== "number";
}
function isNotString(input) {
    return typeof input !== "string";
}
function isNull(input) {
    return input === null;
}
function isNumber(input) {
    return typeof input === "number";
}
function isNotTrue(input) {
    return input !== true;
}
function isObject(input) {
    return input !== null && typeof input === "object" && Array.isArray(input) === false;
}
function isString(input) {
    return typeof input === "string";
}
function isUndefined(input) {
    return input === undefined;
}
function isHashedKeyAlgorithm(algorithm) {
    return isString(algorithm.hash?.name);
}
function isEcKeyAlgorithm(algorithm) {
    return isString(algorithm.namedCurve);
}
function verify(alg, key) {
    if (alg === "none") {
        if (isNotNull(key)) {
            throw new Error(`The alg '${alg}' does not allow a key.`);
        } else return true;
    } else {
        if (!key) throw new Error(`The alg '${alg}' demands a key.`);
        const keyAlgorithm = key.algorithm;
        const algAlgorithm = getAlgorithm(alg);
        if (keyAlgorithm.name === algAlgorithm.name) {
            if (isHashedKeyAlgorithm(keyAlgorithm)) {
                return keyAlgorithm.hash.name === algAlgorithm.hash.name;
            } else if (isEcKeyAlgorithm(keyAlgorithm)) {
                return keyAlgorithm.namedCurve === algAlgorithm.namedCurve;
            }
        }
        return false;
    }
}
function getAlgorithm(alg) {
    switch(alg){
        case "HS256":
            return {
                hash: {
                    name: "SHA-256"
                },
                name: "HMAC"
            };
        case "HS384":
            return {
                hash: {
                    name: "SHA-384"
                },
                name: "HMAC"
            };
        case "HS512":
            return {
                hash: {
                    name: "SHA-512"
                },
                name: "HMAC"
            };
        case "PS256":
            return {
                hash: {
                    name: "SHA-256"
                },
                name: "RSA-PSS",
                saltLength: 256 >> 3
            };
        case "PS384":
            return {
                hash: {
                    name: "SHA-384"
                },
                name: "RSA-PSS",
                saltLength: 384 >> 3
            };
        case "PS512":
            return {
                hash: {
                    name: "SHA-512"
                },
                name: "RSA-PSS",
                saltLength: 512 >> 3
            };
        case "RS256":
            return {
                hash: {
                    name: "SHA-256"
                },
                name: "RSASSA-PKCS1-v1_5"
            };
        case "RS384":
            return {
                hash: {
                    name: "SHA-384"
                },
                name: "RSASSA-PKCS1-v1_5"
            };
        case "RS512":
            return {
                hash: {
                    name: "SHA-512"
                },
                name: "RSASSA-PKCS1-v1_5"
            };
        case "ES256":
            return {
                hash: {
                    name: "SHA-256"
                },
                name: "ECDSA",
                namedCurve: "P-256"
            };
        case "ES384":
            return {
                hash: {
                    name: "SHA-384"
                },
                name: "ECDSA",
                namedCurve: "P-384"
            };
        default:
            throw new Error(`The jwt's alg '${alg}' is not supported.`);
    }
}
async function verify1(signature, key, alg, signingInput) {
    return isNull(key) ? signature.length === 0 : await crypto.subtle.verify(getAlgorithm(alg), key, signature, encoder2.encode(signingInput));
}
function isExpired(exp, leeway) {
    return exp + leeway < Date.now() / 1000;
}
function isTooEarly(nbf, leeway) {
    return nbf - leeway > Date.now() / 1000;
}
function is3Tuple(arr) {
    return arr.length === 3;
}
function hasInvalidTimingClaims(...claimValues) {
    return claimValues.some((claimValue)=>isDefined(claimValue) && isNotNumber(claimValue));
}
function validateTimingClaims(payload, { expLeeway = 1, nbfLeeway = 1, ignoreExp, ignoreNbf } = {}) {
    if (hasInvalidTimingClaims(payload.exp, payload.nbf)) {
        throw new Error(`The jwt has an invalid 'exp' or 'nbf' claim.`);
    }
    if (isNumber(payload.exp) && isNotTrue(ignoreExp) && isExpired(payload.exp, expLeeway)) {
        throw RangeError("The jwt is expired.");
    }
    if (isNumber(payload.nbf) && isNotTrue(ignoreNbf) && isTooEarly(payload.nbf, nbfLeeway)) {
        throw RangeError("The jwt is used too early.");
    }
}
function hasValidAudClaim(claimValue) {
    if (isUndefined(claimValue) || isString(claimValue)) return true;
    else return isArray(claimValue) && claimValue.every(isString);
}
function validateAudClaim(aud, audience) {
    if (hasValidAudClaim(aud)) {
        if (isUndefined(aud)) {
            throw new Error("The jwt has no 'aud' claim.");
        }
        const audArray = isString(aud) ? [
            aud
        ] : aud;
        const audienceArrayOrRegex = isString(audience) ? [
            audience
        ] : audience;
        if (!audArray.some((audString)=>isArray(audienceArrayOrRegex) ? audienceArrayOrRegex.includes(audString) : audienceArrayOrRegex.test(audString))) {
            throw new Error("The identification with the value in the 'aud' claim has failed.");
        }
    } else {
        throw new Error(`The jwt has an invalid 'aud' claim.`);
    }
}
function decode2(jwt) {
    try {
        const arr = jwt.split(".").map(mod4.decode).map((uint8Array, index)=>index === 0 || index === 1 ? JSON.parse(decoder.decode(uint8Array)) : uint8Array);
        if (is3Tuple(arr)) return arr;
        else throw new Error();
    } catch  {
        throw Error("The serialization of the jwt is invalid.");
    }
}
function validate([header, payload, signature], options) {
    if (isNotString(header?.alg)) {
        throw new Error(`The jwt's 'alg' header parameter value must be a string.`);
    }
    if (isObject(payload)) {
        validateTimingClaims(payload, options);
        if (isDefined(options?.audience)) {
            validateAudClaim(payload.aud, options.audience);
        }
        return {
            header,
            payload,
            signature
        };
    } else {
        throw new Error(`The jwt claims set is not a JSON object.`);
    }
}
async function verify2(jwt, key, options) {
    const { header, payload, signature } = validate(decode2(jwt), options);
    if (verify(header.alg, key)) {
        if (!await verify1(signature, key, header.alg, jwt.slice(0, jwt.lastIndexOf(".")))) {
            throw new Error("The jwt's signature does not match the verification signature.");
        }
        if (!(options?.predicates || []).every((predicate)=>predicate(payload))) {
            throw new Error("The payload does not satisfy all passed predicates.");
        }
        return payload;
    } else {
        throw new Error(`The jwt's alg '${header.alg}' does not match the key's algorithm.`);
    }
}
function isUndefined1(input) {
    return input === undefined;
}
function isString1(input) {
    return typeof input === "string";
}
function isObject1(input) {
    return input !== null && typeof input === "object" && Array.isArray(input) === false;
}
function isUrl(input) {
    return input instanceof URL;
}
function isCryptoKey(input) {
    return input instanceof CryptoKey;
}
function getAlgorithm1(alg) {
    switch(alg){
        case "HS256":
            return {
                hash: {
                    name: "SHA-256"
                },
                name: "HMAC"
            };
        case "HS384":
            return {
                hash: {
                    name: "SHA-384"
                },
                name: "HMAC"
            };
        case "HS512":
            return {
                hash: {
                    name: "SHA-512"
                },
                name: "HMAC"
            };
        case "RS256":
            return {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 4096,
                publicExponent: new Uint8Array([
                    1,
                    0,
                    1
                ]),
                hash: "SHA-256"
            };
        case "RS384":
            return {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 4096,
                publicExponent: new Uint8Array([
                    1,
                    0,
                    1
                ]),
                hash: "SHA-384"
            };
        case "RS512":
            return {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 4096,
                publicExponent: new Uint8Array([
                    1,
                    0,
                    1
                ]),
                hash: "SHA-512"
            };
        default:
            throw new Error(`The jwt's alg '${alg}' is not supported.`);
    }
}
async function importRsaKeyFromPem(pem, alg, kind) {
    const kindInUpperCase = kind.toUpperCase();
    const pemHeader = `-----BEGIN ${kindInUpperCase} KEY-----`;
    const pemFooter = `-----END ${kindInUpperCase} KEY-----`;
    const regex = new RegExp(`^${pemHeader}.+${pemFooter}$`, "s");
    if (!regex.test(pem)) {
        throw new Error("The pem starts or ends incorrectly.");
    }
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    const pemBuffer = mod2.decode(pemContents).buffer;
    const format = kind === "private" ? "pkcs8" : "spki";
    return await window.crypto.subtle.importKey(format, pemBuffer, getAlgorithm1(alg), true, kind === "private" ? [
        "sign"
    ] : [
        "verify"
    ]);
}
async function fetchRsaCryptoKey(keyUrl, algorithm) {
    const response = await fetch(keyUrl);
    if (response.ok) {
        const pem = await response.text();
        return await importRsaKeyFromPem(pem, algorithm, "public");
    } else {
        throw new Error(`Received status code ${response.status} (${response.statusText}) instead of 200-299 range`);
    }
}
new TextEncoder();
new TextDecoder();
JSON.parse(Deno.env.get("IS_PRODUCTION") ?? "false");
const defaultKeySemver = "v0.0.0";
function isUpdateInput(input) {
    try {
        return isObject1(input) && isString1(input.algorithm) && (isString1(input.url) || isUrl(input.url)) && (isUndefined1(input.keySemVer) || !!mod3.parse(input.keySemVer));
    } catch  {
        return false;
    }
}
function getJwtFromBearer(headers) {
    const authHeader = headers.get("Authorization");
    if (authHeader === null) {
        throw new Error("No 'Authorization' header.");
    } else if (!authHeader.startsWith("Bearer ") || authHeader.length <= 7) {
        throw new Error("Invalid 'Authorization' header.");
    } else {
        return authHeader.slice(7);
    }
}
function verifyJwt(input) {
    const cryptoKeyPromiseOrNull = isUpdateInput(input) ? fetchRsaCryptoKey(input.url, input.algorithm) : null;
    return async (jwt, options)=>{
        const cryptoKeyOrNull = await cryptoKeyPromiseOrNull;
        if (isUpdateInput(input) && isCryptoKey(cryptoKeyOrNull)) {
            let cryptoKey = cryptoKeyOrNull;
            input.keySemVer ??= defaultKeySemver;
            const [header] = decode2(jwt);
            if (isOutdated(input, header)) {
                cryptoKey = await fetchRsaCryptoKey(input.url, input.algorithm);
                const payload = await verify2(jwt, cryptoKey, options);
                input.keySemVer = header.ver;
                return payload;
            } else {
                return await verify2(jwt, cryptoKey, options);
            }
        } else if (isCryptoKey(input)) {
            return await verify2(jwt, input, options);
        } else {
            throw new Error("Invalid input.");
        }
    };
}
function isOutdated(input, header) {
    if (isObject1(header)) {
        const { ver, alg } = header;
        const verSemver = mod3.parse(ver);
        if (mod3.parse(verSemver)) {
            if (alg === input.algorithm) {
                const keySemVer = mod3.parse(input.keySemVer);
                if (mod3.eq(verSemver, keySemVer)) {
                    return false;
                } else if (mod3.gt(verSemver, keySemVer)) {
                    return true;
                } else {
                    throw new Error("The jwt's version is outdated.");
                }
            } else {
                throw new Error("The jwt's 'alg' claim doesn't match the predefined algorithm.");
            }
        } else {
            throw new Error("The jwt has no or an invalid 'ver' header.");
        }
    } else {
        throw new Error("The jwt has an invalid 'Header'.");
    }
}
async function verifyJwtForSelectedMethods({ validationObject, methods, options, authData }) {
    if (validationObject.isError) return {
        validationObject,
        methods,
        options
    };
    if (authData) {
        const authMethods = authData.methods;
        if (Array.isArray(authMethods) ? authMethods.includes(validationObject.method) : authMethods?.test(validationObject.method)) {
            try {
                const jwt = getJwtFromBearer(authData.headers);
                const payload = await authData.verify(jwt, authData.options);
                return {
                    validationObject,
                    methods,
                    options,
                    payload
                };
            } catch (err) {
                return {
                    validationObject: {
                        id: validationObject.id,
                        data: options.publicErrorStack ? err.stack : undefined,
                        isError: true,
                        ...authErrorData
                    },
                    methods,
                    options
                };
            }
        }
    }
    return {
        validationObject,
        methods,
        options
    };
}
async function executeMethods({ validationObject, methods, options, payload }) {
    if (validationObject.isError) return validationObject;
    try {
        const additionalArgument = {
            ...options.args,
            payload
        };
        const method = methods[validationObject.method];
        return {
            ...validationObject,
            result: Object.keys(additionalArgument).length === 0 ? await method(validationObject.params) : await method(validationObject.params, additionalArgument)
        };
    } catch (error) {
        if (error instanceof CustomError) {
            return {
                code: error.code,
                message: error.message,
                id: validationObject.id,
                data: error.data,
                isError: true
            };
        }
        return {
            id: validationObject.id,
            data: options.publicErrorStack ? error.stack : undefined,
            isError: true,
            ...internalErrorData
        };
    }
}
async function createRpcResponse({ validationObject, methods, options, payload }) {
    const obj = await executeMethods({
        validationObject,
        payload,
        methods,
        options
    });
    if ("result" in obj && obj.id !== undefined) {
        return {
            jsonrpc: "2.0",
            result: obj.result === undefined ? null : obj.result,
            id: obj.id
        };
    } else if (obj.isError && obj.id !== undefined) {
        return {
            jsonrpc: "2.0",
            error: {
                code: obj.code,
                message: obj.message,
                data: obj.data
            },
            id: obj.id
        };
    } else {
        return null;
    }
}
async function createRpcResponseOrBatch(validationObjectOrBatch, methods, options, authData) {
    return Array.isArray(validationObjectOrBatch) ? await cleanBatch(validationObjectOrBatch.map(async (validationObject)=>createRpcResponse(await verifyJwtForSelectedMethods({
            validationObject,
            methods,
            options,
            authData
        })))) : await createRpcResponse(await verifyJwtForSelectedMethods({
        validationObject: validationObjectOrBatch,
        methods,
        options,
        authData
    }));
}
async function cleanBatch(batch) {
    const batchResponse = (await Promise.all(batch)).filter((obj)=>obj !== null);
    return batchResponse.length > 0 ? batchResponse : null;
}
function isRpcVersion(input) {
    return input === "2.0";
}
function isRpcMethod(input) {
    return typeof input === "string" && !input.startsWith("rpc.");
}
function isRpcParams(input) {
    return typeof input === "object" && input !== null;
}
function isRpcId(input) {
    switch(typeof input){
        case "string":
            return true;
        case "number":
            return input % 1 === 0;
        case "object":
            return input === null;
        default:
            return false;
    }
}
function isObject2(obj) {
    return obj !== null && typeof obj === "object" && Array.isArray(obj) === false;
}
function tryToParse(json) {
    try {
        return [
            JSON.parse(json),
            null
        ];
    } catch  {
        return [
            null,
            {
                id: null,
                isError: true,
                ...parseErrorData
            }
        ];
    }
}
function validateRequest(body, methods) {
    const [decodedBody, parsingError] = tryToParse(body);
    if (parsingError) return parsingError;
    if (Array.isArray(decodedBody) && decodedBody.length > 0) {
        return decodedBody.map((rpc)=>validateRpcRequestObject(rpc, methods));
    } else {
        return validateRpcRequestObject(decodedBody, methods);
    }
}
function validateRpcRequestObject(decodedBody, methods) {
    if (isObject2(decodedBody)) {
        if (!isRpcVersion(decodedBody.jsonrpc) || !isRpcMethod(decodedBody.method) || "id" in decodedBody && !isRpcId(decodedBody.id)) {
            return {
                code: -32600,
                message: "Invalid Request",
                id: isRpcId(decodedBody.id) ? decodedBody.id : null,
                isError: true
            };
        } else if (typeof methods[decodedBody.method] !== "function") {
            return {
                id: decodedBody.id,
                isError: true,
                ...methodNotFoundErrorData
            };
        } else if ("params" in decodedBody && !isRpcParams(decodedBody.params)) {
            return {
                id: decodedBody.id,
                isError: true,
                ...invalidParamsErrorData
            };
        } else {
            return {
                id: decodedBody.id,
                method: decodedBody.method,
                params: decodedBody.params,
                isError: false
            };
        }
    } else {
        return {
            id: null,
            isError: true,
            ...invalidRequestErrorData
        };
    }
}
function respond(methods, options = {}, authInput) {
    return async (request)=>{
        const authData = authInput ? {
            ...authInput,
            headers: request.headers
        } : undefined;
        const validationObjectOrBatch = validateRequest(await request.text(), methods);
        const headers = options.headers ?? new Headers();
        const rpcResponseOrBatchOrNull = await createRpcResponseOrBatch(validationObjectOrBatch, methods, options, authData);
        if (rpcResponseOrBatchOrNull === null) {
            return new Response(null, {
                status: 204,
                headers
            });
        } else {
            headers.append("content-type", "application/json");
            return new Response(JSON.stringify(rpcResponseOrBatchOrNull), {
                status: 200,
                headers
            });
        }
    };
}
function respondWithAuth(cryptoKeyOrUpdateInput) {
    const verify = verifyJwt(cryptoKeyOrUpdateInput);
    return (methods, authMethodsAndOptions, options = {})=>respond(methods, options, {
            verify,
            ...authMethodsAndOptions
        });
}
export { respond as respond };
export { respondWithAuth as respondWithAuth };

