document.addEventListener("DOMContentLoaded", async function() {
    const projectId = new URLSearchParams(window.location.search).get('id');

    try {
        // 取得累積金額和合約地址
        const cumulativeResponse = await fetch(`/api/project-cumulative-amount/${projectId}`);
        const { cumulative_amount, contract_hash,target1_cost,final_cost } = await cumulativeResponse.json();
        document.getElementById('targetamount').textContent =Number(cumulative_amount).toLocaleString()+"/" +Number(target1_cost).toLocaleString()+"元";
        document.getElementById('finalamount').textContent = Number(cumulative_amount).toLocaleString()+"/" +Number(final_cost).toLocaleString()+"元";

        // 取得合約地址
        

        // 階段目標顯示控制
        
        // 更新轉帳紀錄的鏈接
        const etherscanLink1 = document.getElementById('targetlink');
        etherscanLink1.href = `https://sepolia.etherscan.io/address/${contract_hash}#internaltx`;
         // 更新轉帳紀錄的鏈接
         const etherscanLink2 = document.getElementById('finallink');
         etherscanLink2.href = `https://sepolia.etherscan.io/address/${contract_hash}`;

        // 取得各項開銷的詳細資料

    } catch (error) {
        console.error('Error fetching project data:', error);
    }
    async function handleExpense(type, amountElementSelector, proofContainerSelector) {
        try {
            // 查詢不同開銷類型的花費資料
            const expenseResponse = await fetch(`/api/project-${type}-expense/${projectId}`);
            const expenseData = await expenseResponse.json();

            const amountElement = document.querySelector(amountElementSelector);
            const proofContainer = document.querySelector(proofContainerSelector);

            if (expenseData) {
                // 更新累積金額
                amountElement.textContent = Number(expenseData.total_amount).toLocaleString();

                // 清空原有的證明連結
                proofContainer.innerHTML = '';

                // 生成證明紀錄的連結或顯示 "無"
                if (expenseData.total_amount === 0 && (!expenseData.expense_proofs || expenseData.expense_proofs.length === 0)) {
                    // 如果金額為 0 且沒有證明紀錄，顯示 "無"
                    proofContainer.innerHTML = '<p>證明紀錄 <a class="linknone">無</a></p>';
                } else if (expenseData.expense_proofs && Array.isArray(expenseData.expense_proofs)) {
                    // 生成證明紀錄的連結
                    expenseData.expense_proofs.forEach(proof => {
                        if (proof && proof.trim() !== '') {
                            const proofLink = document.createElement('p');
                            proofLink.innerHTML = `證明紀錄 <a class="link" href="${proof}" target="_blank">IPFS</a>`;
                            proofContainer.appendChild(proofLink);
                        }
                    });
                }
            } else {
                console.error(`No expense records found for ${type}.`);
            }
        } catch (error) {
            console.error(`Error fetching ${type} expense details:`, error);
        }
    }

    // 處理 "物資" 的邏輯
    await handleExpense('supply', '#supply .amount', '#supply .proof1');

    // 處理 "人力" 的邏輯
    await handleExpense('manpower', '#manpower .amount', '#manpower .proof2');

    // 處理 "資助" 的邏輯
    await handleExpense('fund', '#fund .amount', '#fund .proof3');
});
