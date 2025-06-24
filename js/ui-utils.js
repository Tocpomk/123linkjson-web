/**
 * UI工具模块
 * 包含通知、模态框、文件操作等通用UI功能
 */

class UIUtils {
    /**
     * 显示通知
     */
    static showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = notification.querySelector('.notification-message');
        
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * 显示模态框
     */
    static showModal(title, message, onConfirm) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').textContent = message;
        const modal = document.getElementById('modal');
        modal.classList.add('show');
        // 解绑旧事件，绑定新事件，确保只执行一次
        const confirmBtn = document.getElementById('modalConfirm');
        if (confirmBtn) {
            const oldBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(oldBtn, confirmBtn);
            oldBtn.addEventListener('click', () => {
                if (typeof onConfirm === 'function') onConfirm();
                UIUtils.hideModal();
            });
        }
    }

    /**
     * 隐藏模态框
     */
    static hideModal() {
        document.getElementById('modal').classList.remove('show');
        this.modalCallback = null;
    }

    /**
     * 确认模态框
     */
    static confirmModal() {
        if (this.modalCallback) {
            this.modalCallback();
        }
        this.hideModal();
    }

    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 获取文件名
     */
    static getFileName(path) {
        return path.split('/').pop() || path;
    }

    /**
     * 复制文本到剪贴板
     */
    static copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // 降级方案
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        });
    }

    /**
     * 下载文件
     */
    static downloadFile(content, filename, mimeType = 'application/json') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 读取文件
     */
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * 防抖函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 生成唯一ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 验证文件类型
     */
    static validateFileType(file, allowedTypes = ['.json']) {
        const fileName = file.name.toLowerCase();
        return allowedTypes.some(type => fileName.endsWith(type));
    }

    /**
     * 获取文件扩展名
     */
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }

    /**
     * 转义HTML
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 创建元素
     */
    static createElement(tag, className, innerHTML = '') {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        if (innerHTML) {
            element.innerHTML = innerHTML;
        }
        return element;
    }

    /**
     * 添加事件监听器
     */
    static addEventListener(element, event, handler, options = {}) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.addEventListener(event, handler, options);
        }
    }

    /**
     * 移除事件监听器
     */
    static removeEventListener(element, event, handler, options = {}) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.removeEventListener(event, handler, options);
        }
    }

    /**
     * 获取元素
     */
    static getElement(selector) {
        if (selector.startsWith('#')) {
            return document.getElementById(selector.slice(1));
        }
        return document.querySelector(selector);
    }

    /**
     * 获取所有元素
     */
    static getElements(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * 显示/隐藏元素
     */
    static toggleElement(element, show) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.style.display = show ? '' : 'none';
        }
    }

    /**
     * 添加/移除CSS类
     */
    static toggleClass(element, className, add) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            if (add) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
    }

    /**
     * 设置元素属性
     */
    static setAttribute(element, attribute, value) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    /**
     * 获取元素属性
     */
    static getAttribute(element, attribute) {
        if (typeof element === 'string') {
            element = this.getElement(element);
        }
        if (element) {
            return element.getAttribute(attribute);
        }
        return null;
    }
}

// 导出到全局作用域
window.UIUtils = UIUtils; 