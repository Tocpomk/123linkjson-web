/**
 * JSON数据管理模块
 * 负责处理JSON文件的加载、保存、文件操作等
 */

class JsonData {
    constructor() {
        this.data = null;
        this.files = [];
    }

    /**
     * 创建新的JSON数据
     */
    createNew() {
        this.data = {
            files: [],
            totalFilesCount: 0,
            totalSize: 0
        };
        this.files = this.data.files;
        return this.generateFileName();
    }

    /**
     * 加载JSON数据
     */
    load(jsonData) {
        try {
            // 验证数据格式
            if (!jsonData || typeof jsonData !== 'object') {
                return { success: false, error: "无效的JSON数据" };
            }

            // 处理123FastLink格式
            if (jsonData.files && Array.isArray(jsonData.files)) {
                this.data = jsonData;
                this.files = jsonData.files;
                
                // 确保必要字段存在
                this.data.totalFilesCount = this.data.totalFilesCount || this.files.length;
                this.data.totalSize = this.data.totalSize || this.files.reduce((sum, f) => sum + (parseInt(f.size) || 0), 0);
                
                return { success: true, error: "" };
            }

            // 处理旧格式
            if (jsonData.list && Array.isArray(jsonData.list)) {
                this.data = {
                    files: [],
                    totalFilesCount: 0,
                    totalSize: 0
                };

                for (const item of jsonData.list) {
                    if (typeof item === 'object') {
                        const file = {
                            path: item.name || item.path || "未命名文件",
                            size: parseInt(item.size) || 0,
                            etag: item.hash || item.sha1 || ""
                        };
                        this.data.files.push(file);
                        this.data.totalSize += file.size;
                    }
                }

                this.data.totalFilesCount = this.data.files.length;
                this.files = this.data.files;
                
                return { success: true, error: "" };
            }

            return { success: false, error: "不支持的JSON格式" };
        } catch (error) {
            return { success: false, error: `加载数据失败: ${error.message}` };
        }
    }

    /**
     * 添加文件
     */
    addFiles(newFiles) {
        if (!this.data) {
            this.createNew();
        }

        let addedCount = 0;
        const existingPaths = new Set(this.files.map(f => f.path));

        for (const file of newFiles) {
            if (!existingPaths.has(file.path)) {
                this.files.push({
                    path: file.path,
                    size: parseInt(file.size) || 0,
                    etag: file.etag || ""
                });
                existingPaths.add(file.path);
                addedCount++;
            }
        }

        this.updateTotals();
        return addedCount;
    }

    /**
     * 删除文件
     */
    removeFiles(paths) {
        if (!this.data || !paths || paths.length === 0) {
            return 0;
        }

        const pathsSet = new Set(paths);
        const originalLength = this.files.length;
        
        this.files = this.files.filter(file => !pathsSet.has(file.path));
        this.data.files = this.files;
        
        this.updateTotals();
        return originalLength - this.files.length;
    }

    /**
     * 更新总计
     */
    updateTotals() {
        if (!this.data) return;

        this.data.totalFilesCount = this.files.length;
        this.data.totalSize = this.files.reduce((sum, file) => sum + (parseInt(file.size) || 0), 0);
    }

    /**
     * 排序文件
     */
    sortFiles() {
        if (!this.files) return;

        this.files.sort((a, b) => {
            // 首先按路径排序
            const pathA = a.path.toLowerCase();
            const pathB = b.path.toLowerCase();
            
            if (pathA !== pathB) {
                return pathA.localeCompare(pathB);
            }
            
            // 路径相同时按大小排序
            return (parseInt(a.size) || 0) - (parseInt(b.size) || 0);
        });

        this.data.files = this.files;
    }

    /**
     * 生成文件名
     */
    generateFileName() {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        return `123FastLink_${timestamp}.json`;
    }

    /**
     * 导出JSON
     */
    export() {
        if (!this.data) return null;
        
        this.updateTotals();
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * 获取文件统计信息
     */
    getStats() {
        if (!this.data) {
            return { fileCount: 0, totalSize: 0 };
        }
        
        return {
            fileCount: this.files.length,
            totalSize: this.data.totalSize || 0
        };
    }

    /**
     * 根据路径获取文件
     */
    getFileByPath(path) {
        if (!this.files) return null;
        return this.files.find(file => file.path === path);
    }

    /**
     * 检查文件是否存在
     */
    hasFile(path) {
        return this.files.some(file => file.path === path);
    }

    /**
     * 清空所有数据
     */
    clear() {
        this.data = null;
        this.files = [];
    }

    /**
     * 合并多个JSON数据
     */
    merge(otherJsonData) {
        if (!otherJsonData || !otherJsonData.files) {
            return 0;
        }

        return this.addFiles(otherJsonData.files);
    }

    /**
     * 过滤文件
     */
    filterFiles(predicate) {
        if (!this.files) return [];
        return this.files.filter(predicate);
    }

    /**
     * 搜索文件
     */
    searchFiles(searchTerm) {
        if (!searchTerm || !this.files) return this.files;
        
        const term = searchTerm.toLowerCase();
        return this.files.filter(file => 
            file.path.toLowerCase().includes(term) ||
            this.getFileName(file.path).toLowerCase().includes(term)
        );
    }

    /**
     * 获取文件名
     */
    getFileName(path) {
        return path.split('/').pop() || path;
    }
}

// 导出到全局作用域
window.JsonData = JsonData; 