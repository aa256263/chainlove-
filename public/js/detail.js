function toggleFavorite(element) {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user.id : 0; // 未登入時設為 0
    const projectId = getProjectIdFromURL();

    if (userId === 0) {
        showMessage('請先登入');
        return;
    }

    fetch('/toggle-bookmark', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, projectId })
    })
    .then(response => response.json())
    .then(data => {
        element.classList.toggle('active', data.bookmarked);

        if (data.bookmarked) {
            showMessage('收藏成功');
        } else {
            showMessage('取消收藏');
        }
    })
    .catch(error => {
        console.error('Error toggling bookmark:', error);
    });
}

function showMessage(message) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);  // 3 秒後自動隱藏
}


document.addEventListener('DOMContentLoaded', function() {
    const projectId = getProjectIdFromURL();
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user.id : 0; // 未登入時設為 0

    console.log('projectId:', projectId);
    console.log('userId:', userId);

    if (!projectId) {
        console.error('Project ID is undefined');
        return;
    }

    fetch(`/api/project-detail-doners/${projectId}`)
    .then(response => response.json())
    .then(data => {
        const donationContainer = document.querySelector('.donor-list');
        donationContainer.innerHTML = '';
  
        // 計算需要顯示的資料筆數
        const displayCount = Math.min(data.length, 3);
  
        // 遍歷並顯示每筆捐款記錄
        for (let i = 0; i < displayCount; i++) {
            const donation = data[i];
            const itemDiv = document.createElement('div');
            itemDiv.className = 'donor';
            itemDiv.innerHTML = `
                <img src="./images/img.png" />
                <span class="donor-id">${donation.username}</span>
                <span class="donor-id">${Number(donation.amount).toLocaleString()}</span>
            `;
            donationContainer.appendChild(itemDiv);
        }
  
        // 確保顯示"顯示更多"的按鈕
        const moreDiv = document.createElement('div');
        moreDiv.className = 'donor';
        moreDiv.innerHTML = `
            <img src="./images/more.png" />
            <span class="donor-id">捐款<br>詳情</span>
            <span class="donor-id"></span>
        `;
        moreDiv.addEventListener('click', () => {
            window.location.href = `./donorlist.html?id=${projectId}`;
        });
        donationContainer.appendChild(moreDiv);
    })
    .catch(error => {
        console.error('Error fetching donation records:', error);
    });

    fetch(`/api/project-expenses/${projectId}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);  // 檢查API返回的數據

        const allocationItems = document.querySelectorAll('.allocation-item');

        allocationItems.forEach(allocationItem => {
            const typeElement = allocationItem.querySelector('.allocation-type');
            const amountElement = allocationItem.querySelector('.allocation-amount');
            const expense = data.find(exp => exp.expense_title === typeElement.textContent.trim());

            if (expense) {
                // 如果有匹配的資料，更新金額
                amountElement.textContent = Number(expense.total_amount).toLocaleString() || '未知金額';
            } else {
                // 如果沒有匹配的資料，設置金額為0
                amountElement.textContent = '0';
            }
        });
    })
    .catch(error => {
        console.error('Error fetching expense data:', error);
    });


    fetch(`/api/projectdetails/${projectId}?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                console.error('No project data found');
                
                return;
            }
            const project = data[0]; // 只在 then 回調內部使用 project 變量
            document.title = project.project_name || '專案名稱'; 
            // 設置專案內容和顯示項目
            const projectFinalDate = new Date(project.project_final_date); // 將專案日期轉為 Date 物件
            const currentDate = new Date(); // 當前日期
            const donateBtn = document.getElementById('donate-btn'); // 捐款按鈕
            const projectFinalDateElement = document.getElementById('project-final-date'); // 顯示截止日期的元素


            // 處理項目內容，將段落前加兩個全形空格並換行
            const paragraphs = project.project_content.split('\n');
            const formattedContent = paragraphs.map(paragraph => {
                if (paragraph.trim()) {
                    return `\u3000\u3000${paragraph}`;
                }
                return ''; // 保持空行不變
            }).join('<br>'); // 用 <br> 連接段落
            const targetperson=(project.cumulative_amount / project.target1_cost * 100).toFixed(1);
            
            
            document.getElementById('project-content').innerHTML = formattedContent || 'N/A';
            document.getElementById('project-code').textContent = "勸募許可文號："+project.project_code || 'N/A';
            document.getElementById('projectname').textContent = project.project_name || 'N/A';
            document.getElementById('project-tag').textContent = project.project_tag || 'N/A';
           // document.getElementById('project-content').textContent = project.project_content || 'N/A';
            document.getElementById('cumulative-amount').textContent = Number(project.cumulative_amount).toLocaleString() || '0';
            document.getElementById('final-cost').textContent = Number(project.final_cost).toLocaleString() ||'0';
            document.getElementById('donation-ratio').textContent = (project.donation_ratio * 100).toFixed(1) + '%' || '0%';
            document.getElementById('progress-line').style.width = (project.donation_ratio * 100) + '%' || '0%';
            document.getElementById('donor-count').textContent = project.donor_count || '0';
            projectFinalDateElement.textContent = projectFinalDate.toLocaleDateString() || 'N/A';
            // 設置機構名稱和地址
            document.getElementById('project-agency').textContent = project.project_agency || 'N/A';
            document.getElementById('project-address').textContent = project.project_address || 'N/A';
            document.getElementById('gomilestonecash').textContent=Number(project.cumulative_amount).toLocaleString()+"/"+Number(project.target1_cost).toLocaleString()+"("+targetperson+"%"+")" || '0';

            // 設置圖片
            const projectImageElement = document.querySelector('.project-image img');
            if (projectImageElement) {
                projectImageElement.src = project.project_image1 || 'default-image.jpg';
            }
            


            // 檢查專案是否已截止
            if (projectFinalDate < currentDate) {
                donateBtn.textContent = "專案已截止";
                donateBtn.disabled = true; // 禁用按鈕
            }
            // 設置收藏狀態
            const favoriteIconElement = document.querySelector('.favorite-icon');
            if (project.bookmarked) {
                favoriteIconElement.classList.add('active');
            } else {
                favoriteIconElement.classList.remove('active');
            }

            // 設置階段目標狀態
          

            document.getElementById('gomilestone').onclick = function() {
                window.location.href = `../show_milestone.html?id=${project.project_id}`;
            }
            document.getElementById('godonors').onclick = function() {
                window.location.href = `../donorlist.html?id=${project.project_id}`;
            }

            // 設置最新新聞更新
            const resultCardImageElement = document.querySelector('.resultCard img');
            const newsTitleElement = document.getElementById('news-title');
            const newsContentElement = document.getElementById('news-content');
            const newsCardElement = document.getElementById('newscard');
            if (project.news_uploaded) {
                resultCardImageElement.src = project.latest_news_image;
                newsTitleElement.textContent = project.latest_news_title;
                newsContentElement.textContent ="上傳日期"+ new Date(project.latest_news_uptime).toLocaleDateString();

                newsCardElement.onclick = function() {
                    window.location.href = `../newsdetail.html?id=${project.latest_news_id}`;
                };
            } else {
                newsCardElement.innerHTML = '';
                const newsCardDetail = document.createElement("div");
                newsCardDetail.classList.add("noContentLine");
                newsCardDetail.innerHTML = '<p class=" noContent">尚無進度更新</p>';
                newsCardElement.appendChild(newsCardDetail);
            }
        })
        .catch(error => {
            console.error('Error fetching project details:', error);
        });

        document.getElementById('donate-btn').onclick = function() {
            if (userId === 0) {
                console.log('Please log in before donating');
                alert('請先登入後再進行捐款');
                window.location.href = '../start.html';
                return;
            }
            window.location.href = `../donation.html?id=${getProjectIdFromURL()}`;
        }
        
});

document.getElementById('gonewsupdate').onclick = function() {
    window.location.href = `../newsupdate.html?id=${getProjectIdFromURL()}`;
}

document.getElementById('fund-allocation').onclick = function() {
    window.location.href = `../moneytrail.html?id=${getProjectIdFromURL()}`;
}




function getProjectIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}
