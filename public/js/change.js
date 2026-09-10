let ethToUsdRate;
let usdToTwdRate;

// 加载并存储汇率数据
async function loadRates() {
    try {
        const ethResponse = await fetch('/api/eth-price');
        const ethData = await ethResponse.json();
        ethToUsdRate = ethData.ethPrice;

        const twdResponse = await fetch('/api/usd-to-twd');
        const twdData = await twdResponse.json();
        usdToTwdRate = twdData.usdToTwd;
    } catch (error) {
        console.error('Error fetching rates:', error);
    }
}

// 台幣轉換成ETH
function convertTwdToEth() {
    let twdInput = document.getElementById('donationAmountTWD');
    let twdValue = parseFloat(twdInput.value);
    if (isNaN(twdValue) || twdValue === 0) {
        twdInput.value = '0';
        document.getElementById('donationAmount').value = '0';
    } else if (ethToUsdRate && usdToTwdRate) {
        // 防止输入01, 02等情况
        if (twdInput.value.startsWith('0') && twdInput.value.length > 1) {
            twdInput.value = twdInput.value.substring(1);
        }
        const twdToEth = twdValue / (usdToTwdRate * ethToUsdRate);
        document.getElementById('donationAmount').value = twdToEth.toFixed(6);
    }
}

// ETH轉換成台幣
function convertEthToTwd() {
    let ethInput = document.getElementById('donationAmount');
    let ethValue = parseFloat(ethInput.value);
    if (isNaN(ethValue) || ethValue === 0) {
        ethInput.value = '0';
        document.getElementById('donationAmountTWD').value = '0';
    } else if (ethToUsdRate && usdToTwdRate) {
        // 防止输入01, 02等情况
        if (ethInput.value.startsWith('0') && ethInput.value.length > 1) {
            ethInput.value = ethInput.value.substring(1);
        }
        const ethToTwd = ethValue * (usdToTwdRate * ethToUsdRate);
        document.getElementById('donationAmountTWD').value = ethToTwd.toFixed(2);
    }
}

// 初始加载汇率
loadRates();
