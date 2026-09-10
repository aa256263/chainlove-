document.addEventListener("DOMContentLoaded", async function() {
    const userString = localStorage.getItem("user");
    const user = JSON.parse(userString);
    const userId = user.id;
    const projectId = new URLSearchParams(window.location.search).get("id");
    const projectInput = document.getElementById("project_id");
    const projectNameInput = document.getElementById("project_name");

    if (projectInput) {
        projectInput.value = projectId;
    }

    if (projectId) {
        try {
            const response = await fetch(`/api/project-name/${projectId}`);
            const data = await response.json();
            if (data.projectName) {
                projectNameInput.value = data.projectName;
            } else {
                alert('找不到項目名稱');
            }
        } catch (error) {
            console.error('Error fetching project name:', error);
            alert('無法獲取項目名稱');
        }
    }

    
  
  const amountInput = document.getElementById('expense');
  const proofInput = document.getElementById('proof');
  const imagePreview = document.getElementById('imagePreview');

  // 金額格式化
  amountInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      e.target.value = new Intl.NumberFormat('en-US').format(value);
  });

  // 圖片上傳預覽和大小檢查
  imagePreview.addEventListener('click', function() {
      proofInput.click();
  });

  proofInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { // 檢查文件大小
              alert('圖片大小不能超過5MB');
              proofInput.value = ''; // 清空文件輸入
              imagePreview.innerHTML = '<img src="images/add-image.png" alt="上傳圖片"><span>點擊上傳圖片</span>';
              return;
          }
          const reader = new FileReader();
          reader.onload = function(e) {
              imagePreview.innerHTML = `<img src="${e.target.result}" alt="預覽圖片">`;
          }
          reader.readAsDataURL(file);
      }
  });

  // 獲取已通過審核的專案
  
});

document.getElementById('submitButton').addEventListener('click', async () => {
  const form = document.querySelector('.upload-form');
  const formData = new FormData(form);

  // 移除金額中的逗號
  formData.set('expense', formData.get('expense').replace(/,/g, ''));

  const response = await fetch('/update-cost', {
      method: 'POST',
      body: formData,
  });

  const result = await response.json();

  if (result.success) {
      alert('資料上傳成功');
      window.location.href = "../manage.html";
  } else {
      alert('資料上傳失敗: ' + result.message);
  }
});
