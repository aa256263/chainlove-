// 將您的合約ABI粘貼到這裡
const contractABI =[
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_targetWallet",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_targetAmountInEther",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_withdrawAmountInEther",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_durationInDays",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "targetWallet",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "contractBalance",
          "type": "uint256"
        }
      ],
      "name": "AutoWithdraw",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "contractBalance",
          "type": "uint256"
        }
      ],
      "name": "Donate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Withdraw",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback",
      "payable": true
    },
    {
      "inputs": [],
      "name": "deadline",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "donationList",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "targetAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "targetWallet",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "totalDonations",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "withdrawAmount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "stateMutability": "payable",
      "type": "receive",
      "payable": true
    },
    {
      "inputs": [],
      "name": "donate",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function",
      "payable": true
    },
    {
      "inputs": [],
      "name": "getHistory",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "withdraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]




// 您的合約地址
//const contractAddress = "0x8F66ADdBA67dCaE4AE77f5A73CDb39D032b9B29c"; // 替換為您的合約地址

let web3;
let contract;
let accounts;


  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const MMSDK = new MetaMaskSDK.MetaMaskSDK({
    dappMetadata: {
        name: "Donate",
        url: window.location.href,
    },
    infuraAPIKey: "def88e68d5704312941eeb29d74af216",  // 請用你的 Infura API Key 替換
});

  async function connectToWallet_v2() {
    try {


        

        // 清除已連接的帳戶狀態，讓 MetaMask 每次都要求重新連接
        //const ethereum = window.ethereum;
        const ethereum = MMSDK.getProvider();

        if (!ethereum) {
            throw new Error("無法獲取 MetaMask 提供者");
        }

        // 重設 Ethereum 提供者，並強制要求 MetaMask 彈出授權提示
        await ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }]
        });
        console.log("Connected account:","12233");

        // 請求連接錢包

         const accounts = await ethereum.request({ method: "eth_requestAccounts", params: [] });
         console.log("Connected account:","123");
        // if (accounts.length === 0) {
        //     throw new Error("未找到任何錢包帳戶");
        // }
        

        // 顯示已連接的錢包地址
        document.getElementById("wallet").value = accounts[0];
        console.log("Connected account:", accounts[0]);

    } catch (error) {
        console.error("連接失敗: ", error);
        
    } 
}

  


// 連接MetaMask
async function connectWallet() {
  const checktype=document.getElementById('contract').value;
    console.log(checktype);
    const contractAddress = checktype;
    if (isMobile) {
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        web3 = new Web3(window.ethereum);
        try {
            // 請求帳戶訪問權限
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            // 實例化合約
            document.getElementById("wallet").value = accounts;
            contract = new web3.eth.Contract(contractABI, contractAddress);
            console.log('Connected:', accounts);
        } catch (error) {
            console.error("User denied account access", error);
        }
      } else {
          alert("將在 MetaMask 應用程式內打開此 DApp");

          // 直接使用未編碼的 DApp 網址
          var currentUrl = window.location.href;
          window.location.href = "https://metamask.app.link/dapp/"+currentUrl;
      }
  } else {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      try {
          // 請求帳戶訪問權限
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          // 實例化合約
          document.getElementById("wallet").value = accounts;
          contract = new web3.eth.Contract(contractABI, contractAddress);
          console.log('Connected:', accounts);
      } catch (error) {
          console.error("User denied account access", error);
      }
  } else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
  }
}

 





// 捐款功能
async function donate() {
  

  const amountInEth = document.getElementById('donationAmount').value;
  
  const contractAddress=document.getElementById('contract').value;
                
  const ethereum = MMSDK.getProvider();
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  // 創建 ethers.js 提供者
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, provider);
  const userId = document.getElementById('userId').value;
  const currentProjectId= document.getElementById('projectSelect').value;
  const walletAddress = document.getElementById('wallet').value; // 從已連接的 MetaMask 獲取錢包地址
  const amountInTwd = document.getElementById('donationAmountTWD').value;

  if (!contract) {
    console.log('Contract is not initialized');
    return;
}
  if (!walletAddress) {
    alert("請輸入錢包地址！");
    return;
        }

  if (amountInEth==0|| !amountInEth) {
    console.log('Please enter a donation amount');
    return;
  }
  // 顯示 loading 動畫
  
  document.getElementById('loadingModal').style.display = 'flex';  
 
   try {

    const tx = {
      to: contractAddress, // 合約地址
      value: ethers.utils.parseUnits(amountInEth, "ether") // 發送 0.1 ETH
        };   

      // 發送交易
      console.log('正在發送交易...');
      const txResponse = await signer.sendTransaction(tx);
      console.log('交易已發送，交易 hash:', txResponse.hash);


      // 監控合約的 Donate 事件
      await contract.on("Donate", async (sender, value, contractBalance, event) => {
        console.log(`捐款事件觸發！ 捐款者: ${sender}, 金額: ${ethers.utils.formatEther(value)} ETH`);

        

        // 判斷事件中的 sender 是否等於輸入的錢包地址
        if (sender.toLowerCase() === walletAddress.toLowerCase()) {
          //存捐款人資料
          await fetch('/api/donate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId, // 使用全局變量中的 userId
                project_id: currentProjectId, // 使用動態更新的 project_id
                amount: amountInTwd,
                donater_wallet_hash: walletAddress,
                transaction_hash: event.transactionHash,
            }),
        });


      //存通知

      const response = await fetch('/api/project-name/' + currentProjectId);
      const projectData = await response.json();
      const projectName = projectData.projectName;
      

      await fetch('/api/notifications', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              user_id: userId,
              project_id: currentProjectId,
              notification_title: '捐款成功',
              notification_text: `感謝您為${projectName}捐款了${amountInTwd}元`,
              
          }),
      });



        //動畫
            document.getElementById('loadingModal').style.display = 'none';
            document.getElementById('successModal').style.display = 'flex';

            setTimeout(() => {
                document.getElementById('successModal').style.display = 'none';
            }, 3000);
            setTimeout(() => {
                window.location.href = "../index.html";//等待3秒後跳轉到首頁
            }, 3000);
        } 
    });

      
      

  } catch (error) {
    console.error("交易失敗:", error);
    document.getElementById('loadingModal').style.display = 'none';
    document.getElementById('errorModal').style.display = 'flex';

    // 3秒後隱藏 error 動畫
    setTimeout(() => {
        document.getElementById('errorModal').style.display = 'none';
    }, 3000);
}
}



// 事件監聽器
document.getElementById('connectButton').addEventListener('click', connectToWallet_v2);
document.getElementById('donateButton').addEventListener('click', donate);

