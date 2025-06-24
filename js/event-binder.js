// 事件绑定模块
import FileManager from './file-manager.js';
import LinkManager from './link-manager.js';
import UIManager from './ui-manager.js';

const EventBinder = {
    bindAll() {
        // 文件操作按钮
        const addFileBtn = document.getElementById('addFileBtn');
        if (addFileBtn) addFileBtn.addEventListener('click', () => {
            const input = document.getElementById('addFileInput');
            if (input) input.click();
        });
        
        const refreshFilesBtn = document.getElementById('refreshFilesBtn');
        if (refreshFilesBtn) refreshFilesBtn.addEventListener('click', () => {
            FileManager.loadFiles();
            FileManager.updateFileListUI();
            UIManager.showNotification('文件列表已刷新', 'info');
        });
        
        const mergeFileBtn = document.getElementById('mergeFileBtn');
        if (mergeFileBtn) mergeFileBtn.addEventListener('click', () => {
            const checked = document.querySelectorAll('.file-merge-checkbox:checked');
            if (checked.length < 2) {
                UIManager.showNotification('请至少勾选两个文件进行合并', 'warning');
                return;
            }
            const indices = Array.from(checked).map(cb => parseInt(cb.dataset.index));
            const filesToMerge = indices.map(idx => FileManager.files[idx]);
            FileManager.mergeFiles(filesToMerge);
            checked.forEach(cb => cb.checked = false);
            UIManager.showNotification('文件已合并', 'success');
        });
        
        // 文件输入
        const addFileInput = document.getElementById('addFileInput');
        if (addFileInput) addFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length) {
                FileManager.handleDroppedFiles(files);
            }
            e.target.value = '';
        });
        
        // 链接操作
        const parseLinkBtn = document.getElementById('parseLinkBtn');
        if (parseLinkBtn) parseLinkBtn.addEventListener('click', () => {
            const links = document.getElementById('linkInput').value.trim();
            if (!links) {
                UIManager.showNotification('请输入秒链', 'warning');
                UIManager.renderFileTable([]);
                UIManager.updatePagination(0, 0, 0, 1, 1);
                UIManager.updateStats(0, 0);
                return;
            }
            const parsed = LinkManager.parseLinks(links);
            if (!parsed.length) {
                UIManager.showNotification('未解析到有效文件', 'warning');
                UIManager.renderFileTable([]);
                UIManager.updatePagination(0, 0, 0, 1, 1);
                UIManager.updateStats(0, 0);
                return;
            }
            // 直接渲染到主表格
            UIManager.renderFileTable(parsed, 0);
            UIManager.updatePagination(1, parsed.length, parsed.length, 1, 1);
            UIManager.updateStats(parsed.length, parsed.reduce((sum, f) => sum + (parseInt(f.size) || 0), 0));
            UIManager.showNotification(`已解析 ${parsed.length} 个文件`, 'success');
        });
        
        const pasteLinkBtn = document.getElementById('pasteLinkBtn');
        if (pasteLinkBtn) pasteLinkBtn.addEventListener('click', () => {
            navigator.clipboard.readText().then(text => {
                document.getElementById('linkInput').value = text;
                UIManager.showNotification('链接已粘贴', 'success');
            }).catch(() => {
                UIManager.showNotification('无法访问剪贴板', 'error');
            });
        });
        
        const batchAddBtn = document.getElementById('batchAddBtn');
        if (batchAddBtn) batchAddBtn.addEventListener('click', () => {
            const links = document.getElementById('linkInput').value.trim();
            if (!links) {
                UIManager.showNotification('请输入秒链', 'warning');
                return;
            }
            if (!FileManager.currentFile) {
                UIManager.showNotification('请先选中一个JSON文件', 'warning');
                return;
            }
            LinkManager.batchAddLinks(links);
            document.getElementById('linkInput').value = '';
        });
        
        const clearLinkBtn = document.getElementById('clearLinkBtn');
        if (clearLinkBtn) clearLinkBtn.addEventListener('click', () => {
            document.getElementById('linkInput').value = '';
            UIManager.showNotification('输入框已清空', 'info');
        });
        
        // 表格操作
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.addEventListener('input', (e) => {
            FileManager.setSearchTerm(e.target.value);
        });
        
        const sortBtn = document.getElementById('sortBtn');
        if (sortBtn) sortBtn.addEventListener('click', () => {
            if (!FileManager.currentFile) return;
            FileManager.currentFile.jsonData.sortFiles();
            FileManager.saveFiles();
            FileManager.updateFileTableUI();
            UIManager.showNotification('文件已按路径排序', 'success');
        });
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => {
            FileManager.exportCurrentFile();
        });
        
        const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
        if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', () => {
            const selected = document.querySelectorAll('#fileTableBody input[type="checkbox"]:checked');
            if (!selected.length) {
                UIManager.showNotification('请选择要删除的文件', 'warning');
                return;
            }
            UIManager.showModal('删除选中文件', `确定要删除选中的 ${selected.length} 个文件吗？`, () => {
                const paths = Array.from(selected).map(cb => cb.dataset.path).filter(Boolean);
                FileManager.deleteSelectedFiles(paths);
                // 删除方法内部已经调用了更新UI的方法，这里不需要重复调用
            });
        });
        
        const selectAll = document.getElementById('selectAll');
        if (selectAll) selectAll.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#fileTableBody input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
        
        // 分页控件
        const firstPageBtn = document.getElementById('firstPageBtn');
        if (firstPageBtn) firstPageBtn.addEventListener('click', () => FileManager.goToPage(1));
        
        const prevPageBtn = document.getElementById('prevPageBtn');
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => FileManager.goToPage(FileManager.currentPage - 1));
        
        const nextPageBtn = document.getElementById('nextPageBtn');
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => FileManager.goToPage(FileManager.currentPage + 1));
        
        const lastPageBtn = document.getElementById('lastPageBtn');
        if (lastPageBtn) lastPageBtn.addEventListener('click', () => FileManager.goToPage(FileManager.getTotalPages()));
        
        const currentPageInput = document.getElementById('currentPageInput');
        if (currentPageInput) currentPageInput.addEventListener('change', (e) => FileManager.goToPage(parseInt(e.target.value)));
        
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) pageSizeSelect.addEventListener('change', (e) => FileManager.changePageSize(parseInt(e.target.value)));
        
        // 链接生成
        const generateLinkBtn = document.getElementById('generateLinkBtn');
        if (generateLinkBtn) generateLinkBtn.addEventListener('click', () => {
            if (!FileManager.currentFile) {
                UIManager.showNotification('请先选择文件', 'warning');
                return;
            }
            const selected = document.querySelectorAll('#fileTableBody input[type="checkbox"]:checked');
            let files = [];
            if (selected.length) {
                files = Array.from(selected).map(cb => FileManager.filteredFiles[parseInt(cb.dataset.index)]);
            } else {
                files = FileManager.currentFile.jsonData.files;
            }
            const links = LinkManager.generateLinks(files);
            document.getElementById('generatedLink').value = links;
            UIManager.showNotification(`已生成 ${files.length} 个链接`, 'success');
        });
        
        const selectAllForLink = document.getElementById('selectAllForLink');
        if (selectAllForLink) selectAllForLink.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#fileTableBody input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
        
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => {
            const val = document.getElementById('generatedLink').value;
            LinkManager.copyToClipboard(val);
        });
        
        const clearGeneratedBtn = document.getElementById('clearGeneratedBtn');
        if (clearGeneratedBtn) clearGeneratedBtn.addEventListener('click', () => {
            document.getElementById('generatedLink').value = '';
            UIManager.showNotification('生成的链接已清空', 'info');
        });
        
        // 重命名模态框
        const renameModalClose = document.getElementById('renameModalClose');
        if (renameModalClose) renameModalClose.addEventListener('click', () => UIManager.closeRenameModal());
        
        const renameCancel = document.getElementById('renameCancel');
        if (renameCancel) renameCancel.addEventListener('click', () => UIManager.closeRenameModal());
        
        const renameConfirm = document.getElementById('renameConfirm');
        if (renameConfirm) renameConfirm.addEventListener('click', () => UIManager.confirmRename());
        
        // 通用模态框
        const modalClose = document.getElementById('modalClose');
        if (modalClose) modalClose.addEventListener('click', () => UIManager.closeModal());
        
        const modalCancel = document.getElementById('modalCancel');
        if (modalCancel) modalCancel.addEventListener('click', () => UIManager.closeModal());
        
        const modalConfirm = document.getElementById('modalConfirm');
        if (modalConfirm) modalConfirm.addEventListener('click', () => {
            // 优先调用UIManager的回调
            if (UIManager.modalCallback) UIManager.modalCallback();
            // 兼容调用UIUtils的回调
            if (window.UIUtils.modalCallback) window.UIUtils.modalCallback();
            UIManager.closeModal();
        });
        
        // 文件列表内按钮事件（重命名/删除/复制）
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index);
            console.log('[EventBinder] fileList click, action:', action, 'index:', index);
            if (action === 'rename') {
                UIManager.showRenameModal(FileManager.files[index].name, (newName) => {
                    FileManager.renameFile(index, newName);
                });
            } else if (action === 'delete') {
                console.log('[EventBinder] delete button clicked, index:', index);
                UIManager.showModal('删除文件', `确定要删除文件 "${FileManager.files[index].name}" 吗？此操作不可恢复。`, () => {
                    console.log('[EventBinder] delete confirm, index:', index);
                    FileManager.deleteFile(index);
                });
            } else if (action === 'copy') {
                const file = FileManager.files[index];
                const links = LinkManager.generateLinks(file.jsonData.files);
                LinkManager.copyToClipboard(links);
            }
        });
        
        // 文件表格内复制按钮
        const fileTableBody = document.getElementById('fileTableBody');
        if (fileTableBody) fileTableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action="copy-row"]');
            if (!btn) return;
            const index = parseInt(btn.dataset.index);
            const file = FileManager.filteredFiles[index];
            const link = LinkManager.generateLinks([file]);
            LinkManager.copyToClipboard(link);
        });
        
        // 快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S 导出
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                FileManager.exportCurrentFile();
            }
            // Ctrl/Cmd + V 粘贴链接
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (document.activeElement.id !== 'linkInput') {
                    e.preventDefault();
                    if (pasteLinkBtn) pasteLinkBtn.click();
                }
            }
            // Delete 删除选中文件
            if (e.key === 'Delete') {
                const selected = document.querySelectorAll('#fileTableBody input[type="checkbox"]:checked');
                if (selected.length) {
                    e.preventDefault();
                    if (deleteSelectedBtn) deleteSelectedBtn.click();
                }
            }
        });
    }
};

export default EventBinder;