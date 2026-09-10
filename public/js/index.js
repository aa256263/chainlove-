window.onload = function () {
    if (userlogin()) {
        const selectedCategory = 'all';
        fetchAndDisplayApprovedProjects(selectedCategory); // 根據選擇的類別重新載入專案
        // fetchAndDisplayTopProjects();
        initSwiper();
        document.getElementById('info').addEventListener('click', function() {
        
                window.location.href = './information.html';
        
            
        });
    } else {
        const selectedCategory = 'all';
        NonloginProjects(selectedCategory); // 根據選擇的類別重新載入專案
        // fetchAndDisplayTopProjects();
        initSwiper();
        document.getElementById('info').addEventListener('click', function() {
           
                showMessage('請先登入');
                return;
            
        });
    }
    getLocationAndStore();
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

function getLocationAndStore() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLatitude = position.coords.latitude;
            const userLongitude = position.coords.longitude;

            // 儲存到 localStorage
            localStorage.setItem('userLatitude', userLatitude);
            localStorage.setItem('userLongitude', userLongitude);

            console.log('位置已儲存:', userLatitude, userLongitude);
        }, (error) => {
            console.error('無法獲取您的位置:', error);
        });
    } else {
        console.error('您的瀏覽器不支援地理位置功能');
    }
}

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

// function fetchAndDisplayTopProjects(category = 'all') {
//     let url = '/top-projects';
//     if (category !== 'all') {
//         url += `?category=${encodeURIComponent(category)}`;
//     }

//     fetch(url)
//         .then(response => response.json())
//         .then(projects => {
//             const carouselContainer = document.getElementById("top-projects-carousel");
//             const dotsContainer = document.querySelector(".swiperPot");
//             carouselContainer.innerHTML = ''; // 清空輪播容器
//             dotsContainer.innerHTML = ''; // 清空圓點容器
            
//             projects.forEach((project, index) => {
//                 const projectSlide = document.createElement("a");
//                 projectSlide.classList.add("swiper-slide" );
//                 projectSlide.innerHTML = `
//                     <a href="../detail.html?id=${project.project_id}">
//                         <img src="${project.project_image1}" alt="${project.project_name}" />
//                     </a>
//                 `;
//                 carouselContainer.appendChild(projectSlide);

//                 // 創建圓點
//                 const dot = document.createElement("div");
//                 dot.classList.add("swiperP");
//                 dot.setAttribute("data-index", index);
//                 dotsContainer.appendChild(dot);
//             });

//             // 初始化Swiper
//             initSwiper();
//         })
//         .catch(error => console.error("Error loading top projects:", error));
// }

function fetchAndDisplayApprovedProjects(category = 'all') {
    const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : 0; // 未登入時設為 0
    let url = `/top-projects?userId=${encodeURIComponent(userId)}`;
    if (category !== 'all') {
        url += `&category=${encodeURIComponent(category)}`;
    }

    fetch(url)
        .then((response) => response.json())
        .then((projects) => {
            const projectsContainer = document.getElementById("approved-projects-container");
            projectsContainer.innerHTML = '';
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
        })
        .catch((error) => console.error("Error loading projects:", error));
}

// 未登入時
function NonloginProjects(category = 'all') {
    let url = `/top-projects?category=${encodeURIComponent(category)}`;

    fetch(url)
        .then((response) => response.json())
        .then((projects) => {
            const projectsContainer = document.getElementById("approved-projects-container");
            projectsContainer.innerHTML = '';
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
        })
        .catch((error) => console.error("Error loading projects:", error));
}

document.getElementById("approved-projects-container").addEventListener("click", function(event) {
    const button = event.target.closest("button.bookmark-btn");
    if (button) {
        const projectId = button.getAttribute("data-project-id");
        console.log("Project ID:", projectId); // 檢查 projectId 是否正確獲取
        bookmarkProject(projectId, button);
    }
});

document.getElementById("approved-projects-container").addEventListener("click", function(event) {
    const button = event.target.closest("button.bookmark-btn");
    if (button) {
        const projectId = button.getAttribute("data-project-id");
        console.log("Project ID:", projectId); // 檢查 projectId 是否正確獲取
        bookmarkProject(projectId, button);
    }
});

function toggleFavorite(element) {
    const projectCard = element.closest('.resultCard');
    const projectId = projectCard.getAttribute("data-project-id");
    const user = localStorage.getItem("user");

    if (!user) {
        showMessage('請先登入');
        return;
    }

    const userId = JSON.parse(user).id;

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
    })
    .catch(error => console.error("Error:", error));
}

function initSwiper() { 
    const swiperLine = document.querySelector('.swiperLine');
    const slides = document.querySelectorAll('.swiper-slide');
    const prevButton = document.querySelector('.swiper-button-prev');
    const nextButton = document.querySelector('.swiper-button-next');
    const dots = document.querySelectorAll('.swiperP');
    let currentIndex = 0;
    const totalSlides = slides.length;

    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        swiperLine.style.transform = `translateX(-${index * 33.333}%)`;
        currentIndex = index;
        updateDots();
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));
    nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    function autoSlide() {
        goToSlide(currentIndex + 1);
    }

    let slideInterval = setInterval(autoSlide, 5000); // 每5秒自動切換

    swiperLine.addEventListener('mouseenter', () => clearInterval(slideInterval));
    swiperLine.addEventListener('mouseleave', () => {
        slideInterval = setInterval(autoSlide, 4000);
    });

    updateDots();
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
                    <div class="noContentLine">
                        <h1 class="noContent">尚無符合條件的專案</h1>
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
