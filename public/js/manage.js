const userString = localStorage.getItem("user");
const user = JSON.parse(userString);
const userId = user.id;

fetch(`/api/user-projects/${userId}`)
    .then(response => response.json())
    .then(projects => {
        const projectsContainer = document.getElementById("container");
        projectsContainer.innerHTML = ''; // 清空容器

        projects.forEach((project) => {
            const projectCard = document.createElement("div");
            projectCard.classList.add("project-card");

            // 只處理已通過的項目
            if (project.is_approved && project.has_been_reviewed) {
                projectCard.innerHTML = `
                    <div class="project_card">
                        <img src="${project.project_image1}" id="project_img_main" alt="" />
                        <div class="informationLine">
                            <h1 class="informationTitle" id="project_name">${project.project_name}</h1>
                            <span >已通過</span>
                            <span id="project_status_${project.project_id}">金額：載入中...</span>
                            <button class="button" onclick="window.location.href = '../loading.html?id=${project.project_id}'">更新進度</button>
                        </div>
                    </div>
                `;

                // 使用 API 查詢累積金額和目標金額
                fetch(`/api/project-cumulative-amount/${project.project_id}`)
                    .then(response => response.json())
                    .then(data => {
                        const projectStatusElement = document.getElementById(`project_status_${project.project_id}`);

                        // 更新累積金額和目標金額
                        projectStatusElement.textContent = `金額：${Number(data.cumulative_amount).toLocaleString()}/${Number(project.target1_cost).toLocaleString()}`;
                    })
                    .catch(error => {
                        console.error(`Error fetching cumulative amount for project ${project.project_id}:`, error);
                        document.getElementById(`project_status_${project.project_id}`).textContent = "金額：無法載入";
                    });
            } else if (!project.is_approved && project.has_been_reviewed) {
                projectCard.innerHTML = `
                    <div class="project_card">
                        <img src="${project.project_image1}" id="project_img_main" alt="" />
                        <div class="informationLine">
                            <h1 class="informationTitle" id="project_name">${project.project_name}</h1>
                            <span id="project_status">未通過</span>
                            <button class="button">更新審核資料</button>
                        </div>
                    </div>
                `;
            } else if (!project.is_approved && !project.has_been_reviewed) {
                projectCard.innerHTML = `
                    <div class="project_card">
                        <img src="${project.project_image1}" id="project_img_main" alt="" />
                        <div class="informationLine">
                            <h1 class="informationTitle" id="project_name">${project.project_name}</h1>
                            <span id="project_status">未審核</span>
                            <button class="button" disabled>更新審核資料</button>
                        </div>
                    </div>
                `;
            }

            projectsContainer.appendChild(projectCard);
        });
    })
    .catch(error => console.error('Error loading projects:', error));


