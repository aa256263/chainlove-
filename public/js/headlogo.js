// 創建新的 link 元素
var link = document.createElement('link');
link.rel = 'icon';
link.href = './images/logo.png';
link.type = 'image/x-icon';

// 將 link 元素插入到 head 中
document.head.appendChild(link);
