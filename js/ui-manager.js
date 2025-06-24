// UI管理模块
const UIManager = {
    // 通知
    showNotification(message, type = 'info') {
        window.UIUtils.showNotification(message, type);
    },
    // 下载文件
    downloadFile(content, filename) {
        window.UIUtils.downloadFile(content, filename);
    },
    // 文件列表渲染
    renderFileList(files, currentFile) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        if (!files || files.length === 0) {
            fileList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>暂无文件</p>
                </div>
            `;
            return;
        }
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = `file-item${file === currentFile ? ' active' : ''}`;
            fileItem.innerHTML = `
                <input type="checkbox" class="file-merge-checkbox" data-index="${index}" style="margin-right:8px;vertical-align:middle;">
                <span class="file-item-name">${file.name}</span>
                <span class="file-item-info">${file.jsonData.files.length} 个文件</span>
                <div class="file-item-actions">
                    <button class="btn btn-outline btn-sm" data-action="rename" data-index="${index}"><i class="fas fa-edit"></i> 重命名</button>
                    <button class="btn btn-danger btn-sm" data-action="delete" data-index="${index}"><i class="fas fa-trash"></i> 删除</button>
                    <button class="btn btn-secondary btn-sm" data-action="copy" data-index="${index}"><i class="fas fa-copy"></i> 复制</button>
                </div>
            `;
            fileItem.addEventListener('click', (e) => {
                if (!e.target.closest('.file-item-actions') && !e.target.classList.contains('file-merge-checkbox')) {
                    // 直接调用FileManager，通过全局变量访问
                    if (window.FileManager) {
                        window.FileManager.selectFile(index);
                    }
                }
            });
            fileList.appendChild(fileItem);
        });
    },
    // 文件表格渲染
    renderFileTable(pageData, startIndex = 0) {
        const tbody = document.getElementById('fileTableBody');
        tbody.innerHTML = '';
        if (!pageData || pageData.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">
                        <div class="empty-state">
                            <i class="fas fa-file"></i>
                            <p>暂无文件信息</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        pageData.forEach((file, i) => {
            const actualIndex = startIndex + i;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" data-index="${actualIndex}"></td>
                <td>${file.path ? this.getFileName(file.path) : ''}</td>
                <td>${this.formatFileSize(file.size)}</td>
                <td>${file.path || '/'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" data-action="copy-row" data-index="${actualIndex}"><i class="fas fa-copy"></i> 复制</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },
    // 分页控件渲染
    updatePagination(start, end, total, currentPage, totalPages) {
        document.getElementById('paginationInfo').textContent = `显示 ${start}-${end} 条，共 ${total} 条`;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('currentPageInput').value = currentPage;
        document.getElementById('firstPageBtn').disabled = currentPage === 1;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
        document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
    },
    // 文件统计
    updateStats(count, totalSize) {
        document.getElementById('fileCount').textContent = `${count} 个文件`;
        document.getElementById('totalSize').textContent = `总大小: ${this.formatFileSize(totalSize)}`;
    },
    // 文件大小格式化
    formatFileSize(size) {
        if (!size) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        while (size >= 1024 && i < units.length - 1) {
            size /= 1024;
            i++;
        }
        return size.toFixed(2) + ' ' + units[i];
    },
    // 文件名提取
    getFileName(path) {
        return path ? path.split('/').pop() : '';
    },
    // 模态框
    showModal(title, message, onConfirm) {
        window.UIUtils.showModal(title, message, onConfirm);
        // 兼容：将回调同步到UIManager，便于event-binder.js调用
        this.modalCallback = onConfirm;
    },
    closeModal() {
        document.getElementById('modal').classList.remove('show');
        this.modalCallback = null;
        window.UIUtils.modalCallback = null;
    },
    // 重命名模态框
    showRenameModal(oldName, onConfirm) {
        document.getElementById('renameInput').value = oldName;
        document.getElementById('renameModal').style.display = 'block';
        this.renameCallback = onConfirm;
    },
    closeRenameModal() {
        document.getElementById('renameModal').style.display = 'none';
        this.renameCallback = null;
    },
    confirmRename() {
        if (this.renameCallback) {
            const newName = document.getElementById('renameInput').value.trim();
            if (newName) this.renameCallback(newName);
            this.closeRenameModal();
        }
    },
    // 显示解析秒链结果
    showParsedLinkResult(content) {
        const resultDiv = document.getElementById('parsedLinkResult');
        if (resultDiv) {
            resultDiv.innerText = content || '';
        }
    },
    // 渲染解析秒链的文件表格
    renderParsedFileTable(files) {
        const wrapper = document.querySelector('.file-info-section .file-table-wrapper');
        if (!wrapper) return;
        // 移除旧的解析表格
        let parsedTable = document.getElementById('parsedFileTable');
        if (parsedTable) parsedTable.remove();
        // 没有数据时不显示
        if (!files || files.length === 0) return;
        // 创建表格
        parsedTable = document.createElement('table');
        parsedTable.className = 'file-table';
        parsedTable.id = 'parsedFileTable';
        parsedTable.innerHTML = `
            <thead>
                <tr>
                    <th>文件名</th>
                    <th>大小</th>
                    <th>路径</th>
                    <th>ETag</th>
                </tr>
            </thead>
            <tbody>
                ${files.map(file => `
                    <tr>
                        <td>${this.getFileName(file.path)}</td>
                        <td>${this.formatFileSize(file.size)}</td>
                        <td>${file.path || '/'}</td>
                        <td>${file.etag || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        wrapper.appendChild(parsedTable);
    }
};

export default UIManager; 