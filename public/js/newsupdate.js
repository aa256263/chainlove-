window.onload = function () {
  const projectId = new URLSearchParams(window.location.search).get("id");
  fetch('/news', {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({ projectId }),
  })
  .then((response) => response.json())
  .then((projects) => {
      const projectsContainer = document.getElementById("approved-projects-container");
      projectsContainer.innerHTML = ""; // 清空現有內容

      if (projects.length === 0) {
          const noContent = document.createElement("div");
          noContent.classList.add("resultCard");
          noContent.innerHTML = `
              <div class="noContentLine">
                  <p class=" noContent">尚無進度更新</p>
              </div>
          `;
          projectsContainer.appendChild(noContent);
      } else {
          projects.forEach((project) => {
              const projectCard = document.createElement("div");
              const time = new Date(project.news_update_time).toLocaleDateString();
              projectCard.classList.add("project-card"); 
              projectCard.innerHTML = `
              <div class="resultCard">
                  <img src="${project.news_imagepath1}" alt="" />
                  <div class="informationLine" onclick="window.location.href='../newsdetail.html?id=${project.news_id}'">
                      <h1 class="informationTitle">${project.news_name}</h1>
                      <p class="informationCntent">上傳時間:${time}</p>
                  </div>
              </div>
              `;
              projectsContainer.appendChild(projectCard);
          });
      }
  })
  .catch((error) => console.error("Failed to fetch project details:", error));
};
