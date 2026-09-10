document.addEventListener("DOMContentLoaded", function () {
    const userString = localStorage.getItem("user");
    const user = JSON.parse(userString);
    const userId = user.id;

    function fetchUserInfo(userId) {
        fetch(`/donation-record`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        })
          .then((response) => response.json())
          .then((data) => {
            const donationContainer = document.querySelector('.donation-records');
            donationContainer.innerHTML = '';  // 清空之前的內容

            if (data && data.length > 0) {
              data.forEach(donation => {
                const projectCard = document.createElement('div');
                projectCard.classList.add('project_card');
                
                // 設置整個div為可點擊的並跳轉
                projectCard.onclick = function() {
                  window.location.href = `/detail.html?id=${donation.project_id}`;
                };

                projectCard.innerHTML = `
                  <img src="${donation.project_image1}" id="project_img_main" alt="Project Image" />
                  <div class="donationInfo">
                    <h1 class="donationInfoTitle" id="project_name">${donation.project_name}</h1>
                    <div class="donationInfoLine">
                      捐款金額：
                      <span id="donation_amount">${donation.amount}</span>
                      
                    </div>
                    <div class="donatedate">捐款日期：${new Date(donation.donation_date).toLocaleDateString()}</div>
                    <button type="button" class="button" onclick="window.open('https://sepolia.etherscan.io/tx/${donation.transaction_hash}', '_blank'); event.stopPropagation();">查看詳情</button>
                  </div>
                `;

                donationContainer.appendChild(projectCard);
              });
            } else {
              // 處理沒有捐款紀錄的情況
              const projectCard = document.createElement('div');
                projectCard.classList.add('resultCard');
                projectCard.innerHTML = `
              <div class="noContentLine">
                        <p class=" noContent">目前沒有捐款紀錄</p>
                    </div>
              `;
                donationContainer.appendChild(projectCard);
            }
          })
          .catch((error) => {
            console.error('Error fetching donation records:', error);
          });
      }

      fetchUserInfo(userId);
  });
