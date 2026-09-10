window.onload = function () {
    if (userlogin()) {
        const selectedCategory = 'all';
        fetchAndDisplayApprovedProjects(selectedCategory); // 根據選擇的類別重新載入專案
    } else {
        const selectedCategory = 'all';
        NonloginProjects(selectedCategory); // 根據選擇的類別重新載入專案
    }

    // 新增搜索事件處理
    document.getElementById('keyword').addEventListener('input', function() {
        const keyword = this.value.trim();
        if (keyword) {
            searchProjects(keyword);
        } else {
            const selectedCategory = 'all';
            if (userlogin()) {
                fetchAndDisplayApprovedProjects(selectedCategory); // 沒有輸入時顯示所有專案
            } else {
                NonloginProjects(selectedCategory); // 沒有輸入時顯示所有專案
            }
        }
    });
};

function userlogin() {
    return localStorage.getItem("user") != null;
}

document.getElementById('searchPageBtn').addEventListener('click', function() {
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'block';
});

document.querySelector('.close').addEventListener('click', function() {
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'none';
});

window.onclick = function(event) {
    const modal = document.getElementById('categoryModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

document.getElementById('search-button').addEventListener('click', function() {
    const selectedCategory = document.querySelector('input[name="category"]:checked').value;
    if (userlogin()) {
        fetchAndDisplayApprovedProjects(selectedCategory); // 根據選擇的類別重新載入專案
    } else {
        NonloginProjects(selectedCategory); // 根據選擇的類別重新載入專案
    }
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'none';
});

function fetchAndDisplayApprovedProjects(category = 'all') {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : 0; // 未登入時設為 0
    let url = `/approved-projects?userId=${encodeURIComponent(userId)}`;
    if (category !== 'all') {
        url += `&category=${encodeURIComponent(category)}`;
    }

    fetch(url)
        .then((response) => response.json())
        .then((projects) => {
            const projectsContainer = document.getElementById("approved-projects-container");
            projectsContainer.innerHTML = '';
            if (projects.length === 0) {
                const noContent = document.createElement("div");
                noContent.classList.add("resultCard");
                noContent.innerHTML = `
                    <div class="noContentLine">
                        <h1 class="noContent">尚無符合條件的專案</h1>
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
                        <img onclick="window.location.href='../detail.html?id=${project.project_id}'" src="${project.project_image1}" alt="" />
                        <div class="resultInfo">
                            <div class="listTitle">
                                <h1 onclick="window.location.href='../detail.html?id=${project.project_id}'">${project.project_name}</h1>
                                <div class="favorite-icon ${project.bookmarked ? 'active' : ''}" onclick="toggleFavorite(this)">
                                    <img src="images/bookmark.png" alt="收藏" class="empty-bookmark">
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
        .catch((error) => console.error("Error loading projects:", error));
}

// 未登入時
function NonloginProjects(category = 'all') {
    let url = `/unlogin-approved-projects?category=${encodeURIComponent(category)}`;

    fetch(url)
        .then((response) => response.json())
        .then((projects) => {
            const projectsContainer = document.getElementById("approved-projects-container");
            projectsContainer.innerHTML = '';
            if (projects.length === 0) {
                const noContent = document.createElement("div");
                noContent.classList.add("resultCard");
                noContent.innerHTML = `
                    <div class="informationLine">
                        <h1 class="informationTitle noContent">尚無通知</h1>
                    </div>
                `;
                projectsContainer.appendChild(noContent);
            } else {
                projects.forEach((project) => {
                    const projectCard = document.createElement("div");
                    const percentage = ((project.cumulative_amount / project.final_cost) * 100).toFixed(2);
                    const tag = project.project_tag;

                    projectCard.classList.add("project-card");
                    projectCard.innerHTML = `
                    <div class="resultCard" data-project-id="${project.project_id}" >
                        <img src="${project.project_image1}" alt="" />
                        <div class="resultInfo">
                            <div class="listTitle">
                                <h1 onclick="window.location.href='../detail.html?id=${project.project_id}'">${project.project_name}</h1>
                                 <div class="favorite-icon"  onclick="toggleFavorite(this)">
                                <img src="images/bookmark.png" alt="收藏" class="empty-bookmark">
                                <img src="images/bookmark_filled.png" alt="已收藏" class="filled-bookmark">
                            </div>
                            </div>
                            <div class="resultProgressMsg" onclick="window.location.href='../detail.html?id=${project.project_id}'">
                                <div class="resultPer">
                                    目標金額：<span>${Number(project.cumulative_amount).toLocaleString()}</span>/<span>${Number(project.final_cost).toLocaleString()}</span>(<span>${percentage}%</span>)
                                </div>
                                <div class="resultProgress">
                                    <div class="resultProgressLine" style="width: ${percentage};"></div>
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
        .catch((error) => console.error("Error loading projects:", error));
}

// 收藏
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
        fetchAndDisplayApprovedProjects(); // 刷新頁面，根據需要可修改
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

// 搜尋
function searchProjects(keyword) {
    fetch(`/search-projects?q=${encodeURIComponent(keyword)}`)
        .then(response => response.json())
        .then(projects => {
            const projectsContainer = document.getElementById("approved-projects-container");
            projectsContainer.innerHTML = ''; // 清空現有內容

            if (projects.length === 0) {
                const noContent = document.createElement("div");
                noContent.classList.add("resultCard");
                noContent.innerHTML = `
                    <div class="informationLine">
                        <h1 class="informationTitle noContent">尚無符合條件的專案</h1>
                    </div>
                `;
                projectsContainer.appendChild(noContent);
            } else {
                projects.forEach(project => {
                    const percentage = ((project.cumulative_amount / project.final_cost) * 100).toFixed(2);
                    const projectCard = document.createElement("div");
                    projectCard.classList.add("project-card");
                    projectCard.innerHTML = `
                    <div class="resultCard" data-project-id="${project.project_id}">
                        <img src="${project.project_image1}" alt="" />
                        <div class="resultInfo">
                            <div class="listTitle">
                                <h1 onclick="window.location.href='../detail.html?id=${project.project_id}'">${project.project_name}</h1>
                                <div class="favorite-icon" onclick="toggleFavorite(this)">
                                    <img src="images/bookmark.png" alt="收藏" class="empty-bookmark">
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
        .catch(error => console.error("Error searching projects:", error));
}
