window.onload = function () {
    const newsid = new URLSearchParams(window.location.search).get("id");
    fetch('/news-detail', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ newsid }),
    })
    .then((response) => response.json())
    .then((projects) => {
        const projectsContainer = document.getElementById("approved-projects-container");
        projectsContainer.innerHTML = ""; // 清空現有內容
  
        projects.forEach((project) => {
            const projectCard = document.createElement("div");
            const image = document.getElementById('newsimage');
            const time = new Date(project.news_update_time).toLocaleDateString(); // 先轉換為 Date 對象
            image.src = project.news_imagepath1;
            projectCard.classList.add("update"); 
  
            // 將文章內容按段落拆分，並在每個段落開頭加兩個全形空格
            const paragraphs = project.news_article.split('\n');
            const formattedArticle = paragraphs.map(paragraph => {
                // 段落不應該是空行才加空格
                if (paragraph.trim()) {
                    return `\u3000\u3000${paragraph}`;
                }
                return ''; // 空行保持不變
            }).join('<br>'); // 將段落用 <br> 連接起來
  
            projectCard.innerHTML = `
                <h1>${project.news_name}</h1>        
                <h3>上傳時間:<span>${time}</span></h3>       
                <p>${formattedArticle}</p>
                
            `;
            projectsContainer.appendChild(projectCard);
        });
    })
    .catch((error) => console.error("Failed to fetch project details:", error));
  };
  