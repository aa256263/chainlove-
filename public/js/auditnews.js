async function loadNewUnapprovedProjects() {
    try {
        const response = await fetch('/new-unapproved-projects');
        const projects = await response.json();
        const projectIdSelect = document.getElementById('projectId');
        projectIdSelect.innerHTML = '';  // 清空現有選項
        const container = document.getElementById('projectContainer');
        container.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.project_id;
            projectIdSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading new unapproved projects:', error);
    }
}

async function fetchNewProject() {
    const projectId = document.getElementById('projectId').value;
    if (!projectId) {
        alert("Please enter a project ID.");
        return;
    }

    try {
        const response = await fetch(`/api/newsprojects/details/${projectId}`);
        const project = await response.json();
        const container = document.getElementById('projectContainer');
        container.innerHTML = `
        <div>
            <h3>${project.project_name || 'N/A'}</h3>
            <table>
                <tr><td><strong>新聞名稱:</strong></td><td>${project.news_name}</td></tr>
                <tr><td><strong>新聞內容:</strong></td><td>${project.news_article}</td></tr>
                <tr>
                    <td><strong>新聞相關圖片:</strong></td>
                    <td><img src="${project.news_imagepath1 || ''}" alt="Project Image"></td>
                </tr>
                <tr><td><strong>新聞發布時間:</strong></td><td>${project.news_update_time || 'N/A'}</td></tr>
            </table>
            <button onclick="approveNewProject('${projectId}')" style="background-color: #007bff; color: white; margin-right: 10px;">通過</button>
            <button onclick="rejectNewProject('${projectId}')" style="background-color: #dc3545; color: white;">不通過</button>
        </div>`;
    } catch (error) {
        console.error('Failed to fetch project details:', error);
        alert('Failed to fetch project details.');
    }
}

async function approveNewProject(projectId) {
    const response = await fetch(`/approve-new-project/${projectId}`, { method: 'POST' });
    if (response.ok) {
        alert("新文章通過");
        loadNewUnapprovedProjects();  // 再次加載未審核的新項目，更新列表
    } else {
        alert("Failed to approve new project.");
    }
}

async function rejectNewProject(projectId) {
    const response = await fetch(`/reject-new-project/${projectId}`, { method: 'POST' });
    if (response.ok) {
        alert("新文章不通過");
        loadNewUnapprovedProjects();  // 再次加載未審核的新項目，更新列表
    } else {
        alert("Failed to reject new project.");
    }
}

// 初始化加載未審核的新項目
document.addEventListener("DOMContentLoaded", function() {
    loadNewUnapprovedProjects();
});
