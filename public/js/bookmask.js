document.addEventListener("DOMContentLoaded", () => {
    // 預設加載已收藏專案
    fetchAndDisplayBookmarkedProjects();
    const tabs = document.querySelectorAll('.tabs > button');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.removeAttribute('select'));
            this.setAttribute('select', '1');
    
            const selectedType = this.getAttribute('data-type');  // 使用 data-type 獲取按鈕類型
            if (selectedType == 1) {
                fetchAndDisplayBookmarkedProjects();
            }

            if (selectedType == 2) {
                updateNotifications(selectedType==2);  // 傳遞按鈕類型作為 type
            }

            
        });
    });
});

async function updateNotifications(type) {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : 0; // 未登入時設為 0
    let url = `/bookmarked-projects?userId=${encodeURIComponent(userId)}`;
    
    fetch(url)
    .then((response) => response.json())
    .then((projects) => {
        const projectsContainer = document.getElementById("bookmarked-projects-container");
        projectsContainer.innerHTML = '';
        
       
            const noContent = document.createElement("div");
            noContent.classList.add("resultCard");
            noContent.innerHTML = `
                <div class="noContentLine">
                    <p class=" noContent">尚無收藏中的專案</p>
                </div>
            `;
            projectsContainer.appendChild(noContent);
       
        
    })
    .catch((error) => console.error("Error loading bookmarked projects:", error));

}



// 已捐款專案的程式碼
function fetchAndDisplayDonatedProjects() {
    // 在這裡編寫獲取並顯示已捐款專案的程式碼
    console.log("顯示已捐款專案");
}

// 已達標專案的程式碼
function fetchAndDisplayGoalProjects() {
    // 在這裡編寫獲取並顯示已達標專案的程式碼
    console.log("顯示已達標專案");
}


function fetchAndDisplayBookmarkedProjects() {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : 0; // 未登入時設為 0
    let url = `/bookmarked-projects?userId=${encodeURIComponent(userId)}`;

    fetch(url)
        .then((response) => response.json())
        .then((projects) => {
            const projectsContainer = document.getElementById("bookmarked-projects-container");
            projectsContainer.innerHTML = '';
            
            if (projects.length === 0) {
                const noContent = document.createElement("div");
                noContent.classList.add("resultCard");
                noContent.innerHTML = `
                    <div class="noContentLine">
                        <p class=" noContent">尚無收藏中的專案</p>
                    </div>
                `;
                projectsContainer.appendChild(noContent);
            } else {
                projects.forEach((project) => {
                    const projectCard = document.createElement("div");
                    const percentage = ((project.cumulative_amount / project.final_cost) * 100).toFixed(2);
                    projectCard.classList.add("project-card");
                    projectCard.innerHTML = `
                    <div class="resultCard" data-project-id="${project.project_id}">
                        <img src="${project.project_image1}" alt="" />
                        <div class="resultInfo">
                            <div class="listTitle">
                                <h1 onclick="window.location.href='../detail.html?id=${project.project_id}'">${project.project_name}</h1>
                                <div class="favorite-icon active" onclick="toggleFavorite(this)">
                                    <img src="images/bookmark_filled.png" alt="已收藏" class="filled-bookmark">
                                </div>
                            </div>
                            <div class="resultProgressMsg" onclick="window.location.href='../detail.html?id=${project.project_id}'">
                                <div class="resultPer">
                                    目標金額：<span>${Number(project.cumulative_amount).toLocaleString()}</span>/<span>${Number(project.final_cost).toLocaleString()}</span>(<span>${percentage}%</span>)
                                </div>
                                <div class="resultProgress">
                                    <div class="resultProgressLine" style="width: ${percentage}%;"></div>
                                </div>
                                <div class="resultBottom">
                                    <div class="resultPeople"><span>${Number(project.donor_count).toLocaleString()}</span></div>
                                    <div class="resultTime">於<span>${new Date(project.project_final_date).toLocaleDateString()}</span>截止</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                    projectsContainer.appendChild(projectCard);
                });
            }
        })
        .catch((error) => console.error("Error loading bookmarked projects:", error));
}

function toggleFavorite(element) {
    const projectCard = element.closest('.resultCard');
    const projectId = projectCard.getAttribute("data-project-id");
    const user = localStorage.getItem("user");
    const userId = user ? JSON.parse(user).id : 0; // 未登入時設為 0

    if (userId === 0) {
        showMessage('請先登入');
        return;
    }

    fetch("/toggle-bookmark", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, userId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.bookmarked) {
            element.classList.add('active');
            showMessage('收藏成功');
        } else {
            element.classList.remove('active');
            showMessage('取消收藏');
        }
        
        // 刷新收藏頁面
        fetchAndDisplayBookmarkedProjects();
    })
    .catch(error => console.error("Error:", error));
}

function showMessage(message) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.style.display = 'block';

    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);  // 3 秒後自動隱藏
}
