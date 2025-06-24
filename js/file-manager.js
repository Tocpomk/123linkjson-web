// 文件管理模块
import UIManager from './ui-manager.js';
import LinkManager from './link-manager.js';

// 引入JsonData类
const JsonData = window.JsonData;

const FileManager = {
    files: [], // { name, jsonData, lastModified }
    currentFile: null,
    currentPage: 1,
    pageSize: 20,
    filteredFiles: [],
    searchTerm: '',
    
    init() {
        this.loadFiles();
        this.bindDragAndDrop();
        this.updateFileListUI();
    },
    loadFiles() {
        const savedFiles = localStorage.getItem('123linkjson_files');
        if (savedFiles) {
            const parsed = JSON.parse(savedFiles);
            this.files = parsed.map(f => {
                const jd = new JsonData();
                jd.load(f.data); // f.data为jsonData.data
                return {
                    name: f.name,
                    jsonData: jd,
                    lastModified: f.lastModified || Date.now()
                };
            });
            if (this.files.length > 0) {
                this.currentFile = this.files[0];
            }
        }
    },
    saveFiles() {
        // 只保存{name, data, lastModified}，data为jsonData.data
        const toSave = this.files.map(f => ({
            name: f.name,
            data: f.jsonData.data,
            lastModified: f.lastModified
        }));
        localStorage.setItem('123linkjson_files', JSON.stringify(toSave));
    },
    addFile(fileObj) {
        // fileObj: {name, data, lastModified}
        const jd = new JsonData();
        jd.load(fileObj.data || {});
        const file = {
            name: fileObj.name,
            jsonData: jd,
            lastModified: fileObj.lastModified || Date.now()
        };
        this.files.push(file);
        this.currentFile = file;
        this.saveFiles();
        this.updateFileListUI();
    },
    deleteFile(indexOrName) {
        try {
            let index = -1;
            let file = null;
            if (typeof indexOrName === 'number') {
                index = indexOrName;
                file = this.files[index];
            } else if (typeof indexOrName === 'string') {
                index = this.files.findIndex(f => f.name === indexOrName);
                file = this.files[index];
            }
            if (index === -1 || !file) {
                UIManager.showNotification('未找到要删除的文件', 'error');
                return;
            }
            this.files.splice(index, 1);
            if (this.currentFile === file) {
                this.currentFile = this.files.length > 0 ? this.files[0] : null;
                this.currentPage = 1;
            }
            this.saveFiles();
            this.updateFileListUI();
            UIManager.showNotification('文件已删除', 'success');
        } catch (e) {
            console.error('[FileManager] 删除文件时发生错误:', e);
            UIManager.showNotification('删除文件时发生错误: ' + e.message, 'error');
        }
    },
    renameFile(index, newName) {
        this.files[index].name = newName;
        this.saveFiles();
        this.updateFileListUI();
    },
    selectFile(index) {
        this.currentFile = this.files[index];
        this.updateFileListUI();
    },
    mergeFiles(filesArr) {
        // filesArr: [{name, jsonData, ...}]
        let mergedFiles = [];
        filesArr.forEach(f => {
            mergedFiles = mergedFiles.concat(f.jsonData.files || []);
        });
        const jd = new JsonData();
        jd.createNew();
        const addedCount = jd.addFiles(mergedFiles);
        const mergedFile = {
            name: `合并文件_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
            jsonData: jd,
            lastModified: Date.now()
        };
        this.files.push(mergedFile);
        this.currentFile = mergedFile;
        this.saveFiles();
        this.updateFileListUI();
        UIManager.showNotification(`合并完成，合并入 ${addedCount} 个文件`, 'success');
    },
    bindDragAndDrop() {
        const leftPanel = document.querySelector('.left-panel');
        const dragHint = document.querySelector('.drag-hint');
        if (!leftPanel || !dragHint) return;
        leftPanel.addEventListener('dragover', (e) => {
            e.preventDefault();
            leftPanel.style.borderColor = '#667eea';
            dragHint.style.borderColor = '#667eea';
            dragHint.style.color = '#667eea';
        });
        leftPanel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            leftPanel.style.borderColor = '';
            dragHint.style.borderColor = '#e2e8f0';
            dragHint.style.color = '#718096';
        });
        leftPanel.addEventListener('drop', (e) => {
            e.preventDefault();
            leftPanel.style.borderColor = '';
            dragHint.style.borderColor = '#e2e8f0';
            dragHint.style.color = '#718096';
            const files = Array.from(e.dataTransfer.files);
            const jsonFiles = files.filter(file => file.name.endsWith('.json'));
            if (jsonFiles.length > 0) {
                this.handleDroppedFiles(jsonFiles);
            } else {
                UIManager.showNotification('请拖拽JSON文件', 'warning');
            }
        });
    },
    handleDroppedFiles(files) {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const fileName = file.name.replace('.json', '');
                    const existingIndex = this.files.findIndex(f => f.name === fileName);
                    const jd = new JsonData();
                    jd.load(data);
                    if (existingIndex !== -1) {
                        this.files[existingIndex].jsonData.addFiles(jd.files);
                        UIManager.showNotification(`文件 ${fileName} 已合并`, 'success');
                    } else {
                        this.files.push({
                            name: fileName,
                            jsonData: jd,
                            lastModified: file.lastModified
                        });
                        UIManager.showNotification(`文件 ${fileName} 已添加`, 'success');
                    }
                    this.saveFiles();
                    this.updateFileListUI();
                } catch (error) {
                    UIManager.showNotification(`文件 ${file.name} 格式错误`, 'error');
                }
            };
            reader.readAsText(file);
        });
    },
    getTotalPages() {
        if (!this.currentFile) return 1;
        return Math.ceil((this.currentFile.jsonData.files.length) / this.pageSize) || 1;
    },
    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateFileTableUI();
        }
    },
    changePageSize(size) {
        this.pageSize = size;
        this.currentPage = 1;
        this.updateFileTableUI();
    },
    setSearchTerm(term) {
        this.searchTerm = term.toLowerCase();
        this.currentPage = 1;
        this.updateFileTableUI();
    },
    updateFileListUI() {
        UIManager.renderFileList(this.files, this.currentFile);
        this.updateFileTableUI();
    },
    updateFileTableUI() {
        if (!this.currentFile) {
            UIManager.renderFileTable([]);
            UIManager.updatePagination(0, 0, 0, 1, 1);
            UIManager.updateStats(0, 0);
            return;
        }
        const filesArr = this.currentFile.jsonData.files;
        this.filteredFiles = filesArr.filter(file =>
            (file.path && file.path.toLowerCase().includes(this.searchTerm)) ||
            (this.currentFile.jsonData.getFileName(file.path).toLowerCase().includes(this.searchTerm))
        );
        const totalPages = this.getTotalPages();
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredFiles.slice(startIndex, endIndex);
        UIManager.renderFileTable(pageData, startIndex);
        UIManager.updatePagination(
            startIndex + 1,
            Math.min(endIndex, this.filteredFiles.length),
            this.filteredFiles.length,
            this.currentPage,
            totalPages
        );
        UIManager.updateStats(filesArr.length, this.currentFile.jsonData.data.totalSize || 0);
    },
    exportCurrentFile() {
        if (!this.currentFile) {
            UIManager.showNotification('请先选择文件', 'warning');
            return;
        }
        const dataStr = this.currentFile.jsonData.export();
        UIManager.downloadFile(dataStr, `${this.currentFile.name}.json`);
        UIManager.showNotification('文件已导出', 'success');
    },
    deleteSelectedFiles(paths) {
        if (!this.currentFile || !paths || paths.length === 0) return;
        this.currentFile.jsonData.removeFiles(paths);
        this.saveFiles();
        this.currentPage = 1;
        this.updateFileTableUI();
        UIManager.showNotification(`已删除 ${paths.length} 个文件`, 'success');
    },
};

export default FileManager; 