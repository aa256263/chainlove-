document.addEventListener("DOMContentLoaded", function() {
    const projectId = new URLSearchParams(window.location.search).get('id');

    // 查詢累積金額和里程碑的詳細資料
    fetch(`/api/project-cumulative-amount/${projectId}`)
        .then(response => response.json())
        .then(project => {
            const milestoneContentDiv = document.querySelector('.milestone-content');
            milestoneContentDiv.innerHTML = "";

            // 格式化目標金額描述
            const formattedTargetCostText = project.target1_cost_text.split('\n').map(paragraph => {
                if (paragraph.trim()) {
                    return `\u3000\u3000${paragraph}`;  // 每段開頭加上兩個全形空格
                }
                return '';  // 保留空行
            }).join('<br>');  // 用 <br> 進行換行

            // 判斷是否已達標
            let statusText = project.cumulative_amount >= project.target1_cost ? '已達標' : '未達標';
//(${Number(project.cumulative_amount).toLocaleString()} / ${Number(project.target1_cost).toLocaleString()}) 
            // 顯示募款金額（累計金額 / 目標金額）
            const milestoneHTML = `
                <div class="milestone-section">                
                    <h2>募款進度<span class="status achieved">${statusText}</span></h2>
                    <h3 class="milestone-title">${project.target1_cost_title}</h3>
                    <p class="milestone-expected">${formattedTargetCostText}</p>
                </div>
            `;
            milestoneContentDiv.innerHTML += milestoneHTML;

            // 查詢里程碑更新資料
            fetch(`/api/showmilestones/details/${projectId}`)
                .then(response => response.json())
                .then(milestone => {
                    // 如果尚未上傳，顯示「未上傳」
                    let executionHTML;
                    if (milestone.is_approved) {

                        const formattedTargetCostText1 = milestone.milestone_content.split('\n').map(paragraph => {
                            if (paragraph.trim()) {
                                return `\u3000\u3000${paragraph}`;  // 每段開頭加上兩個全形空格
                            }
                            return '';  // 保留空行
                        }).join('<br>');

                        executionHTML = `
                            <div class="milestone-section">
                                <h2>執行結果 <span class="status uploaded">已上傳</span></h2>
                                <p class="milestone-completed">${formattedTargetCostText1}</p>
                            </div>
                            <div class="milestone-section">
                                <h2>證明圖片</h2>
                                <div class="proof-images">
                                    <img src="${milestone.milestone_image1}" alt="" class="proof-image">
                                    <img src="${milestone.milestone_image2}" alt="" class="proof-image">
                                    <img src="${milestone.milestone_image3}" alt="" class="proof-image">
                                </div>
                            </div>
                        `;
                    } else {
                        executionHTML = `
                            <div class="milestone-section"> 
                                <h2>執行結果 <span class="status uploaded">未上傳</span></h2>
                                <p class="milestone-completed">尚無內容</p>
                            </div>
                        `;
                    }

                    milestoneContentDiv.innerHTML += executionHTML;
                })
                .catch(error => console.error('Error fetching milestone details:', error));
        })
        .catch(error => console.error('Error fetching project details:', error));
});
