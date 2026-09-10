document.addEventListener("DOMContentLoaded", function() {
    loadNewUnapprovedCosts();
});

async function loadNewUnapprovedCosts() {
    try {
        const response = await fetch('/new-unapproved-costs');
        const costs = await response.json();
        const costIdSelect = document.getElementById('costId');
        costIdSelect.innerHTML = '';  // 清空現有選項
        const Container = document.getElementById('costContainer');
        Container.innerHTML = '';  // 清空現有選項
        costs.forEach(cost => {
            const option = document.createElement('option');
            option.value = cost.cost_id;
            option.textContent = cost.cost_id;
            costIdSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading new unapproved costs:', error);
    }
}

async function fetchCost() {
    const costId = document.getElementById('costId').value;
    if (!costId) {
        alert("Please select a cost ID.");
        return;
    }

    try {
        const response = await fetch(`/api/costs/details/${costId}`);
        const cost = await response.json();
        
        if (!cost.expense_title && !cost.expense) {
            alert("Failed to fetch cost details.");
            return;
        }

        const container = document.getElementById('costContainer');
        container.innerHTML = `
        <div>
            <h3>${cost.project_name || 'N/A'}</h3>
            <table>
                <tr><td><strong>Stage:</strong></td><td>${cost.expense_title || 'N/A'}</td></tr>
                <tr><td><strong>Current Cost:</strong></td><td>${cost.expense || 'N/A'}</td></tr>               
                <tr><td><strong>PDF:</strong></td><td>${cost.expense_proof_path ? `<a href="${cost.expense_proof_path}" target="_blank">下載證明文件</a>` : 'N/A'}</td></tr>
            </table>
            <button onclick="approveCost('${costId}')" style="background-color: #007bff; color: white; margin-right: 10px;">通過</button>
            <button onclick="rejectCost('${costId}')" style="background-color: #dc3545; color: white;">不通過</button>
        </div>`;
    } catch (error) {
        console.error('Failed to fetch cost details:', error);
        alert('Failed to fetch cost details.');
    }
}

async function approveCost(costId) {
    const response = await fetch(`/approve-cost/${costId}`, { method: 'POST' });
    if (response.ok) {
        alert("金流更新通過");
        loadNewUnapprovedCosts();  // 再次加載未審核的金流更新，更新列表
    } else {
        alert("Failed to approve cost.");
    }
}

async function rejectCost(costId) {
    const response = await fetch(`/reject-cost/${costId}`, { method: 'POST' });
    if (response.ok) {
        alert("金流更新不通過");
        loadNewUnapprovedCosts();  // 再次加載未審核的金流更新，更新列表
    } else {
        alert("Failed to reject cost.");
    }
}

// 初始化加載未審核的金流更新
document.addEventListener("DOMContentLoaded", function() {
    loadNewUnapprovedCosts();
});
