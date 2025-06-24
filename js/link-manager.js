// 链接管理模块
import FileManager from './file-manager.js';
import UIManager from './ui-manager.js';

const LinkManager = {
    // 解析输入的多行链接
    parseLinks(links) {
        if (!links) return [];
        const lines = links.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        let allFiles = [];
        lines.forEach(line => {
            try {
                // 使用全局 LinkParser
                const result = window.LinkParser.parseLink(line);
                if (result.files && result.files.length > 0) {
                    allFiles = allFiles.concat(result.files);
                }
            } catch (e) {
                // 忽略错误行
            }
        });
        return allFiles;
    },
    // 批量添加链接到当前文件
    batchAddLinks(links) {
        const parsedData = this.parseLinks(links);
        if (!parsedData.length) {
            UIManager.showNotification('未找到有效链接', 'warning');
            return;
        }
        if (!FileManager.currentFile) {
            // 没有文件则新建
            const fileName = `新文件_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
            const jd = new window.JsonData();
            jd.createNew();
            jd.addFiles(parsedData);
            const newFile = {
                name: fileName,
                jsonData: jd,
                lastModified: Date.now()
            };
            FileManager.files.push(newFile);
            FileManager.currentFile = newFile;
        } else {
            FileManager.currentFile.jsonData.addFiles(parsedData);
            FileManager.currentFile.lastModified = Date.now();
        }
        FileManager.saveFiles();
        FileManager.updateFileTableUI();
        UIManager.showNotification(`成功添加 ${parsedData.length} 个文件`, 'success');
    },
    // 生成选中文件的秒链
    generateLinks(files) {
        if (!files || !files.length) return '';
        // 使用全局 LinkParser 生成
        return window.LinkParser.generateLink(files);
    },
    // 复制文本到剪贴板
    copyToClipboard(text) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            UIManager.showNotification('已复制到剪贴板', 'success');
        }).catch(() => {
            UIManager.showNotification('复制失败', 'error');
        });
    }
};

export default LinkManager; 