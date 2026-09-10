async function loadNewUnapprovedMilestones() {
    try {
        const response = await fetch('/new-unapproved-milestones');
        const milestones = await response.json();
        const milestoneIdSelect = document.getElementById('milestoneId');
        milestoneIdSelect.innerHTML = '';  // 清空現有選項
        const container = document.getElementById('milestoneContainer');
        container.innerHTML = '';
        milestones.forEach(milestone => {
            const option = document.createElement('option');
            option.value = milestone.milestone_id;
            option.textContent = milestone.milestone_id;
            milestoneIdSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading new unapproved milestones:', error);
    }
}

async function fetchMilestone() {
    const milestoneId = document.getElementById('milestoneId').value;
    if (!milestoneId) {
        alert("Please select a milestone ID.");
        return;
    }

    try {
        const response = await fetch(`/api/milestones/details/${milestoneId}`);
        const milestone = await response.json();
        
        

        const container = document.getElementById('milestoneContainer');
        container.innerHTML = `
        <div>
            <h3>${milestone.project_name || 'N/A'}</h3>
            <table>
                
                <tr><td><strong>里程碑內容:</strong></td><td>${milestone.milestone_content}</td></tr>
                <tr>
                    <td><strong>里程碑相關圖片1:</strong></td>
                    <td><img src="${milestone.milestone_image1}" alt="Milestone Image 1"></td>
                </tr>
                <tr>
                    <td><strong>里程碑相關圖片2:</strong></td>
                    <td><img src="${milestone.milestone_image2}" alt="Milestone Image 2"></td>
                </tr>
                <tr>
                    <td><strong>里程碑相關圖片3:</strong></td>
                    <td><img src="${milestone.milestone_image3}" alt="Milestone Image 3"></td>
                </tr>
            </table>
            <button onclick="approveMilestone('${milestoneId}')" style="background-color: #007bff; color: white; margin-right: 10px;">通過</button>
            <button onclick="rejectMilestone('${milestoneId}')" style="background-color: #dc3545; color: white;">不通過</button>
        </div>`;
    } catch (error) {
        console.error('Failed to fetch milestone details:', error);
        alert('Failed to fetch milestone details.');
    }
}

async function approveMilestone(milestoneId) {
    const response = await fetch(`/approve-milestone/${milestoneId}`, { method: 'POST' });
    if (response.ok) {
        alert("里程碑通過");
        loadNewUnapprovedMilestones();  // 再次加載未審核的里程碑，更新列表
    } else {
        alert("Failed to approve milestone.");
    }
}

async function rejectMilestone(milestoneId) {
    const response = await fetch(`/reject-milestone/${milestoneId}`, { method: 'POST' });
    if (response.ok) {
        alert("里程碑不通過");
        loadNewUnapprovedMilestones();  // 再次加載未審核的里程碑，更新列表
    } else {
        alert("Failed to reject milestone.");
    }
}

// 初始化加載未審核的里程碑
document.addEventListener("DOMContentLoaded", function() {
    loadNewUnapprovedMilestones();
});
