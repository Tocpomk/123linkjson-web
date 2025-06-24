/**
 * 123云盘秒链解析器模块
 * 负责解析和生成123FSLink和123FLCPV2格式的链接
 */

class LinkParser {
    /**
     * 解析123云盘秒链
     * @param {string} link - 要解析的链接
     * @returns {Object} {files: Array, error: string}
     */
    static parseLink(link) {
        if (!link || !link.trim()) {
            return { files: [], error: "链接不能为空" };
        }

        try {
            if (link.startsWith("123FSLink")) {
                return this.parseFSLink(link);
            } else if (link.startsWith("123FLCPV2")) {
                return this.parseFLCPLink(link);
            } else {
                return { files: [], error: "无效链接格式: 必须以123FSLink或123FLCPV2开头" };
            }
        } catch (error) {
            return { files: [], error: `解析链接出错: ${error.message}` };
        }
    }

    /**
     * 解析123FSLink格式
     */
    static parseFSLink(link) {
        const files = [];
        const parts = link.split('$');

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;

            try {
                const [etag, size, path] = part.split('#', 3);
                files.push({
                    path: path.replace(/\\/g, '/').trim(),
                    size: parseInt(size.trim()) || 0,
                    etag: etag.trim()
                });
            } catch (error) {
                console.warn(`跳过无效的文件部分: ${part}`);
            }
        }

        return { files, error: files.length === 0 ? "未解析到有效文件信息" : "" };
    }

    /**
     * 解析123FLCPV2格式
     */
    static parseFLCPLink(link) {
        const files = [];
        const parts = link.split('$');

        if (parts.length < 3) {
            return { files: [], error: "无效FLCPV2格式: 缺少必要部分" };
        }

        const basePath = parts[1].replace(/\\/g, '/').replace(/\/$/, '');

        for (let i = 2; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;

            try {
                const [etag, size, fullPathPart] = part.split('#', 3);
                const name = fullPathPart.split('#').pop().trim();
                const decodedName = decodeURIComponent(name);
                
                files.push({
                    path: decodedName.replace(/\\/g, '/'),
                    size: parseInt(size.trim()) || 0,
                    etag: etag.trim()
                });
            } catch (error) {
                console.warn(`跳过无效的文件部分: ${part}`);
            }
        }

        return { files, error: files.length === 0 ? "未解析到有效文件信息" : "" };
    }

    /**
     * 生成123云盘秒链
     * @param {Array} files - 文件信息数组
     * @returns {string} 生成的链接
     */
    static generateLink(files) {
        if (!files || files.length === 0) {
            return "123FSLinkV2";
        }

        const commonPath = this.findCommonPath(files.map(f => f.path));
        
        if (commonPath) {
            return this.generateFLCPLink(files, commonPath);
        } else {
            return this.generateFSLink(files);
        }
    }

    /**
     * 生成123FSLink格式
     */
    static generateFSLink(files) {
        let link = "123FSLinkV2";
        for (const file of files) {
            const path = file.path.replace(/\\/g, '/').trim();
            link += `$${file.etag}#${file.size}#${path}`;
        }
        return link;
    }

    /**
     * 生成123FLCPV2格式
     */
    static generateFLCPLink(files, basePath) {
        const cleanBase = basePath.replace(/\\/g, '/').replace(/\/$/, '');
        let link = `123FLCPV2$${cleanBase}`;

        for (const file of files) {
            const path = file.path.replace(/\\/g, '/').replace(/\/$/, '');
            let name = path;
            
            if (path.startsWith(cleanBase)) {
                name = path.substring(cleanBase.length).replace(/^\//, '');
            }
            
            link += `$${file.etag}#${file.size}#${name}`;
        }
        return link;
    }

    /**
     * 查找公共路径前缀
     */
    static findCommonPath(paths) {
        if (!paths || paths.length === 0) return "";

        const normalized = paths.map(p => p.replace(/\\/g, '/').replace(/\/$/, ''));
        let common = normalized[0];

        for (let i = 1; i < normalized.length; i++) {
            const path = normalized[i];
            let j = 0;
            while (j < common.length && j < path.length && common[j] === path[j]) {
                j++;
            }
            common = common.substring(0, j);
        }

        const lastSlash = common.lastIndexOf('/');
        return lastSlash > 0 ? common.substring(0, lastSlash) : "";
    }

    /**
     * 验证链接格式
     */
    static validateLink(link) {
        if (!link || !link.trim()) {
            return { valid: false, error: "链接不能为空" };
        }

        if (!(link.startsWith("123FSLink") || link.startsWith("123FLCPV2"))) {
            return { valid: false, error: "必须以123FSLink或123FLCPV2开头" };
        }

        const parts = link.split('$');
        if (parts.length < 2) {
            return { valid: false, error: "缺少文件信息部分" };
        }

        for (const part of parts.slice(1)) {
            if (!part) continue;
            
            try {
                const [etag, size] = part.split('#', 2);
                if (!size || isNaN(parseInt(size))) {
                    return { valid: false, error: "文件大小必须为数字" };
                }
            } catch (error) {
                return { valid: false, error: "文件信息格式错误" };
            }
        }

        return { valid: true, error: "" };
    }
}

// 导出到全局作用域
window.LinkParser = LinkParser; 