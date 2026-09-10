document.addEventListener("DOMContentLoaded", async function() {
    const projectId = new URLSearchParams(window.location.search).get('id');

    try {
        // 從後端 API 獲取捐款列表
        const response = await fetch(`/api/project-donationlist/${projectId}`);
        const donations = await response.json();

        const donationList = document.querySelector('.center-box');

        // 清空現有列表
        donationList.innerHTML = `
            <li class="table-top">
                <div>捐款人</div>
                <div>金額</div>
                <div>劃轉明細</div>
            </li>
        `;

        // 檢查是否有捐款記錄
        if (donations.length > 0) {
            // 生成每個捐款記錄的列表項
            donations.forEach(donation => {
                const listItem = document.createElement('li');
                listItem.classList.add('list-item');

                listItem.innerHTML = `
                    <div>${donation.username}</div>
                    <div>${Number(donation.amount).toLocaleString()}</div>
                    <div class="btn" onclick="window.open('https://sepolia.etherscan.io/tx/${donation.transaction_hash}', '_blank')">劃轉明細</div>
                `;

                donationList.appendChild(listItem);
            });
        } else {
            // 若無捐款記錄，顯示提示訊息
            const noDataItem = document.createElement('li');
            noDataItem.classList.add('list-item');
            noDataItem.textContent = '目前尚無捐款記錄';
            donationList.appendChild(noDataItem);
        }

    } catch (error) {
        console.error('Error fetching donation records:', error);
        const donationList = document.querySelector('.center-box');
        const errorItem = document.createElement('li');
        errorItem.classList.add('list-item');
        errorItem.textContent = '無法加載捐款記錄';
        donationList.appendChild(errorItem);
    }
});
