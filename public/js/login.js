document.getElementById('loginbtn').addEventListener('click', function(event) {
  const account = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!account || !password) {
    alert('請輸入電子郵件和密碼');
    return;
  } else if (!emailPattern.test(account)) {
    alert('請輸入有效的電子郵件地址');
    return;
  } else if (password.length < 8) {
    alert('密碼必須至少8位數');
    return;
  }

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account, password }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    alert(data.message); // 顯示來自服務器的消息
    if (data.redirect) {
      // 特殊處理 admin 登入
      window.location.href = data.redirect;
    } else if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/index.html'; // 成功後重定向到主頁
    } else {
      console.error('Login failed:', data.message); // 登入失敗的處理
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
});
