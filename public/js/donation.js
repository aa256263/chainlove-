window.onload = function () {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.id : 0; // 未登入時設為 0
  console.log('userId:', userId);
  document.getElementById("userId").value = userId; 
}



document.addEventListener('DOMContentLoaded', async function() {
    // 這裡是所有 DOM 元素已經加載完畢的情況下執行的代碼
    const urlParams = new URLSearchParams(window.location.search);
    const currentProjectId = urlParams.get('id');
    const selectElement = document.getElementById('projectSelect');
    const contractInputElement = document.getElementById('contract');

    if (!selectElement || !contractInputElement) {
        console.error('Select element or contract input element not found');
        return;
    }

    try {
        const response = await fetch('/api/approved-projects');
        const projects = await response.json();

        const projectHashMap = {};

        let currentProjectOption;
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.project_id;
            option.textContent = project.project_name;

            projectHashMap[project.project_id] = project.contract_hash;

            if (project.project_id == currentProjectId) {
                currentProjectOption = option;
            } else {
                selectElement.appendChild(option);
            }
        });

        if (currentProjectOption) {
            selectElement.insertBefore(currentProjectOption, selectElement.firstChild);
            selectElement.value = currentProjectId;
            contractInputElement.value = projectHashMap[currentProjectId];
        }

        selectElement.addEventListener('change', function() {
            const selectedProjectId = selectElement.value;
            contractInputElement.value = projectHashMap[selectedProjectId] || 'N/A';
        });

        // 在這裡，確保在 contract 的值已經設置之後，再取值
        const contractdetail = contractInputElement.value;
        // 現在 contractAddress 的值應該是已經被設置過的 contractdetail
        const contractAddress = contractdetail;

        console.log(`Contract Address: ${contractAddress}`);

        // 您的後續代碼

    } catch (error) {
        console.error('Error fetching approved projects:', error);
    }
});


