
document.addEventListener("DOMContentLoaded", async function () {
  
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("projectId");

  try {
    
    const response = await fetch(`/api/projects/details/${projectId}`);
    const project = await response.json();
    fillFormData(project);
    
  } catch (error) {
    console.error("Failed to load project details:", error);
  }



  function fillFormData(project) {
    document.getElementById("project_name").value = project.project_name;
   
    document.getElementById("user_id").value = project.user_id;
    document.getElementById("project_code").value = project.project_code;
    document.getElementById("project_agency").value = project.project_agency;
    document.getElementById("project_address").value = project.project_address;
    document.getElementById("project_tag").value = project.project_tag;
    document.getElementById("project_summary").value = project.project_summary;
    document.getElementById("project_content").value = project.project_content;
    document.getElementById("total_cost").value = project.total_cost;
    document.getElementById("target1_cost").value = project.target1_cost;
    document.getElementById("target1_cost_text").value =
      project.target1_cost_text;
    document.getElementById("target2_cost").value = project.target2_cost;
    document.getElementById("target2_cost_text").value =
      project.target2_cost_text;
    document.getElementById("project_img1").src = project.project_image1;
    document.getElementById("project_costcontent").value =
      project.project_costcontent;
    const deadline = new Date(project.deadline);
    const formattedDeadline = deadline.toISOString().slice(0, 10); // 將日期格式化為 YYYY-MM-DD
    document.getElementById("deadline").value = formattedDeadline;

    // Disable form if project has been reviewed
    if (project.project_proofimg_image) {
      const proofImg = document.createElement('img');
      proofImg.src = project.project_proofimg_image;
      proofImg.alt = "項目證明圖片";
      proofImg.style.width = '20%'; // 或其他適合的尺寸
      document.getElementById('proofImgContainer').appendChild(proofImg);
  }

  // 處理專案圖片
  if (project.project_image1) {
      const img1 = document.createElement('img');
      img1.src = project.project_image1;
      img1.alt = "專案圖片";
      img1.style.width = '20%'; // 或其他適合的尺寸
      document.getElementById('img1Container').appendChild(img1);
  }

    // Disable form if project has been reviewed
    if (project.has_been_reviewed) {
      disableForm();
    }
  }



  document.getElementById('project_proofimg').addEventListener('change', function(event) {
    updateImageDisplay(event.target.files[0], 'proofImgContainer');
});

document.getElementById('project_img1').addEventListener('change', function(event) {
    updateImageDisplay(event.target.files[0], 'img1Container');
});
document.getElementById('updateButton').addEventListener('click', async () => {
    const form = document.getElementById('updateForm');
    const formData = new FormData(form);
    formData.append('has_been_reviewed', false);

    const response = await fetch(`/update-project/${projectId}`, { // 假定更新API是這樣的URL
        method: 'POST',
        body: formData,
    });

    const result = await response.json(); // 假設服務器返回的是JSON數據

    // 檢查是否更新成功
    if (result.success) {
        alert('資料更新成功');
        window.location.href = "../manage.html"; // 或其他合適的頁面
    } else {
        alert('資料更新失敗: ' + result.message);
    }
});
function updateImageDisplay(file, containerId) {
    if (!file) {
        return; // 如果沒有文件被選擇，則不執行任何操作
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; // 清空現有的圖片
        const newImg = document.createElement('img');
        newImg.src = e.target.result; // 將讀取到的圖片作為新的 src
        newImg.style.width = '20%'; // 或其他適合的尺寸
        container.appendChild(newImg);
    };
    reader.readAsDataURL(file); // 讀取文件內容並將其轉換為 Data URL
}

function toggleFormDisabled(isReviewed) {
  const formElements = document.querySelectorAll("#uploadForm input, #uploadForm select, #uploadForm textarea");
  formElements.forEach(element => {
      element.disabled = isReviewed;  // 如果已審核，禁用元素
  });
}

});