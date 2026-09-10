document.addEventListener("DOMContentLoaded", async function () {
  const userString = localStorage.getItem("user");
  const loggedInView = document.getElementById("loggedInView");
  const loggedOutView = document.getElementById("loggedOutView");
  const manageButton = document.getElementById("manage");

  if (userString) {
    const user = JSON.parse(userString);
    const userId = user.id;

    loggedInView.classList.remove("hidden");
    loggedOutView.classList.add("hidden");

    fetchUserInfo(userId);

    // 查詢用戶是否有專案
    try {
      const response = await fetch(`/api/whether-user-projects/${userId}`);
      const projects = await response.json();

      // 如果用戶沒有專案，隱藏管理專案按鈕
      if (projects.length === 0) {
        manageButton.style.display = 'none';
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  } else {
    loggedInView.classList.add("hidden");
    loggedOutView.classList.remove("hidden");
  }
});


function fetchUserInfo(userId) {
  fetch(`/user-info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        document.getElementById("username").innerText = data.username;
        document.getElementById("email").innerText = data.email;
        document.getElementById("total-donations").innerText +=
          data.total_donation;
      } else {
        console.error("No data found");
      }
    })
    .catch((error) => {
      console.error("Failed to load user info and total donations:", error);
      alert("Failed to load user info and total donations.");
    });
}

document.getElementById("logoutBtn").addEventListener("click", function () {
  // 清除 localStorage 中的用戶資訊
  localStorage.removeItem("user");

  // 重導向至登入頁面
  window.location.href = "../index.html";
});

document.getElementById("donation-record").addEventListener("click", function () {
  // 清除 localStorage 中的用戶資訊
  

  // 重導向至登入頁面
  window.location.href = "../donationinfo.html";
});


