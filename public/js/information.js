const tabs = document.querySelectorAll('.tabs > button');

// 更新通知的函數
async function updateNotifications(type) {
    const notificationList = document.getElementById('approved-projects-container');
    notificationList.innerHTML = ''; // 清空通知列表

    const userId = 1; // 假設你有從登入系統取得 user_id

    try {
        const response = await fetch(`/search/notifications/${userId}/${type}`);
        const notifications = await response.json();

        if (notifications.length > 0) {
            notifications.forEach(notification => {
                const card = document.createElement('div');
                card.className = 'resultCard';
                card.innerHTML = `
                    <img src="${notification.project_image1}" alt="專案圖片">
                    <div class="informationLine">
                        <h1 class="informationTitle">${notification.notification_title}</h1>
                        <p class="informationCntent">${notification.notification_text}</p>
                    </div>
                `;
                notificationList.appendChild(card);
            });
        } else {
            notificationList.innerHTML = `
                <div class="resultCard">
                    <div class="noContentLine">尚無通知</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        notificationList.innerHTML = `
            <div class="resultCard">
                <div class="noContentLine">無法加載通知</div>
            </div>
        `;
    }
}

// 初始化顯示 "已捐款" 分類的通知
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        tabs.forEach(t => t.removeAttribute('select'));
        this.setAttribute('select', '1');

        const selectedType = this.getAttribute('data-type');  // 使用 data-type 獲取按鈕類型
        updateNotifications(selectedType);  // 傳遞按鈕類型作為 type
    });
});

updateNotifications(1);  // 頁面初始化時顯示 "已捐款" 的通知
