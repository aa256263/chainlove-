document.addEventListener("DOMContentLoaded", () => {
    window.onload = getLocation;

    const userLatitude = localStorage.getItem('userLatitude');
    const userLongitude = localStorage.getItem('userLongitude');

    if (userLatitude && userLongitude) {
        console.log('從 localStorage 獲取的經緯度:', userLatitude, userLongitude);
        loadLocations(userLatitude, userLongitude);
    } else {
        console.error('無法從 localStorage 獲取經緯度');
    }

    
});


        let userLatitude, userLongitude;

        // 獲取當前位置
        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    userLatitude = position.coords.latitude;
                    userLongitude = position.coords.longitude;
                    loadLocations();
                });
            } else {
                alert("您的瀏覽器不支援地理位置功能");
            }
        }

        // 計算距離的函數（Haversine公式）
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371; // 地球半徑，單位公里
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // 回傳距離，單位公里
        }

        // 加載所有捐款箱位置
       // 加載所有捐款箱位置
       async function loadLocations() {
        const response = await fetch('/api/locations');
        const locations = await response.json();
    
        const locationList = document.getElementById('nearby-projects-container');
        locationList.innerHTML = ''; // 清空列表
    
        let index = 0;
        let hasLocation = false;
    
        function addLocation() {
            if (index < locations.length) {
                const location = locations[index];
                const distance = calculateDistance(userLatitude, userLongitude, location.latitude, location.longitude).toFixed(3);
    
                const locationElement = `
                    <div class="resultCard">
                    <img src="${location.box_photo}" alt="" />
                        <div class="resultInfo">
                        
                            <div class="listTitle">
                                <h1>${location.location_name}</h1>
                            </div>
                            <div class="resultProgressMsg">
                                <div class="info_container">
                                    <div class="distance">距離你 <span>${distance}</span> 公里</div>
                                </div>
                                <div class="button_container">
                                    <button type="button" onclick="window.location.href = '../index.html';" class="button_ok">專案頁面</button>
                                    <button type="button" id="button_map" class="button_ok">地圖上顯示</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    
                locationList.innerHTML += locationElement;
                index++;
                hasLocation = true;
    
                // 使用 requestAnimationFrame 讓瀏覽器在下次繪製時更新 DOM
                requestAnimationFrame(addLocation);
            }
        }
    
        requestAnimationFrame(addLocation);
    
        // 如果没有找到任何位置，則顯示 "尚無符合條件的專案"
        setTimeout(() => {
            if (!hasLocation && !document.querySelector('.noContent')) { // 檢查頁面上是否已經顯示該訊息
                const noLocationElement = `
                <div class="resultCard">
                    <div class="noContentLine">
                            <h1 class="noContent">尚無符合條件的專案</h1>
                        </div>
                </div>
                `;
                locationList.innerHTML += noLocationElement;
            }
        }, 500); // 給一些延遲時間來確保 addLocation 被執行完
    }
    




