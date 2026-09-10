# 鏈愛 ChainLove

> 結合區塊鏈智能合約的公益募款平台，透過區塊鏈技術提升募款流程的透明度與資金流向可信度。

## 專案介紹

**鏈愛（ChainLove）** 是一個以公益募款為核心的 Web 平台，提供使用者瀏覽募款專案、搜尋與分類專案、查看專案資訊以及進行捐款等功能。

本專案嘗試將傳統募款平台與 **Blockchain / Smart Contract** 結合，透過 Ethereum 智能合約管理募款金額、募款期限與資金轉移，希望降低募款過程中的資訊不透明問題。

當募款達到指定條件時，智能合約可依設定自動將資金轉移至指定錢包，同時保留鏈上交易紀錄，以提升公益募款的透明度。

---

## 核心功能

### 公益募款專案

平台提供多種類型的公益募款專案，例如：

* 老人
* 科技
* 天災
* 學生
* 飢荒
* 環境
* 兒童
* 醫療

使用者可以透過關鍵字搜尋與分類功能尋找感興趣的募款專案。

### 募款專案瀏覽

首頁提供：

* 熱門募款專案
* 專案搜尋
* 進階分類搜尋
* 募款專案詳細資訊
* 專案收藏
* 個人資料與相關功能

### 使用者系統

提供基本會員功能，包括：

* 使用者註冊
* 使用者登入
* 密碼加密儲存
* 使用者資料管理

密碼透過 `bcryptjs` 進行雜湊處理。

### 智能合約募款

每個募款專案可對應 Ethereum 智能合約。

智能合約主要負責：

* 設定募款目標金額
* 設定募款期限
* 接收 ETH 捐款
* 記錄每個地址的捐款金額
* 防止募款金額超過目標
* 超額捐款自動退款
* 達到指定金額時自動轉帳
* 達成募款目標後自動轉移剩餘資金
* 專案擁有者提領合約餘額

### 智能合約自動部署

後端透過 Truffle 建立並部署募款智能合約。

建立募款專案時可以設定：

* Target Wallet
* Target Amount
* Withdraw Amount
* Duration

部署成功後，系統取得 Smart Contract Address 並將合約地址與募款專案資料進行關聯。

### 圖片與檔案管理

專案整合 AWS S3，可用於處理募款專案相關圖片與檔案。

### ETH 匯率

後端串接外部 API 取得：

* ETH → USD
* USD → TWD

讓系統能將 Ethereum 金額轉換成較容易理解的法幣資訊。

---

## 系統架構

```text
User
 │
 ▼
Frontend
HTML / CSS / JavaScript
 │
 │ REST API
 ▼
Node.js + Express
 │
 ├── PostgreSQL
 │
 ├── AWS S3
 │
 ├── Ethereum / Web3
 │
 └── Truffle
       │
       ▼
 Solidity Smart Contract
       │
       ▼
 Ethereum Network
```

---

## 使用技術

### Frontend

* HTML5
* CSS3
* JavaScript
* Fetch API
* LocalStorage

### Backend

* Node.js
* Express.js
* REST API
* bcryptjs
* JSON Web Token
* Multer
* Axios
* WebSocket

### Database

* PostgreSQL

### Cloud Storage

* AWS S3

### Blockchain

* Ethereum
* Solidity
* Web3.js
* Truffle
* Sepolia Testnet

### External API

* CoinGecko API
* Exchange Rate API

---

## 專案結構

```text
chainlove/
│
├── contracts/
│   └── DonationContract.sol
│
├── migrations/
│
├── public/
│   ├── css/
│   ├── images/
│   ├── img/
│   ├── js/
│   ├── video/
│   └── *.html
│
├── test/
│
├── server.js
├── truffle-config.js
├── package.json
├── package-lock.json
└── .gitignore
```

---

## Smart Contract

專案中的主要智能合約為：

```text
contracts/DonationContract.sol
```

合約會記錄：

```solidity
mapping(address => uint256) public donationList;
```

用於保存不同錢包地址的捐款金額。

並透過事件記錄主要操作：

```solidity
event Donate(...)
event Withdraw(...)
event AutoWithdraw(...)
```

當募款達到指定條件時，智能合約可以自動執行資金轉移。

---

## 安裝方式

### 1. Clone Repository

```bash
git clone https://github.com/aa256263/chainlove-.git
```

進入專案：

```bash
cd chainlove-
```

### 2. 安裝套件

```bash
npm install
```

### 3. 設定環境變數

在專案根目錄建立：

```text
.env
```

環境變數包含資料庫與 AWS 等相關設定，例如：

```env
PG_USER=
PG_PASSWORD=
PG_HOST=
PG_PORT=
PG_DATABASE=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

> `.env` 不應上傳至 GitHub。

### 4. 啟動 Server

```bash
npm start
```

Server 會由：

```text
server.js
```

啟動。

---

## 專案特色

本專案最大的特色是將公益募款平台與 Blockchain 技術進行整合。

傳統募款平台的資金流向通常由平台或組織管理，而 ChainLove 將部分募款流程交由 Smart Contract 執行，使募款條件與資金操作可以透過程式規則進行控制。

透過智能合約的：

* 募款目標
* 募款期限
* 捐款紀錄
* 自動轉帳
* 鏈上交易

讓公益募款流程具備更高的透明度與可追蹤性。

---

## 開發目的

此專案希望探索 Blockchain 技術在公益募款情境中的實際應用。

除了完成一般募款平台需要的會員、專案管理、搜尋、資料庫與檔案上傳等功能之外，也嘗試將 Solidity Smart Contract、Ethereum 與 Web3 整合進完整 Web 系統中。

透過此專案實作了從：

**Frontend → Backend → Database → Cloud Storage → Blockchain**

的完整 Web Application 架構。

---

## Repository

GitHub：

https://github.com/aa256263/chainlove-

---

## Author

**Xu Jia Yao / 許家耀**

Information Management
