window.onload = function () {

    const projectId = new URLSearchParams(window.location.search).get("id");
    
    document.getElementById("news").addEventListener("click", function () {

        window.location.href = "../news.html?id=" + projectId;
  
      }) 
      document.getElementById("milestone").addEventListener("click", function () {
  
        window.location.href = "../milestone.html?id=" + projectId;
  
      }) 
      document.getElementById("upcost").addEventListener("click", function () {
  
        window.location.href = "../upcost.html?id=" + projectId;
  
      }) 
  
  };