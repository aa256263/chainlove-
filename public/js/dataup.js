window.onload = function () {
    const userString = localStorage.getItem("user");
    const user = JSON.parse(userString);
    const userId=user.id;

    const userIdElement = document.getElementById("user_id");
    userIdElement.value=userId;
    
    
}
document.getElementById('connect').addEventListener('click', function(event) {
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
  } else {
      alert('Please install MetaMask!');
  }
  if (window.ethereum) {
    window.ethereum.request({ method: 'eth_requestAccounts' })
    .then(function(accounts) {
        // 賬戶成功連接後，您可以獲取用戶賬戶地址
        const account = accounts[0];
        console.log('Connected account:', account);
        document.getElementById("connect_wallet").value=account;
        
    })
    .catch(function(error) {
        console.error('User denied account access or error occurred:', error);
    });
  } else {
    alert('Please install MetaMask!');
  }
  
    
});
document.getElementById('submitButton').addEventListener('click', async (event) => {
    const connectWalletInput = document.getElementById("connect_wallet");
    connectWalletInput.disabled = false;
    const requiredFields = [
        'project_name', 
        'project_code', 
        'project_agency', 
        'project_address', 
        'project_tag', 
        'project_content', 
        'total_cost', 
        'milestone_title', 
        'milestone_target_cost', 
        'milestone_cost_text', 
        'deadline', 
        'connect_wallet'
    ];

    const requiredFiles = [
        'project_img1',
        'project_proofing'
    ];
    
    let allFilled = true;
    let validDate = true;
    let validMilestoneCost = true;

    // 檢查所有必填文字欄位
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value || field.value.trim() === '') {
            allFilled = false;
            field.style.borderColor = 'red';  // Optional: highlight the missing fields
        } else {
            field.style.borderColor = '';  // Reset border color if filled
        }
    });

    // 檢查所有必填圖片欄位
    requiredFiles.forEach(fileId => {
        const fileInput = document.getElementById(fileId);
        if (fileInput.files.length === 0) {
            allFilled = false;
            fileInput.nextElementSibling.style.borderColor = 'red';  // Optional: highlight the missing fields
        } else {
            fileInput.nextElementSibling.style.borderColor = '';  // Reset border color if filled
        }
    });

    // 檢查日期欄位
    const deadlineField = document.getElementById('deadline');
    const selectedDate = new Date(deadlineField.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 將時間部分設為午夜，確保只比較日期

    if (selectedDate < today) {
        validDate = false;
        deadlineField.style.borderColor = 'red';
        alert('專案截止日期不能小於今天日期');
        return;  // Stop form submission
    } else {
        deadlineField.style.borderColor = '';  // Reset border color if filled
    }

    // 檢查里程碑目標金額不大於總金額的一半
    const totalCost = parseFloat(document.getElementById('total_cost').value);
    const milestoneTargetCost = parseFloat(document.getElementById('milestone_target_cost').value);

    if (milestoneTargetCost > totalCost ) {
        validMilestoneCost = false;
        document.getElementById('milestone_target_cost').style.borderColor = 'red';
        alert('里程碑目標金額不能大於最終目標金額');
        return;  // Stop form submission
    } else {
        document.getElementById('milestone_target_cost').style.borderColor = '';  // Reset border color if filled
    }

    if (!allFilled || !validDate || !validMilestoneCost) {
        alert('請填寫所有必填欄位並確保所有條件符合要求');
        return;  // Stop form submission
    }
    

    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);

    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json(); // 假設服務器返回的是JSON數據

    // 檢查是否上傳成功並返回了圖片的URL
    if (result.message === '項目和圖片上傳成功') {
        alert('資料上傳成功');
        connectWalletInput.disabled = true;

        




        window.location.href = "../index.html";
    } else {
        connectWalletInput.disabled = true;
        alert('資料上傳失敗: ' + result.message);
    }
    
});


document.addEventListener('DOMContentLoaded', function () {
    const uploadInputs = document.querySelectorAll('input[type="file"]');

    uploadInputs.forEach(input => {
        input.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const imgElement = input.previousElementSibling;
                    if (imgElement && imgElement.tagName === 'IMG') {
                        imgElement.src = e.target.result;
                        
                        
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    });
});


