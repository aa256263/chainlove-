async function fetchProject() {
    const projectId = document.getElementById('projectId').value;
    if (!projectId) {
        alert("Please enter a project ID.");
        return;
    }

    const response = await fetch(`/api/projects/details/${projectId}`);
    const project = await response.json();

    // 獲取匯率
    const ethToUsdResponse = await fetch('/api/eth-price');
    const ethToUsdData = await ethToUsdResponse.json();
    const ethToUsd = ethToUsdData.ethPrice;

    const usdToTwdResponse = await fetch('/api/usd-to-twd');
    const usdToTwdData = await usdToTwdResponse.json();
    const usdToTwd = usdToTwdData.usdToTwd;

    // 計算TWD轉換為ETH的值
    const finalCostInEth = convertTwdToEth(project.final_cost, ethToUsd, usdToTwd);
    const target1CostInEth = convertTwdToEth(project.target1_cost, ethToUsd, usdToTwd);

    // 計算剩餘天數
    const daysLeft = calculateDaysLeft(new Date(project.project_final_date));
    
    const container = document.getElementById('projectContainer');
    container.innerHTML = `
    <div>
        <h3 id="projectName">${project.project_name}</h3>
        <div>
            <label>發起人區塊聯錢包碼:</label>
            <input type="text" id="targetWallet" name="targetWallet" value="${project.creation_hash}" readonly>
        </div>
        <div>
            <label>衛服部活動許可文號:</label>
            <input type="text" id="projectCode" value="${project.project_code}" readonly>
        </div>
        <div>
            <label>機構名稱:</label>
            <input type="text" id="projectAgency" value="${project.project_agency}" readonly>
        </div>
        <div>
            <label>機構地址:</label>
            <input type="text" id="projectAddress" value="${project.project_address}" readonly>
        </div>
        <div>
            <label>標籤:</label>
            <input type="text" id="projectTag" value="${project.project_tag}" readonly>
        </div>
        <div>
            <label>專案內容:</label>
            <input type="text" id="projectContent" value="${project.project_content}" readonly>
        </div>
        <div>
            <label>最終目標金額 (TWD):</label>
            <input type="text" id="finalCost" value="${project.final_cost}" readonly>
        </div>
        <div>
            <label>轉換為 ETH:</label>
            <input type="text" id="targetAmount" name="targetAmount" value="${finalCostInEth}" readonly>
        </div>
        <div>
            <label>里程碑目標金額 (TWD):</label>
            <input type="text" id="target1Cost" value="${project.target1_cost} TWD" readonly>
        </div>
        <div>
            <label>轉換為 ETH:</label>
            <input type="text" id="withdrawAmount" name="withdrawAmount" value="${target1CostInEth}" readonly>
        </div>
        <div>
            <label>里程碑標題:</label>
            <input type="text" id="target1CostTitle" value="${project.target1_cost_title}" readonly>
        </div>
        <div>
            <label>里程碑內容:</label>
            <input type="text" id="target1CostText" value="${project.target1_cost_text}" readonly>
        </div>
        <div>
            <label>截止日期:</label>
            <input type="text" id="projectFinalDate" value="${new Date(project.project_final_date).toLocaleDateString()}" readonly>
        </div>
        <div>
            <label>剩餘天數:</label>
            <input type="text" id="durationInDays" name="durationInDays" value="${daysLeft}" readonly>
        </div>
        <div>
            <label>合約地址:</label>
            <input type="text" id="contract-address" value="尚未生成" readonly>
        </div>
        <div>
            <label>證明圖片:</label>
            <img id="proofImage" src="${project.project_proofimg_image}" alt="Proof Image">
        </div>
        <div>
            <label>專案相關圖片:</label>
            <img id="projectImage1" src="${project.project_image1}" alt="Project Image 1">
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button type="button" onclick="approveProject('${project.project_id}')" style="background-color: #007bff; color: white; margin-right: 10px;">通過</button>
            <button type="button" onclick="rejectProject('${project.project_id}')" style="background-color: #dc3545; color: white;">不通過</button>
        </div>
    </div>`;
}

// 計算TWD轉換為ETH
function convertTwdToEth(twdAmount, ethToUsd, usdToTwd) {
    const usdAmount = twdAmount / usdToTwd; // TWD轉USD
    const ethAmount = usdAmount / ethToUsd; // USD轉ETH
    return ethAmount.toFixed(0); // 保留6位小數
}

// 計算剩餘天數
function calculateDaysLeft(finalDate) {
    const currentDate = new Date();
    const timeDiff = finalDate - currentDate; // 毫秒差
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // 轉換為天數
    return daysLeft >= 0 ? daysLeft : 0; // 如果過期則顯示0
}



async function approveProject(projectId) {
    const targetWallet = document.getElementById('targetWallet').value;
    const targetAmount = document.getElementById('targetAmount').value;
    const withdrawAmount = document.getElementById('withdrawAmount').value;
    const durationInDays = document.getElementById('durationInDays').value;
    const contractAddressElement = document.getElementById('contract-address');
    const projectName = document.getElementById('projectName').textContent; 
    try {
        // 發送部署請求到後端
        const deployResponse = await fetch('/deploy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                targetWallet,
                targetAmountInEther: targetAmount,
                withdrawAmountInEther: withdrawAmount,
                durationInDays
            }),
        });

        if (deployResponse.ok) {
            const deployResult = await deployResponse.json();

            if (deployResult.contractAddress) {
                contractAddressElement.value = deployResult.contractAddress;
                
                // 更新項目合約地址到後端
                const updateResponse = await fetch(`/update-project-contract/${projectId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contractAddress: deployResult.contractAddress
                    }),
                });

                if (updateResponse.ok) {
                    // 合約部署成功且合約地址更新成功後，進行專案的審核通過操作
                    const approveResponse = await fetch(`/approve-project/${projectId}`, { method: 'POST' });
                    if (approveResponse.ok) {
                        loadUnapprovedProjects();  // 再次加載未批准的項目，更新列表
                        alert("項目通過，合約已成功部署。");
                        const notificationText = `${projectName} 已上線，攜手共創美好未來！`;
                        await fetch('/api/notifications/send-to-all', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                notification_title: '最新專案',
                                notification_text: notificationText,
                                notification_type: 3
                            })
                        });
                    } else {
                        alert("項目通過操作失敗，請重試。");
                    }
                } else {
                    alert("更新合約地址失敗，請重試。");
                }
            } else {
                alert("合約部署成功，但未返回合約地址。");
            }

        } else {
            alert("合約部署失敗，請重試。");
        }

    } catch (error) {
        console.error('Error during contract deployment and project approval:', error);
        alert("項目通過失敗。");
    }
}



async function rejectProject(projectId) {
    const response = await fetch(`/reject-project/${projectId}`, { method: 'POST' });
    if (response.ok) {
        alert("項目不通過");
        loadUnapprovedProjects();  // 再次加載未批准的項目，更新列表
    } else {
        alert("Failed to reject project.");
    }
}


function loadUnapprovedProjects() {
    fetch('/unapproved-projects')
        .then(response => response.json())
        .then(data => {
            const projectIdSelect = document.getElementById('projectId');
            projectIdSelect.innerHTML = '';  // 清除現有選項
            const container = document.getElementById('projectContainer');
            container.innerHTML = '';
            data.forEach(project => {
                const option = document.createElement('option');
                option.value = project.project_id;
                option.textContent = project.project_id;
                projectIdSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading unapproved projects:', error));
}
