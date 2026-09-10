document.addEventListener("DOMContentLoaded", function() {
  const projectId = new URLSearchParams(window.location.search).get('id');
  document.getElementById('details-btn').onclick = function() {
    window.location.href = `../cashdetails.html?id=${projectId}`;
}


  // 查詢捐款記錄
  fetch(`/api/project-donations/${projectId}`)
  .then(response => response.json())
  .then(data => {
      const donationContainer = document.querySelector('.one');
      donationContainer.innerHTML = '';

      // 計算需要顯示的資料筆數
      const displayCount = Math.min(data.length, 7);

      // 遍歷並顯示每筆捐款記錄
      for (let i = 0; i < displayCount; i++) {
          const donation = data[i];
          const itemDiv = document.createElement('div');
          itemDiv.className = 'item';
          itemDiv.innerHTML = `
              <img src="./images/img.png" />
              <div class="id">${donation.username}</div>
              <div class="number">${Number(donation.amount).toLocaleString()}</div>
          `;
          donationContainer.appendChild(itemDiv);
      }

      // 確保顯示"顯示更多"的按鈕
      const moreDiv = document.createElement('div');
      moreDiv.className = 'item';
      moreDiv.innerHTML = `
          <img src="./images/more.png" />
          <div class="id">顯示<br>更多</div>
          <div class="number"></div>
      `;
      moreDiv.addEventListener('click', () => {
          window.location.href = `./donorlist.html?id=${projectId}`;
      });
      donationContainer.appendChild(moreDiv);
  })
  .catch(error => {
      console.error('Error fetching donation records:', error);
  });


  // 查詢累積的智能合約金額
  fetch(`/api/project-cumulative-amount/${projectId}`)
      .then(response => response.json())
      .then(data => {
          document.getElementById('money').innerText = `${Number(data.cumulative_amount).toLocaleString()}(TWD)`;
      })
      .catch(error => {
          console.error('Error fetching cumulative amount:', error);
      });

  // 查詢項目方的圖片和累積金額
  fetch(`/api/project-details/${projectId}`)
  .then(response => response.json())
  .then(data => {
      const imgElement = document.getElementById('projectImage');
      const amountElement = document.getElementById('amount');

      if (data && imgElement) {
          const projectImage =  data.project_image1 ;
          const cumulativeAmount = data.cumulative_amount;
          amountElement.innerText = `${Number(cumulativeAmount).toLocaleString()}(TWD)`;

        
          
          // 設置圖片src
          imgElement.src = projectImage;

          // 設置錯誤處理，避免無限循環報錯
         
      } else {
          console.error('Project details are null or undefined, or image element not found.');
      }
  })
  .catch(error => {
      console.error('Error fetching project details:', error);
  });


  fetch(`/api/project-expenses/${projectId}`)
  .then(response => response.json())
  .then(data => {
      console.log(data);  // 檢查API返回的數據

      const expenseItems = document.querySelectorAll('.four .item');

      expenseItems.forEach(item => {
          const typeElement = item.querySelector('.btn');
          const amountElement = item.querySelector('div:nth-child(3)');
          const expense = data.find(exp => exp.expense_title === typeElement.textContent.trim());

          if (expense) {
              // 更新對應金額
              amountElement.textContent = Number(expense.total_amount).toLocaleString() || '未知金額';
          } else {
              // 如果沒有資料，顯示0
              amountElement.textContent = '0';
          }
      });
  })
  .catch(error => {
      console.error('Error fetching expense data:', error);
  });



});

