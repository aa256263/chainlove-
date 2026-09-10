function previewImage(input, previewId, nextLabelId) {
    const file = input.files[0];
    const previewContainer = document.getElementById(previewId);

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = ''; // 清空之前的預覽
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('image-preview-img');
            previewContainer.appendChild(img);

            // 顯示下一個上傳框
            const nextLabel = document.querySelector(`label[for=${nextLabelId}]`);
            if (nextLabel) {
                nextLabel.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

document.addEventListener("DOMContentLoaded", function() { 
    const userString = localStorage.getItem("user");
    if (userString) {
        const user = JSON.parse(userString);
        const userId = user.id;
        const projectId = new URLSearchParams(window.location.search).get("id");
        const projectInput = document.getElementById("project_id");
        if (projectInput) {
            projectInput.value = projectId;
        }

        document.getElementById('milestone_proof1').addEventListener('change', function() {
            previewImage(this, 'imagePreview1', 'milestone_proof2');
        });

        document.getElementById('milestone_proof2').addEventListener('change', function() {
            previewImage(this, 'imagePreview2', 'milestone_proof3');
        });

        document.getElementById('milestone_proof3').addEventListener('change', function() {
            previewImage(this, 'imagePreview3');
        });

        const projectUpdateForm = document.getElementById('projectUpdateForm');
        if (projectUpdateForm) {
            projectUpdateForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                // 檢查圖片和文字框
                const proof1 = document.getElementById('milestone_proof1').files.length;
                const proof2 = document.getElementById('milestone_proof2').files.length;
                const proof3 = document.getElementById('milestone_proof3').files.length;
                const newProjectContent = document.getElementById('new_project_content').value;

                if (proof1 + proof2 + proof3 < 3) {
                    alert('請上傳三張圖片');
                    return;
                }

                if (newProjectContent.length < 200) {
                    alert('文字框內容需大於200個字');
                    return;
                }

                const formData = new FormData(projectUpdateForm);

                const response = await fetch('/update-mile', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (result.success) {
                    alert('更新提交成功');
                    window.location.href = "../manage.html";
                } else {
                    alert('更新提交失敗: ' + result.message);
                }
            });
        }
    } else {
        console.error('User information not found in localStorage');
    }
});
