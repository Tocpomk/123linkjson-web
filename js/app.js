// 主入口
import FileManager from './file-manager.js';
import LinkManager from './link-manager.js';
import UIManager from './ui-manager.js';
import EventBinder from './event-binder.js';

window.addEventListener('DOMContentLoaded', () => {
    // 挂载JsonData到全局，确保其它模块可用
    if (!window.JsonData && typeof JsonData !== 'undefined') {
        window.JsonData = JsonData;
    }
    window.FileManager = FileManager;
    window.LinkManager = LinkManager;
    window.UIManager = UIManager;
    window.EventBinder = EventBinder;
    
    FileManager.init();
    EventBinder.bindAll();
    // 其它初始化
}); 