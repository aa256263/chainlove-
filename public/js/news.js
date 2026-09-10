document.getElementById('project_image').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const imagePreview = document.getElementById('imagePreview');
          imagePreview.innerHTML = `<img src="${e.target.result}" alt="新聞圖片預覽">`;
      };
      reader.readAsDataURL(file);
  }
});

document.addEventListener("DOMContentLoaded", function() {
  // 從localStorage中獲取用戶信息
  const userString = localStorage.getItem("user");
  const user = JSON.parse(userString);
  const userId = user.id;
  const projectId = new URLSearchParams(window.location.search).get("id");
  const projectInput = document.getElementById("project_id");
  if (projectInput) {
      projectInput.value = projectId;
  }

  // 向後端發送請求以獲取已通過審核的專案
});

document.getElementById('projectUpdateNewsForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const projectImage = document.getElementById('project_image').files.length;
  const projectName = document.getElementById('projectudNews_name').value;
  const projectContent = document.getElementById('projectud_article').value;

  // 檢查是否上傳了圖片
  if (projectImage === 0) {
      alert('請上傳圖片');
      return;
  }

  // 檢查標題名稱是否為空
  if (!projectName.trim()) {
      alert('標題名稱不能為空');
      return;
  }

  // 檢查更新內容是否大於10個字
  if (projectContent.length < 10) {
      alert('更新內容需大於10個字');
      return;
  }

  const form = document.getElementById('projectUpdateNewsForm');
  const formData = new FormData(form);

  const response = await fetch('/update-news', {
      method: 'POST',
      body: formData,
  });

  const result = await response.json();

  if (result.success) {
      alert('新聞提交成功');
      window.location.href = "../manage.html";
  } else {
      alert('新聞提交失敗: ' + result.message);
  }
});
