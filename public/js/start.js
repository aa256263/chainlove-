document.getElementById('loginbtn').addEventListener('click', function() {
    

    // 重導向至登入頁面
    window.location.href = '../login.html';
});
document.getElementById('rgbtn').addEventListener('click', function() {
    // 假設你存儲 token 使用 localStorage
    
    window.location.href = '../register.html'; // 重導向至登入頁面
});