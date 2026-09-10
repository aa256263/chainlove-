const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const axios = require('axios');
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Client } = require("pg");
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();


// 資料庫
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const caCert = fs.readFileSync('./pathto/ap-southeast-1-bundle.pem').toString();
const upload = multer({ dest: "uploads/" });
const pgClient = new Client({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: true, // 這確保只接受經過認證的連接
    ca: caCert,  // 使用從 .pem 檔案讀取的憑證
  }
});

pgClient.connect();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
//資源設定

// 获取ETH对USD的汇率
const getEthToUsd = async () => {
  const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
  return response.data.ethereum.usd;
};

// 获取USD对TWD的汇率
const getUsdToTwd = async () => {
  const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
  return response.data.rates.TWD;
};
//建立合約
app.post('/deploy', (req, res) => {
  const { targetWallet, targetAmountInEther, withdrawAmountInEther, durationInDays } = req.body;

  console.log('Received deployment request with data:', { targetWallet, targetAmountInEther, withdrawAmountInEther, durationInDays });

  const deployScript = `
const DonationContract88 = artifacts.require("DonationContract88");

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(DonationContract88, "${targetWallet}", ${targetAmountInEther}, ${withdrawAmountInEther}, ${durationInDays});
};
`;

  const deployScriptPath = path.join(__dirname, 'migrations', '2_deploy_donation_contract.js');
  fs.writeFile(deployScriptPath, deployScript, (err) => {
      if (err) {
          console.error('Failed to write deploy script:', err);
          return res.status(500).json({ message: 'Failed to update deploy script.' });
      }

      console.log('Deploy script written successfully.');

      // 運行 truffle migrate 命令
      exec('truffle migrate --network sepolia', (err, stdout, stderr) => {
          if (err) {
              console.error('Error during contract deployment:', err);
              return res.status(500).json({ message: 'Failed to deploy contract.' });
          }

          console.log('Truffle migrate stdout:', stdout);
          console.error('Truffle migrate stderr:', stderr);

          // 提取合約地址
          const contractAddressMatch = stdout.match(/contract address:\s+(\S+)/);

          // 部署成功後，刪除 deploy script 並回傳部署結果
          fs.unlink(deployScriptPath, (unlinkErr) => {
              if (unlinkErr) {
                  console.error('Failed to delete deploy script:', unlinkErr);
                  return res.status(500).json({ message: 'Failed to delete deploy script.' });
              }

              const responseMessage = 'Deploy script updated and contract deployed successfully.';
              const responseWithAddress = contractAddressMatch ? `${responseMessage}\ncontract address: ${contractAddressMatch[1]}` : responseMessage;

              console.log('Returning response:', responseWithAddress);
              res.status(200).json({
                  message: responseMessage,
                  contractAddress: contractAddressMatch ? contractAddressMatch[1] : null,
              });
          });
      });
  });
});



//合約進資料庫
app.post('/update-project-contract/:projectId', async (req, res) => {
  const projectId = req.params.projectId;
  const { contractAddress } = req.body;

  try {
      const result = await pgClient.query(
          'UPDATE Project SET contract_hash = $1 WHERE project_id = $2 RETURNING project_id',
          [contractAddress, projectId]
      );

      if (result.rowCount > 0) {
          res.json({ message: 'Contract address updated successfully' });
      } else {
          res.status(404).json({ message: 'Project not found' });
      }
  } catch (error) {
      console.error('Error updating contract address:', error);
      res.status(500).json({ message: 'Failed to update contract address' });
  }
});





// 處理註冊請求
app.post("/register", async (req, res) => {
  const { username, account, password, confirm_password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  if (password !== confirm_password) {
    return res.json({ message: "密碼和確認密碼不匹配。" });
  }

  try {
    // 檢查使用者名稱是否已存在
    const emailCheck = await pgClient.query(
      "SELECT * FROM users WHERE email = $1",
      [account]
    );
    if (emailCheck.rows.length > 0) {
      return res.json({ message: "電子郵件已存在" });
    }

    // 插入新使用者
    const result = await pgClient.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, account, hashedPassword]
    );
    res.json({
      message: "註冊成功",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "註冊失敗" });
  }
});

// 查詢項目名稱的 API
app.get('/api/project-name/:projectId', async (req, res) => {
  const projectId = req.params.projectId;
  try {
      const result = await pgClient.query(
          'SELECT project_name FROM project WHERE project_id = $1',
          [projectId]
      );
      if (result.rows.length > 0) {
          res.json({ projectName: result.rows[0].project_name });
      } else {
          res.status(404).json({ error: 'Project not found' });
      }
  } catch (error) {
      console.error('Error fetching project name:', error);
      res.status(500).json({ error: 'Server error' });
  }
});


// 處理登入請求
app.post("/login", async (req, res) => {
  const { account, password } = req.body;
  if (account === "admin@gmail.com" && password === "admin12345") {
    // 當帳號和密碼都是 admin 時，返回特殊消息
    return res.json({ message: "Admin Login", redirect: "/getdata.html" });
  }
  try {
    const result = await pgClient.query(
      "SELECT * FROM users WHERE email = $1",
      [account]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        res.json({
          success: true,
          message: "Login successful",
          user: { id: user.user_id, username: user.username },
        });
      } else {
        res.json({ success: false, message: "Password is incorrect" });
      }
    } else {
      res.json({ success: false, message: "Email does not exist" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error logging in user" });
  }
});



// 搜尋專案名稱
app.get("/search-projects", async (req, res) => {
  const searchTerm = req.query.q;

  try {
    const sqlQuery = `
      SELECT 
        p.project_id, 
        p.project_name, 
        pi.project_image1, 
        COALESCE(SUM(d.amount), 0) AS cumulative_amount,  -- 動態計算累計捐款金額
        p.final_cost,
        COALESCE(SUM(d.amount), 0) / p.final_cost AS donation_ratio,  -- 計算捐款比例
        COUNT(DISTINCT d.user_id) AS donor_count,  -- 計算捐款人數
        p.project_final_date
      FROM 
        project p
      JOIN 
        ProjectImage pi ON p.project_id = pi.project_id
      LEFT JOIN 
        donate d ON p.project_id = d.project_id
      WHERE 
        p.project_name ILIKE $1 
        AND p.is_approved = true
      GROUP BY 
        p.project_id, 
        pi.project_image1, 
        p.final_cost
    `;
    const result = await pgClient.query(sqlQuery, [`%${searchTerm}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error("Failed to search projects:", error);
    res.status(500).json({ error: "Server error" });
  }
});



//新聞項目列表
app.post("/news", async (req, res) => {
  try {
    const { projectId } = req.body;

    const result = await pgClient.query(
      "SELECT * FROM NewsUpdate WHERE  is_approved=true AND has_been_reviewed = true AND project_id = $1",
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch project details:", error);
    res.status(500).send("Server error");
  }
});
//新聞細節
app.post("/news-detail", async (req, res) => {
  try {
    const { newsid } = req.body;

    const result = await pgClient.query(
      "SELECT * FROM NewsUpdate WHERE news_id = $1",
      [newsid]
    );
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Failed to fetch project details:", error);
    res.status(500).send("Server error");
  }
});
//項目細節
app.get("/api/projectdetails/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.query.userId;

  if (!projectId || isNaN(Number(projectId))) {
      return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
      const sqlQuery = `
          SELECT 
              p.*, 
              pi.project_proofimg_image, 
              pi.project_image1,
              COALESCE(SUM(d.amount), 0) AS cumulative_amount,  -- 計算累計捐款金額
              p.final_cost,
              p.project_content,
              COALESCE(SUM(d.amount), 0) / p.final_cost AS donation_ratio,  -- 計算捐款比例
              COUNT(DISTINCT d.user_id) AS donor_count,
              (CASE WHEN b.project_id IS NOT NULL THEN true ELSE false END) AS bookmarked,
              (CASE WHEN mu.has_been_reviewed = true AND mu.is_approved = true THEN true ELSE false END) AS milestone_uploaded,
              nu.News_id AS latest_news_id,
              nu.News_name AS latest_news_title,
              nu.news_article AS latest_news_content,
              nu.News_imagepath1 AS latest_news_image,
              nu.News_update_time AS latest_news_uptime,
              (CASE WHEN nu.has_been_reviewed = true AND nu.is_approved = true THEN true ELSE false END) AS news_uploaded
          FROM project p
          JOIN ProjectImage pi ON p.project_id = pi.project_id
          LEFT JOIN Bookmark b ON p.project_id = b.project_id AND b.user_id = $1
          LEFT JOIN donate d ON p.project_id = d.project_id
          LEFT JOIN MilestoneUpdate mu ON p.project_id = mu.project_id
          LEFT JOIN (
              SELECT News_id, project_id, News_name, news_article, News_imagepath1, News_update_time, has_been_reviewed, is_approved
              FROM NewsUpdate
              WHERE project_id = $2 AND is_approved=true
              ORDER BY News_update_time DESC
              LIMIT 1
          ) nu ON p.project_id = nu.project_id
          WHERE p.is_approved = true AND p.project_id = $2
          GROUP BY 
              p.project_id, 
              p.project_content,
              pi.project_proofimg_image, 
              pi.project_image1, 
              b.project_id, 
              mu.has_been_reviewed, 
              mu.is_approved, 
              nu.News_id, 
              nu.News_name, 
              nu.news_article, 
              nu.News_imagepath1, 
              nu.News_update_time,
              nu.has_been_reviewed, 
              nu.is_approved;
      `;

      const result = await pgClient.query(sqlQuery, [userId, projectId]);
      const projects = result.rows;

      // 翻譯項目標籤
      for (let project of projects) {
          project.project_tag = translateTag(project.project_tag);
      }

      res.json(projects);
  } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).send("Server error");
  }
});



//上船項目資料
app.post(
  "/upload",
  upload.fields([{ name: "project_img1" }, { name: "project_proofimg" }]),
  async (req, res) => {
    
    try {
      console.log(req.body.connect_wallet);
      const project = await pgClient.query(
        "INSERT INTO project (project_name, user_id, project_code, project_agency, project_address, project_tag, project_content, final_cost, target1_cost_title, target1_cost, target1_cost_text, project_final_date, creation_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING project_id",
        [
          req.body.project_name,
          req.body.user_id,
          req.body.project_code,
          req.body.project_agency,
          req.body.project_address,
          req.body.project_tag,
          req.body.project_content,
          req.body.total_cost,
          req.body.milestone_title,
          req.body.milestone_target_cost,
          req.body.milestone_cost_text,
          req.body.deadline,
          req.body.connect_wallet,
        ]
      );
      const projectId = project.rows[0].project_id;
      const projectProofImg = req.files["project_proofimg"][0];
      const projectImg1 = req.files["project_img1"][0];
      const key = [];
      key[0] = `images/${Date.now()}-${projectProofImg.originalname}`;
      key[1] = `images/${Date.now()}-${projectImg1.originalname}`;

      // 上傳 projectProofImg
      const proofImgResponse = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key[0],
          Body: fs.readFileSync(projectProofImg.path),
          ContentType: "image/jpeg",
        })
      );
      const proofurl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key[0]}`;
      // 上傳 projectImg1
      const img1Response = await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key[1],
          Body: fs.readFileSync(projectImg1.path),
          ContentType: "image/jpeg",
        })
      );
      const img1url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key[1]}`;

      // 插入數據到資料庫
      const insertResponse =
        "INSERT INTO projectimage (project_id,project_proofimg_image, project_image1) VALUES ($1, $2,$3) RETURNING image_id";
      await pgClient.query(insertResponse, [projectId, proofurl, img1url]);

      res.json({
        success: true,
        message: "項目和圖片上傳成功",
        project_id: project.rows[0].project_id,
      });
    } catch (error) {
      console.error("Error uploading data:", error);
      res.status(500).json({ success: false, message: "內部服務器錯誤" });
    }
  }
);

//讀取項目資料
app.get("/api/projects/details/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  if (!projectId || isNaN(Number(projectId))) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const sqlQuery = `
            SELECT p.*, pi.project_proofimg_image, pi.project_image1
            FROM Project p
            LEFT JOIN ProjectImage pi ON p.project_id = pi.project_id
            WHERE p.project_id = $1`;

    const projectDetails = await pgClient.query(sqlQuery, [projectId]);

    if (projectDetails.rows.length > 0) {
      res.json(projectDetails.rows[0]);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    console.error("Failed to retrieve project details:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/approved-projects-updata", async (req, res) => {
  const userId = req.query.userId;

  try {
    const result = await pgClient.query(
      "SELECT project_id, project_name FROM Projects WHERE user_id = $1 AND is_approved = true",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
//幣值換算eth to usd
app.get('/api/eth-price', async (req, res) => {
  try {
      const ethToUsd = await getEthToUsd();
      res.json({ ethPrice: ethToUsd });
  } catch (error) {
      console.error('Error fetching ETH price:', error);
      res.status(500).json({ error: 'Failed to fetch ETH price' });
  }
});
//幣值換算 usd to twd
app.get('/api/usd-to-twd', async (req, res) => {
  try {
      const usdToTwd = await getUsdToTwd();
      res.json({ usdToTwd });
  } catch (error) {
      console.error('Error fetching USD to TWD rate:', error);
      res.status(500).json({ error: 'Failed to fetch USD to TWD rate' });
  }
});

// 加載未獲批准的項目 ID
app.get("/unapproved-projects", async (req, res) => {
  try {
    const result = await pgClient.query(
      "SELECT project_id FROM Project WHERE has_been_reviewed = false"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving unapproved projects", err);
    res.status(500).send("Error retrieving unapproved projects");
  }
});
//通過項目
app.post("/approve-project/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const result = await pgClient.query(
      "UPDATE Project SET is_approved = true, has_been_reviewed = true WHERE project_id = $1",
      [projectId]
    );
    if (result.rowCount > 0) {
      res.send("Project approved successfully");
    } else {
      res.status(404).send("Project not found");
    }
  } catch (err) {
    console.error("Error approving project", err);
    res.status(500).send("Error approving project");
  }
});

//不通過項目
app.post("/reject-project/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  console.log(`Rejecting project with ID: ${projectId}`); // 除錯信息
  try {
    const result = await pgClient.query(
      "UPDATE Project SET is_approved = false, has_been_reviewed = true WHERE project_id = $1",
      [projectId]
    );
    console.log(`Update result: ${result.rowCount}`); // 除錯信息
    if (result.rowCount > 0) {
      res.send("Project rejected successfully");
    } else {
      res.status(404).send("Project not found");
    }
  } catch (err) {
    console.error("Error rejecting project", err);
    res.status(500).send("Error rejecting project");
  }
});
// 加載未審核的新文章
app.get("/new-unapproved-projects", async (req, res) => {
  try {
    const result = await pgClient.query(
      "SELECT News_id AS project_id FROM NewsUpdate WHERE has_been_reviewed = false"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving new unapproved projects", err);
    res.status(500).send("Error retrieving new unapproved projects");
  }
});

// 查詢新文章詳情
app.get("/api/newsprojects/details/:projectId", async (req, res) => {
  const projectId = req.params.projectId;

  if (!projectId || isNaN(Number(projectId))) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const sqlQuery = `
          SELECT 
    project.project_name,
    NewsUpdate.News_name,
    NewsUpdate.news_article,
    NewsUpdate.News_imagepath1,
    NewsUpdate.News_update_time
FROM 
    project
JOIN 
    NewsUpdate
ON 
    project.project_id = NewsUpdate.project_id
WHERE 
    NewsUpdate.News_id = $1;
`;

    const projectDetails = await pgClient.query(sqlQuery, [projectId]);

    if (projectDetails.rows.length > 0) {
      res.json(projectDetails.rows[0]);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    console.error("Failed to retrieve project details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 通過新文章審核
app.post("/approve-new-project/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const result = await pgClient.query(
      "UPDATE NewsUpdate SET is_approved = true, has_been_reviewed = true WHERE News_id = $1",
      [projectId]
    );
    if (result.rowCount > 0) {
      res.send("New project approved successfully");
    } else {
      res.status(404).send("New project not found");
    }
  } catch (err) {
    console.error("Error approving new project", err);
    res.status(500).send("Error approving new project");
  }
});

// 不通過新文章審核
app.post("/reject-new-project/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const result = await pgClient.query(
      "UPDATE NewsUpdate SET is_approved = false, has_been_reviewed = true WHERE News_id = $1",
      [projectId]
    );
    if (result.rowCount > 0) {
      res.send("New project rejected successfully");
    } else {
      res.status(404).send("New project not found");
    }
  } catch (err) {
    console.error("Error rejecting new project", err);
    res.status(500).send("Error rejecting new project");
  }
});

// 加載未審核的里程碑
app.get("/new-unapproved-milestones", async (req, res) => {
  try {
    const result = await pgClient.query(
      "SELECT update_id AS milestone_id FROM MilestoneUpdate WHERE has_been_reviewed = false"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving new unapproved milestones", err);
    res.status(500).send("Error retrieving new unapproved milestones");
  }
});

// 查詢里程碑詳情
app.get("/api/milestones/details/:milestoneId", async (req, res) => {
  const milestoneId = req.params.milestoneId;
  if (!milestoneId || isNaN(Number(milestoneId))) {
    return res.status(400).json({ error: "Invalid milestone ID" });
  }

  try {
    const sqlQuery = `
      SELECT 
    project.project_name,
    MilestoneUpdate.Milestone_content,
    MilestoneUpdate.Milestone_image1,
    MilestoneUpdate.Milestone_image2,
    MilestoneUpdate.Milestone_image3
FROM 
    project
JOIN 
    MilestoneUpdate
ON 
    project.project_id = MilestoneUpdate.project_id
WHERE 
    MilestoneUpdate.update_id = $1;`;

    const milestoneDetails = await pgClient.query(sqlQuery, [milestoneId]);

    if (milestoneDetails.rows.length > 0) {
      res.json(milestoneDetails.rows[0]);
    } else {
      res.status(404).json({ error: "Milestone not found" });
    }
  } catch (error) {
    console.error("Failed to retrieve milestone details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 通過里程碑審核
app.post("/approve-milestone/:milestoneId", async (req, res) => {
  const milestoneId = req.params.milestoneId;
  try {
    const result = await pgClient.query(
      "UPDATE MilestoneUpdate SET is_approved = true, has_been_reviewed = true WHERE update_id = $1",
      [milestoneId]
    );
    if (result.rowCount > 0) {
      res.send("Milestone approved successfully");
    } else {
      res.status(404).send("Milestone not found");
    }
  } catch (err) {
    console.error("Error approving milestone", err);
    res.status(500).send("Error approving milestone");
  }
});

// 不通過里程碑審核
app.post("/reject-milestone/:milestoneId", async (req, res) => {
  const milestoneId = req.params.milestoneId;
  try {
    const result = await pgClient.query(
      "UPDATE MilestoneUpdate SET is_approved = false, has_been_reviewed = true WHERE update_id = $1",
      [milestoneId]
    );
    if (result.rowCount > 0) {
      res.send("Milestone rejected successfully");
    } else {
      res.status(404).send("Milestone not found");
    }
  } catch (err) {
    console.error("Error rejecting milestone", err);
    res.status(500).send("Error rejecting milestone");
  }
});
// 加載未審核的金流更新
app.get("/new-unapproved-costs", async (req, res) => {
  try {
    const result = await pgClient.query(
      "SELECT expenset_id AS cost_id FROM ExpenseUpdate WHERE has_been_reviewed = false"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error retrieving new unapproved costs", err);
    res.status(500).send("Error retrieving new unapproved costs");
  }
});

// 查詢金流更新詳情
app.get("/api/costs/details/:costId", async (req, res) => {
  const costId = req.params.costId;

  if (!costId || isNaN(Number(costId))) {
    return res.status(400).json({ error: "Invalid cost ID" });
  }

  try {
    const sqlQuery = `
          SELECT 
    project.project_name,
    ExpenseUpdate.Expense,
    ExpenseUpdate.Expense_title,
    ExpenseUpdate.Expense_proof_path
FROM 
    project
JOIN 
    ExpenseUpdate
ON 
    project.project_id = ExpenseUpdate.project_id
WHERE 
    ExpenseUpdate.Expenset_id = $1;`;

    const costDetails = await pgClient.query(sqlQuery, [costId]);

    if (costDetails.rows.length > 0) {
      res.json(costDetails.rows[0]);
    } else {
      res.status(404).json({ error: "Cost update not found" });
    }
  } catch (error) {
    console.error("Failed to retrieve cost details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 通過金流更新審核
app.post("/approve-cost/:costId", async (req, res) => {
  const costId = req.params.costId;
  try {
    const result = await pgClient.query(
      "UPDATE ExpenseUpdate SET is_approved = true, has_been_reviewed = true WHERE expenset_id = $1",
      [costId]
    );
    if (result.rowCount > 0) {
      res.send("Cost update approved successfully");
    } else {
      res.status(404).send("Cost update not found");
    }
  } catch (err) {
    console.error("Error approving cost update", err);
    res.status(500).send("Error approving cost update");
  }
});

// 不通過金流更新審核
app.post("/reject-cost/:costId", async (req, res) => {
  const costId = req.params.costId;
  try {
    const result = await pgClient.query(
      "UPDATE ExpenseUpdate SET is_approved = false, has_been_reviewed = true WHERE expenset_id = $1",
      [costId]
    );
    if (result.rowCount > 0) {
      res.send("Cost update rejected successfully");
    } else {
      res.status(404).send("Cost update not found");
    }
  } catch (err) {
    console.error("Error rejecting cost update", err);
    res.status(500).send("Error rejecting cost update");
  }
});

app.get('/api/approved-projects', async (req, res) => {
  try {
      const result = await pgClient.query(
          "SELECT project_id, project_name, contract_hash FROM project WHERE is_approved = true"
      );
      res.json(result.rows);
  } catch (error) {
      console.error("Error fetching approved projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
  }
});


//index已登入畫面資料
app.get("/approved-projects", async (req, res) => {
  let { userId, category } = req.query;

  if (category) {
    category = decodeURIComponent(category);
  }

  let sqlQuery = `
      SELECT 
          p.*, 
          pi.project_proofimg_image, 
          pi.project_image1,
          COALESCE(SUM(d.amount), 0) AS cumulative_amount,  -- 動態計算累計捐款金額
          p.final_cost,
          COALESCE(SUM(d.amount), 0) / p.final_cost AS donation_ratio,  -- 計算捐款比例
          COUNT(DISTINCT d.user_id) AS donor_count,  -- 計算捐款人數
          (CASE WHEN b.project_id IS NOT NULL THEN true ELSE false END) AS bookmarked  -- 判斷是否已收藏
      FROM 
          project p
      JOIN 
          ProjectImage pi ON p.project_id = pi.project_id
      LEFT JOIN 
          Bookmark b ON p.project_id = b.project_id AND b.user_id = $1
      LEFT JOIN 
          donate d ON p.project_id = d.project_id
      WHERE 
          p.is_approved = true
  `;

  const params = [userId];

  if (category && category !== "all") {
    sqlQuery += ` AND p.project_tag = $2`;
    params.push(category);
  }

  sqlQuery += `
      GROUP BY 
          p.project_id, 
          pi.project_proofimg_image, 
          pi.project_image1, 
          p.final_cost, 
          b.project_id
  `;

  try {
    const result = await pgClient.query(sqlQuery, params);
    const projects = result.rows;

    // 翻譯項目標籤
    for (let project of projects) {
      project.project_tag = translateTag(project.project_tag);
    }

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Server error");
  }
});


const tagTranslations = {
  older: "老人",
  technology: "科技",
  naturaldisaster: "天災",
  student: "學生",
  hunger: "飢荒",
  environment: "環境",
  child: "婦幼",
  medical: "疾病",
};

function translateTag(tag) {
  return tagTranslations[tag] || tag; // 如果沒有對應的翻譯，則返回原標籤
}

//index熱門項目
app.get("/top-projects", async (req, res) => {
  const userId = req.query.userId;
  let { category } = req.query;

  if (category) {
    category = decodeURIComponent(category);
  }

  let sqlQuery = `
      SELECT 
          p.*, 
          pi.project_proofimg_image, 
          pi.project_image1,
          COALESCE(SUM(d.amount), 0) AS cumulative_amount,  -- 動態計算累計捐款金額
          p.final_cost,
          COALESCE(SUM(d.amount), 0) / p.final_cost AS donation_ratio,  -- 計算捐款比例
          COUNT(DISTINCT d.user_id) AS donor_count,
          (CASE WHEN b.project_id IS NOT NULL THEN true ELSE false END) AS bookmarked
      FROM 
          project p
      JOIN 
          ProjectImage pi ON p.project_id = pi.project_id
      LEFT JOIN 
          Bookmark b ON p.project_id = b.project_id AND b.user_id = $1
      LEFT JOIN 
          donate d ON p.project_id = d.project_id
      WHERE 
          p.is_approved = true
  `;

  const params = [userId];

  if (category && category !== "all") {
    sqlQuery += ` AND p.project_tag = $2`;
    params.push(category);
  }

  sqlQuery += `
      GROUP BY 
          p.project_id, 
          pi.project_proofimg_image, 
          pi.project_image1, 
          p.final_cost, 
          b.project_id
      ORDER BY 
          donation_ratio DESC
      LIMIT 5
  `;

  try {
    const result = await pgClient.query(sqlQuery, params);
    const projects = result.rows;

    // 翻譯項目標籤
    for (let project of projects) {
      project.project_tag = translateTag(project.project_tag);
    }

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Server error");
  }
});


//index未登入畫面資料
app.get("/unlogin-approved-projects", async (req, res) => {
  let { category } = req.query;

  if (category) {
    category = decodeURIComponent(category);
  }

  let sqlQuery = `
      SELECT 
          p.project_id, 
          p.project_name, 
          p.project_tag,
          pi.project_proofimg_image, 
          pi.project_image1,
          COALESCE(SUM(d.amount), 0) AS cumulative_amount,  -- 動態計算累計捐款金額
          p.target1_cost AS final_cost,  -- 使用專案的目標金額
          COUNT(DISTINCT d.user_id) AS donor_count,  -- 計算捐款人數
          p.project_final_date  -- 額外增加專案的最終日期
      FROM 
          project p
      JOIN 
          ProjectImage pi ON p.project_id = pi.project_id
      LEFT JOIN 
          donate d ON p.project_id = d.project_id
      WHERE 
          p.is_approved = true
  `;

  const params = [];

  if (category && category !== "all") {
    sqlQuery += ` AND p.project_tag = $1`;
    params.push(category);
  }

  sqlQuery += `
      GROUP BY 
          p.project_id, 
          p.project_name, 
          p.project_tag,
          pi.project_proofimg_image, 
          pi.project_image1, 
          p.target1_cost, 
          p.project_final_date
  `;

  try {
    const result = await pgClient.query(sqlQuery, params);
    const projects = result.rows;

    // 翻譯項目標籤
    for (let project of projects) {
      project.project_tag = translateTag(project.project_tag);
    }

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).send("Server error");
  }
});


//收藏項目

app.post("/bookmark", async (req, res) => {
  const { projectId, userId } = req.body;
  try {
    const result = await pgClient.query(
      "INSERT INTO Bookmark (user_id, project_id) VALUES ($1, $2) RETURNING *",
      [userId, projectId]
    );
    res.json({ message: "Project bookmarked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error bookmarking project" });
  }
});
//收藏控制
app.post("/toggle-bookmark", async (req, res) => {
  const { projectId, userId } = req.body;

  try {
    // 檢查是否已收藏
    const check = await pgClient.query(
      "SELECT * FROM Bookmark WHERE user_id = $1 AND project_id = $2",
      [userId, projectId]
    );

    if (check.rows.length > 0) {
      // 如果已收藏，則刪除收藏
      await pgClient.query(
        "DELETE FROM Bookmark WHERE user_id = $1 AND project_id = $2",
        [userId, projectId]
      );
      res.json({ message: "Bookmark removed", bookmarked: false });
    } else {
      // 如果未收藏，添加收藏
      await pgClient.query(
        "INSERT INTO Bookmark (user_id, project_id) VALUES ($1, $2)",
        [userId, projectId]
      );
      res.json({ message: "Bookmark added", bookmarked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling bookmark" });
  }
});
//顯示收藏項目
app.get("/bookmarked-projects", async (req, res) => {
  const userId = req.query.userId;

  let sqlQuery = `
      SELECT 
          p.*, 
          pi.project_proofimg_image, 
          pi.project_image1,
          COALESCE(SUM(d.amount), 0) AS cumulative_amount,  -- 動態計算累計捐款金額
          p.final_cost,
          COALESCE(SUM(d.amount), 0) / p.final_cost AS donation_ratio,  -- 計算捐款比例
          COUNT(DISTINCT d.user_id) AS donor_count  -- 計算捐款人數
      FROM 
          project p
      JOIN 
          ProjectImage pi ON p.project_id = pi.project_id
      JOIN 
          Bookmark b ON p.project_id = b.project_id
      LEFT JOIN 
          donate d ON p.project_id = d.project_id
      WHERE 
          b.user_id = $1  -- 根據用戶ID篩選收藏的專案
      GROUP BY 
          p.project_id, 
          pi.project_proofimg_image, 
          pi.project_image1, 
          p.final_cost
  `;

  const params = [userId];

  try {
    const result = await pgClient.query(sqlQuery, params);
    const projects = result.rows;

    // 翻譯項目標籤
    for (let project of projects) {
      project.project_tag = translateTag(project.project_tag);
    }

    res.json(projects);
  } catch (error) {
    console.error("Error fetching bookmarked projects:", error);
    res.status(500).send("Server error");
  }
});


//里程碑
app.get("/api/milestonesum/details/:projectId", async (req, res) => {
  const projectId = req.params.projectId;
  if (!projectId || isNaN(Number(projectId))) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const sqlQuery = `
          SELECT 
              project_name, 
              target1_cost, 
              target1_cost_title, 
              target1_cost_text, 
              Cumulative_amount 
          FROM project 
          WHERE project_id = $1`;

    const projectDetails = await pgClient.query(sqlQuery, [projectId]);

    if (projectDetails.rows.length > 0) {
      res.json(projectDetails.rows[0]);
    } else {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    console.error("Failed to retrieve project details:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/showmilestones/details/:milestoneId", async (req, res) => {
  const milestoneId = req.params.milestoneId;
  if (!milestoneId || isNaN(Number(milestoneId))) {
    return res.status(400).json({ error: "Invalid milestone ID" });
  }

  try {
    const sqlQuery = `
          SELECT 
              milestone_content, 
              milestone_image1, 
              milestone_image2, 
              milestone_image3, 
              has_been_reviewed, 
              is_approved 
          FROM MilestoneUpdate 
          WHERE  project_id = $1`;

    const milestoneDetails = await pgClient.query(sqlQuery, [milestoneId]);

    if (milestoneDetails.rows.length > 0) {
      res.json(milestoneDetails.rows[0]);
    } else {
      res.status(404).json({ error: "Milestone not found" });
    }
  } catch (error) {
    console.error("Failed to retrieve milestone details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//捐款
app.post("/donate", async (req, res) => {
  const { donor_id, project_id, amount } = req.body;
  try {
    // 開始事務
    await pgClient.query("BEGIN");

    // 插入捐款記錄到donations表
    const insertDonation =
      "INSERT INTO donations (donor_id, project_id, amount) VALUES ($1, $2, $3) RETURNING *";
    const donationResult = await pgClient.query(insertDonation, [
      donor_id,
      project_id,
      amount,
    ]);

    // 更新projects表的current_amount
    const updateProject =
      "UPDATE projects SET total_amount = total_amount + $1 WHERE project_id = $2 RETURNING total_amount";
    const projectResult = await pgClient.query(updateProject, [
      amount,
      project_id,
    ]);

    // 提交事務
    await pgClient.query("COMMIT");

    // 回應前端
    res.json({
      message: "Donation recorded and project updated successfully",
      donation: donationResult.rows[0],
      updatedProject: projectResult.rows[0],
    });
  } catch (error) {
    // 回滾事務
    await pgClient.query("ROLLBACK");
    console.error("Failed to record donation and update project", error);
    res
      .status(500)
      .json({ message: "Failed to record donation and update project" });
  }
});

//獲取總金額

// app.post("/total-donations", async (req, res) => {
//   const { userId } = req.body;
//   try {
//     const result = await pgClient.query(
//       "SELECT SUM(amount) AS total_donation FROM donations WHERE donor_id = $1",
//       [userId]
//     );

//     if (result.rows.length > 0) {
//       res.json({ total: result.rows[0].total_donation });
//     } else {
//       res.status(404).json({ message: "User not found" });
//     }
//   } catch (error) {
//     console.error("Error retrieving total donations", error);
//     res.status(500).json({ message: "Error retrieving total donations" });
//   }
// });
app.post("/user-info", async (req, res) => {
  const { userId } = req.body;
  try {
    // 查詢用戶信息
    const userInfoResult = await pgClient.query(
      `SELECT username,email FROM users WHERE user_id = $1`,
      [userId]
    );

    if (userInfoResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userInfo = userInfoResult.rows[0];

    // 計算總捐款金額
    const donationResult = await pgClient.query(
      `SELECT SUM(amount) AS total_donation FROM donate WHERE user_id = $1`,
      [userId]
    );

    const totalDonation = donationResult.rows[0].total_donation || 0;

    // 返回結果
    res.json({
      username: userInfo.username,
      email: userInfo.email,
      total_donation: totalDonation,
    });
  } catch (error) {
    console.error("Error retrieving user info and donations:", error);
    res
      .status(500)
      .json({ message: "Error retrieving user info and donations" });
  }
});

// 查詢用戶的捐款紀錄
app.post('/donation-record', async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await pgClient.query(
      `SELECT d.amount, d.transaction_hash, d.donation_date, p.project_name, p.project_id, pi.project_image1
FROM donate d
JOIN project p ON d.project_id = p.project_id
LEFT JOIN ProjectImage pi ON p.project_id = pi.project_id
WHERE d.user_id = $1
ORDER BY d.donation_date DESC;
`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching donation records:', error);
    res.status(500).json({ error: 'Failed to fetch donation records' });
  }
});


// 這是用於存儲捐款資料的 API
app.post('/api/donate', async (req, res) => {
  const { user_id, project_id, amount, donater_wallet_hash, transaction_hash } = req.body;
  console.log(user_id,project_id);

  try {
      const result = await pgClient.query(
          `INSERT INTO donate (user_id, project_id, amount, donater_wallet_hash, transaction_hash)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [user_id, project_id, amount, donater_wallet_hash, transaction_hash]
      );

      res.status(201).json(result.rows[0]);
  } catch (error) {
      console.error('Error inserting donation data:', error);
      res.status(500).json({ error: 'Failed to store donation data' });
  }
});
// 更新現有項目資料
app.post(
  "/update-project/:projectId",
  upload.fields([{ name: "project_proofimg" }, { name: "project_img1" }]),
  async (req, res) => {
    const { projectId } = req.params;
    const {
      project_name,
      user_id,
      project_code,
      project_agency,
      project_address,
      project_tag,
      project_summary,
      project_content,
      total_cost,
      target1_cost,
      target1_cost_text,
      target2_cost,
      target2_cost_text,
      deadline,
      project_costcontent,
      has_been_reviewed,
    } = req.body;

    try {
      // 更新專案主要資料
      const updateResult = await pgClient.query(
        "UPDATE projects SET project_name = $1, user_id = $2, project_code = $3, project_agency = $4, project_address = $5, project_tag = $6, project_summary = $7, project_content = $8, total_cost = $9, target1_cost = $10, target1_cost_text = $11, target2_cost = $12, target2_cost_text = $13, deadline = $14, project_costcontent = $15 , has_been_reviewed = $16 WHERE project_id = $17 RETURNING *",
        [
          project_name,
          user_id,
          project_code,
          project_agency,
          project_address,
          project_tag,
          project_summary,
          project_content,
          total_cost,
          target1_cost,
          target1_cost_text,
          target2_cost,
          target2_cost_text,
          deadline,
          project_costcontent,
          has_been_reviewed,
          projectId,
        ]
      );

      // 上傳並更新圖片資料
      if (req.files["project_proofimg"]) {
        const projectProofImg = req.files["project_proofimg"][0];
        const proofKey = `images/${Date.now()}-${projectProofImg.originalname}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: proofKey,
            Body: fs.readFileSync(projectProofImg.path),
            ContentType: "image/jpeg",
          })
        );
        const proofUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${proofKey}`;
        await pgClient.query(
          "UPDATE projectimage SET project_proofimg_image = $1 WHERE project_id = $2",
          [proofUrl, projectId]
        );
      }

      if (req.files["project_img1"]) {
        const projectImg1 = req.files["project_img1"][0];
        const img1Key = `images/${Date.now()}-${projectImg1.originalname}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: img1Key,
            Body: fs.readFileSync(projectImg1.path),
            ContentType: "image/jpeg",
          })
        );
        const img1Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${img1Key}`;
        await pgClient.query(
          "UPDATE projectimage SET project_image1 = $1 WHERE project_id = $2",
          [img1Url, projectId]
        );
      }

      res.json({
        success: true,
        message: "專案更新成功",
        updatedProject: updateResult.rows[0],
      });
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({
        success: false,
        message: "專案更新失敗",
        error: error.message,
      });
    }
  }
);
//更新金流運用資料
// app.post("/update-cost", upload.none(), async (req, res) => {
//   const { project_name, project_id, projectud_stage, new_current_cost, new_project_content, update_time } = req.body;

//   try {
//     const result = await pgClient.query(
//       "INSERT INTO ProjectUpdataCost (projectud_name, project_id, projectud_stage, new_current_cost, new_project_content, update_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//       [project_name, project_id, projectud_stage, new_current_cost, new_project_content, update_time]
//     );
//     res.json({
//       success: true,
//       message: "花費更新成功",
//       data: result.rows[0]
//     });
//   } catch (error) {
//     console.error("Failed to update cost:", error);
//     res.status(500).json({ success: false, message: "花費更新失敗" });
//   }
// });
// 更新金流運用資料和上傳PDF
app.post("/update-cost", upload.single("proof"), async (req, res) => {
  const { project_id, expense_title, expense } = req.body;
  const proofFile = req.file;

  try {
    let proofUrl = null;
    if (proofFile) {
      const key = `images/${Date.now()}-${proofFile.originalname}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: fs.readFileSync(proofFile.path),
          ContentType: proofFile.mimetype,
        })
      );
      proofUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const result = await pgClient.query(
      "INSERT INTO ExpenseUpdate (project_id, expense_title, expense, expense_proof_path) VALUES ($1, $2, $3, $4) RETURNING *",
      [project_id, expense_title, expense, proofUrl]
    );
    res.json({
      success: true,
      message: "花費更新和圖片上傳成功",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update cost and upload image:", error);
    res.status(500).json({ success: false, message: "花費更新和圖片上傳失敗" });
  }
});

// 處理新聞提交請求
app.post("/update-news", upload.single("project_image"), async (req, res) => {
  const { projectudNews_name, project_id, projectud_article } = req.body;
  console.log(project_id);
  const project_image = req.file;

  try {
    if (!project_image) {
      return res.status(400).json({ success: false, message: "圖片未上傳" });
    }

    const key = `images/${Date.now()}-${project_image.originalname}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fs.readFileSync(project_image.path),
        ContentType: project_image.mimetype,
      })
    );
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const result = await pgClient.query(
      "INSERT INTO NewsUpdate (news_name, project_id, news_article, news_imagepath1) VALUES ($1, $2, $3, $4) RETURNING *",
      [projectudNews_name, project_id, projectud_article, imageUrl]
    );

    res.json({
      success: true,
      message: "新聞提交成功",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error uploading data:", error);
    res.status(500).json({ success: false, message: "內部服務器錯誤" });
  }
});
//上船里程碑文字描述
app.post(
  "/update-mile",
  upload.fields([
    { name: "milestone_proof1" },
    { name: "milestone_proof2" },
    { name: "milestone_proof3" },
  ]),
  async (req, res) => {
    const { project_id, new_project_content } = req.body;
    const files = req.files;
    console.log(project_id);

    try {
      const uploadImage = async (file) => {
        const key = `images/${Date.now()}-${file.originalname}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: fs.readFileSync(file.path),
            ContentType: file.mimetype,
          })
        );
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      };

      const imageUrls = await Promise.all(
        ["milestone_proof1", "milestone_proof2", "milestone_proof3"].map(
          async (proof) => {
            return files[proof] ? await uploadImage(files[proof][0]) : null;
          }
        )
      );

      const result = await pgClient.query(
        "INSERT INTO MilestoneUpdate (project_id, Milestone_content, Milestone_image1, Milestone_image2, Milestone_image3) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          project_id,
          new_project_content,
          imageUrls[0],
          imageUrls[1],
          imageUrls[2],
        ]
      );

      res.json({
        success: true,
        message: "更新提交成功",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error uploading data:", error);
      res.status(500).json({ success: false, message: "內部服務器錯誤" });
    }
  }
);


// 查詢對應專案的捐款記錄 
app.get('/api/project-donationlist/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT u.username, d.amount, d.transaction_hash
           FROM donate d
           JOIN users u ON d.user_id = u.user_id
           WHERE d.project_id = $1
           ORDER BY d.donation_date DESC`,
          [projectId]
      );

      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching donation records:', error);
      res.status(500).json({ error: 'Failed to fetch donation records' });
  }
});

// 查詢對應專案的捐款記錄 (最多7個)
app.get('/api/project-donations/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT u.username, d.amount
           FROM donate d
           JOIN users u ON d.user_id = u.user_id
           WHERE d.project_id = $1
           ORDER BY d.donation_date DESC
           LIMIT 7`,
          [projectId]
      );

      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching donation records:', error);
      res.status(500).json({ error: 'Failed to fetch donation records' });
  }
});

app.get('/api/project-detail-doners/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT u.username, d.amount
           FROM donate d
           JOIN users u ON d.user_id = u.user_id
           WHERE d.project_id = $1
           ORDER BY d.donation_date DESC
           LIMIT 3`,
          [projectId]
      );

      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching donation records:', error);
      res.status(500).json({ error: 'Failed to fetch donation records' });
  }
});


// 查詢項目方的圖片和累積金額
app.get('/api/project-details/:projectId', async (req, res) => {
  const projectId = req.params.projectId;
  

  try {
      const result = await pgClient.query(
          `SELECT pi.project_image1, p.Cumulative_amount
           FROM project p
           LEFT JOIN ProjectImage pi ON p.project_id = pi.project_id
           WHERE p.project_id = $1`,
          [projectId]
      );

      res.json(result.rows[0]);
  } catch (error) {
      console.error('Error fetching project details:', error);
      res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// 查詢不同Expense_title的累積金額
app.get('/api/project-expenses/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT Expense_title, COALESCE(SUM(Expense), 0) AS total_amount
           FROM ExpenseUpdate
           WHERE project_id = $1
            AND is_approved = true 
           AND has_been_reviewed = true
           GROUP BY Expense_title`,
          [projectId]
      );

      

      res.json(result.rows);
  } catch (error) {
      console.error('Error fetching expense data:', error);
      res.status(500).json({ error: 'Failed to fetch expense data' });
  }
});

// 查詢累積的智能合約金額和合約地址
app.get('/api/project-cumulative-amount/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT COALESCE(SUM(d.amount), 0) AS cumulative_amount, p.contract_hash, p.target1_cost, p.final_cost, p.target1_cost_title, p.target1_cost_text
           FROM project p
           LEFT JOIN donate d ON p.project_id = d.project_id
           WHERE p.project_id = $1
           GROUP BY p.project_id`,
          [projectId]
      );

      res.json(result.rows[0]);
  } catch (error) {
      console.error('Error fetching cumulative amount and project details:', error);
      res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

//用於金流明細的各項讀取
// 查詢 "物資" 的累積金額和證明連結
app.get('/api/project-supply-expense/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT COALESCE(SUM(Expense), 0) AS total_amount, 
                  array_agg(expense_proof_path) FILTER (WHERE expense_proof_path IS NOT NULL AND expense_proof_path != '') AS expense_proofs
          FROM ExpenseUpdate
          WHERE project_id = $1
            AND Expense_title = '物資'
            AND is_approved = true
            AND has_been_reviewed = true
          GROUP BY Expense_title`,
          [projectId]
      );

      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          // 如果沒有找到資料，返回預設值而不是 404
          res.json({ total_amount: 0, expense_proofs: [] });
      }
  } catch (error) {
      console.error('Error fetching expense data for supply:', error);
      res.status(500).json({ error: 'Failed to fetch expense data for supply' });
  }
});

// 查詢 "人力" 的累積金額和證明連結
app.get('/api/project-manpower-expense/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT COALESCE(SUM(Expense), 0) AS total_amount, 
                  array_agg(expense_proof_path) FILTER (WHERE expense_proof_path IS NOT NULL AND expense_proof_path != '') AS expense_proofs
          FROM ExpenseUpdate
          WHERE project_id = $1
            AND Expense_title = '人力'
            AND is_approved = true
            AND has_been_reviewed = true
          GROUP BY Expense_title`,
          [projectId]
      );

      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          // 返回預設值而不是 404
          res.json({ total_amount: 0, expense_proofs: [] });
      }
  } catch (error) {
      console.error('Error fetching expense data for manpower:', error);
      res.status(500).json({ error: 'Failed to fetch expense data for manpower' });
  }
});

// 查詢 "資助" 的累積金額和證明連結
app.get('/api/project-fund-expense/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  try {
      const result = await pgClient.query(
          `SELECT COALESCE(SUM(Expense), 0) AS total_amount, 
                  array_agg(expense_proof_path) FILTER (WHERE expense_proof_path IS NOT NULL AND expense_proof_path != '') AS expense_proofs
          FROM ExpenseUpdate
          WHERE project_id = $1
            AND Expense_title = '資助'
            AND is_approved = true
            AND has_been_reviewed = true
          GROUP BY Expense_title`,
          [projectId]
      );

      if (result.rows.length > 0) {
          res.json(result.rows[0]);
      } else {
          // 返回預設值而不是 404
          res.json({ total_amount: 0, expense_proofs: [] });
      }
  } catch (error) {
      console.error('Error fetching expense data for fund:', error);
      res.status(500).json({ error: 'Failed to fetch expense data for fund' });
  }
});





//取得箱子位置

app.post('/api/add-location', upload.single('boxPhoto'), async (req, res) => {
  const { locationName, longitude, latitude } = req.body;
  const boxPhoto = req.file;

  // 檢查輸入是否完整
  if (!locationName || !longitude || !latitude || !boxPhoto) {
      return res.status(400).json({ message: '請輸入完整的位置信息並上傳圖片' });
  }

  try {
      // 將圖片上傳到 S3
      const key = `images/${Date.now()}-${boxPhoto.originalname}`;
      const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: fs.readFileSync(boxPhoto.path),
          ContentType: boxPhoto.mimetype,
      };

      const s3Response = await s3.send(new PutObjectCommand(uploadParams));
      const photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // 將位置資訊和圖片 URL 儲存到資料庫
      const result = await pgClient.query(
          'INSERT INTO DonationBoxLocation (location_name, longitude, latitude, box_photo) VALUES ($1, $2, $3, $4) RETURNING box_id',
          [locationName, longitude, latitude, photoUrl]
      );

      res.status(201).json({ message: '位置儲存成功', boxId: result.rows[0].box_id });
  } catch (error) {
      console.error('Error saving location:', error);
      res.status(500).json({ message: '儲存位置失敗' });
  }
});

// 刪除上線中箱子位置
app.delete('/api/delete-location/:boxId', async (req, res) => {
  const { boxId } = req.params;

  try {
      const result = await pgClient.query(
          'DELETE FROM DonationBoxLocation WHERE box_id = $1 RETURNING box_id',
          [boxId]
      );

      if (result.rowCount > 0) {
          res.json({ message: '資料刪除成功' });
      } else {
          res.status(404).json({ message: '找不到該筆資料' });
      }
  } catch (error) {
      console.error('Error deleting location:', error);
      res.status(500).json({ message: '刪除資料失敗' });
  }
});

// 查詢所有捐款箱位置的 API
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pgClient.query('SELECT * FROM DonationBoxLocation');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Error fetching locations' });
  }
});


// 儲存通知的 API
app.post('/api/notifications', async (req, res) => {
  const { user_id, project_id, notification_title, notification_text } = req.body;
  
  try {
    const result = await pgClient.query(
      `INSERT INTO Notifications (user_id, project_id, notification_title, notification_text, notification_type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, project_id, notification_title, notification_text, 1]  // 第五個值是 notification_type
    );

    res.status(201).json({ message: 'Notification stored successfully', notification: result.rows[0] });
  } catch (error) {
    console.error('Error storing notification:', error);
    res.status(500).json({ error: 'Failed to store notification' });
  }
});

app.post('/api/notifications/send-to-all', async (req, res) => {
  const { notification_title, notification_text, notification_type } = req.body;

  console.log('Received request to send notifications with:', { notification_title, notification_text, notification_type }); // 調試信息

  try {
      // 查詢所有用戶的 ID
      const usersResult = await pgClient.query('SELECT user_id FROM Users');
      const users = usersResult.rows;

      console.log('Users found:', users); // 調試信息

      // 遍歷所有用戶並插入通知
      for (let user of users) {
          await pgClient.query(
              `INSERT INTO Notifications (user_id, project_id, notification_title, notification_text, notification_type)
               VALUES ($1, NULL, $2, $3, $4)`,
              [user.user_id, notification_title, notification_text, notification_type]
          );
      }

      res.status(201).json({ message: 'Notifications sent successfully' });
  } catch (error) {
      console.error('Error sending notifications:', error); // 錯誤信息
      res.status(500).json({ error: 'Failed to send notifications' });
  }
});


// 查詢用戶捐款的通知和專案圖片
app.get('/search/notifications/:user_id/:type', async (req, res) => {
  const { user_id, type } = req.params;

  try {
      // 查詢所有該用戶與捐款相關的通知（type=1）
      const notificationsResult = await pgClient.query(`
          SELECT n.notification_title, n.notification_text, pi.project_image1 
          FROM Notifications n
          JOIN ProjectImage pi ON n.project_id = pi.project_id
          WHERE n.user_id = $1 AND n.notification_type = $2
      `, [user_id, type]);

      res.json(notificationsResult.rows);
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.get('/api/whether-user-projects/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pgClient.query(
      'SELECT project_id FROM project WHERE user_id = $1',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Failed to fetch user projects' });
  }
});





// 獲取用戶發布的所有專案
app.get("/api/user-projects/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const query = `
          SELECT p.*, pi.project_image1, pi.project_proofimg_image
          FROM Project p
          LEFT JOIN ProjectImage pi ON p.project_id = pi.project_id
          WHERE p.user_id = $1;
      `;
    const result = await pgClient.query(query, [userId]);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No projects found for this user." });
    }
  } catch (error) {
    console.error("Error retrieving user projects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
