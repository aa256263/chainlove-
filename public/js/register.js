document
  .getElementById("registerBtn")
  .addEventListener("click", function (event) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const account = document.getElementById("account").value;   
    const confirm_password = document.getElementById("confirm_password").value; 
    if (username === "" || password === "" || account === "" || confirm_password === "")
      {
        alert("請輸入完整資訊");//改彈窗
        event.preventDefault();
        
    }
    else if (!emailPattern.test(account)) {
      alert('請輸入有效的電子郵件地址');
      
     
        event.preventDefault();
  }
  else if(password.length < 8) 
  {
    alert('密碼必須至少8位數');
    event.preventDefault();
  }
    
  else{
    fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, account, password, confirm_password }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        if (data.message === "註冊成功") {
          window.location.href = "/login.html"; // 註冊成功後跳轉到登入頁面
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });

  }

    
  });

