import connection from "../config/connectDB.js";
import { AllSlots } from "../views/utils/slots/merger.js";
import { AllCasino } from "../views/utils/casino/casinomerger.js";
import { AllSports } from "../views/utils/sports/sportsmerger.js";
import { AllGames } from "../views/utils/allgames.js";
import FishingArray from "../views/utils/fishing/fishing.js";
import JDBArray from "../views/utils/slots/JDB.js";
import RummyArray from "../views/utils/rummy/rummy.js";
import JiliArray from "../views/utils/slots/JiliGames.js";
import SpribeArray from "../views/utils/slots/Spribe.js";
import { Cq9Array } from "../views/utils/slots/Cq9.js";
import { PgsoftArray } from "../views/utils/slots/PgSoft.js";
import { updatedMicrogamingArray } from "../views/utils/slots/merger.js";
import OrignalArray from "../views/utils/original/original.js";
const homePage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/old.ejs", {
      app,
      slots: AllSlots,
      casino: AllCasino,
      sports: AllSports,
      fishing: FishingArray,
      rummy: RummyArray,
      orignal: OrignalArray,
   });
};
const AllgamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/Allgames.ejs", {
      app,
      allgames: AllGames,
      slots: AllSlots,
      casino: AllCasino,
      sports: AllSports,
      fishing: FishingArray,
      rummy: RummyArray,
   });
};
const JDBgamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/JDB.ejs", {
      app,
      jdbgame: JDBArray,
   });
};
const JiligamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/Jili.ejs", {
      app,
      jiligame: JiliArray,
   });
};
const CQ9gamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/CQ9.ejs", {
      app,
      cq9game: Cq9Array,
   });
};
const PgSoftgamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/PgSoft.ejs", {
      app,
      pgsoftgame: PgsoftArray,
   });
};
const SpribegamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/Spribe.ejs", {
      app,
      spribgame: SpribeArray,
   });
};
const MicrogaminggamesPage = async (req, res) => {
   const [settings] = await connection.query("SELECT `app` FROM admin_ac");
   let app = settings[0].app;
   return res.render("home/Microgaming.ejs", {
      app,
      microgaminggame: updatedMicrogamingArray,
   });
};
const gamewindowPage = async (req, res) => {
   const gameUrl = req.query.gameUrl;
   res.render("home/gamewindow.ejs", { gameUrl });
};

const activityPage = async (req, res) => {
   return res.render("checkIn/activity.ejs");
};

const adminGameHistoryPage = async (req, res) => {
   return res.render("manage/recharge.ejs");
};

const supportPage = async (req, res) => {
   try {
      let auth = req.cookies.auth;

      const [users] = await connection.query("SELECT `level`, `ctv` FROM users WHERE token = ?", [auth]);

      let settings = {};

      if (users.length == 0) {
         let [adminSettings] = await connection.query("SELECT * FROM admin_ac");
         settings = adminSettings[0];
      } else {
         if (users[0].level != 0) {
            let [adminSettings] = await connection.query("SELECT * FROM admin_ac");
            settings = adminSettings[0];
         } else {
            let [check] = await connection.query("SELECT * FROM point_list WHERE phone = ?", [users[0].ctv]);
            if (check.length == 0) {
               let [adminSettings] = await connection.query("SELECT * FROM admin_ac");
               settings = adminSettings[0];
            } else {
               settings = check[0]; // Fetching point_list data if available
            }
         }
      }

      return res.render("member/support.ejs", { settings });
   } catch (error) {
      console.error("Error fetching support data:", error);
      return res.status(500).json({
         message: "Server error",
         status: false,
      });
   }
};

const attendancePage = async (req, res) => {
   return res.render("checkIn/attendance.ejs");
};
const historyPage = async (req, res) => {
   return res.render("home/history.ejs");
};

const firstDepositBonusPage = async (req, res) => {
   try {
      const auth = req.cookies.auth;

      if (!auth) {
         return res.status(401).json({
            message: "Unauthorized",
            status: false,
         });
      }

      // Fetch user details
      const [userRows] = await connection.execute(
         "SELECT `phone`, `code`, `invite`, `first_deposite_bonus_level_complited` FROM users WHERE `token` = ?",
         [auth]
      );

      if (userRows.length === 0) {
         return res.status(404).json({
            message: "User not found",
            status: false,
            timeStamp: new Date().toISOString(),
         });
      }

      const { phone, first_deposite_bonus_level_complited } = userRows[0];

      // Fetch first deposit amount
      const [firstDepositRows] = await connection.execute(
         "SELECT money, first_deposite_bonus_level FROM recharge WHERE `phone` = ? AND `status` = ? ORDER BY id DESC LIMIT 1",
         [phone, 1]
      );

      // Ensure there's a valid recharge record
      const lastRechargeAmount =
         firstDepositRows.length > 0 && firstDepositRows[0].money !== null
            ? firstDepositRows[0].money
            : 0;

      const lastRechargeLevel =
         firstDepositRows.length > 0 && firstDepositRows[0].first_deposite_bonus_level !== null
            ? firstDepositRows[0].first_deposite_bonus_level
            : 0;

      // Convert completed levels from string to an array of numbers
      const claimedLevels =
         first_deposite_bonus_level_complited && first_deposite_bonus_level_complited !== ""
            ? first_deposite_bonus_level_complited.split(",").map(Number)
            : [];

      return res.render("checkIn/firstDepositBonus.ejs", {
         lastRechargeAmount,
         lastRechargeLevel,
         claimedLevels, // Pass it to EJS template
      });

   } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Internal server error" });
   }
};

const promotionRebateRatioPage = async (req, res) => {
   return res.render("promotion/rebateRadio.ejs");
};

const rebatePage = async (req, res) => {
   return res.render("checkIn/rebate.ejs");
};

const vipPage = async (req, res) => {
   try {
      const authToken = req.cookies.auth;

      if (!authToken) {
         return res.status(401).json({ status: false, message: "Unauthorized" });
      }

      const [users] = await connection.execute(
         "SELECT `vip_level`, `claim_vip_level` FROM `users` WHERE `token` = ?",
         [authToken]
      );

      let vipLevel = users.length > 0 ? users[0].vip_level || 0 : 0;
      let claimVipLevel = users.length > 0 ? users[0].claim_vip_level || 0 : 0;

      return res.render("checkIn/vip.ejs", { vipLevel, claimVipLevel }); // Use an object instead of an array
   } catch (error) {
      console.error("Error loading VIP page:", error);
      return res.status(500).json({ status: false, message: "Internal Server Error" });
   }
};

const newHot = async (req, res) => {
   return res.render("checkIn/newHot.ejs");
};
const youtube = async (req, res) => {
   return res.render("checkIn/youtube.ejs");
};
const inviteBonusPage = async (req, res) => {
   return res.render("checkIn/invibonus.ejs");
};
const program = async (req, res) => {
   return res.render("checkIn/program.ejs");
};
const winzo = async (req, res) => {
   return res.render("checkIn/winzo.ejs");
};
const agent = async (req, res) => {
   return res.render("checkIn/agent.ejs");
};
const mystery = async (req, res) => {
   return res.render("checkIn/mystery.ejs");
};
const dailyCheck = async (req, res) => {
   return res.render("checkIn/dailyCheck.ejs");
};

const jackpotPage = async (req, res) => {
   return res.render("checkIn/jackpot.ejs");
};

const dailytaskPage = async (req, res) => {
   return res.render("checkIn/dailytask.ejs");
};

const invibonusPage = async (req, res) => {
   return res.render("checkIn/invibonus.ejs");
};
const invitationRulesPage = async (req, res) => {
   return res.render("checkIn/invitationRules.ejs");
};

const jackpotRulesPage = async (req, res) => {
   return res.render("checkIn/rules.ejs");
};

const aviatorBettingRewardPage = async (req, res) => {
   return res.render("checkIn/aviator_betting_reward.ejs");
};
const socialVideoAwardPagePage = async (req, res) => {
   return res.render("checkIn/social_video_award.ejs");
};

const jackpotWiningStarPage = async (req, res) => {
   return res.render("checkIn/wining_star.ejs");
};

const checkInPage = async (req, res) => {
   return res.render("checkIn/checkIn.ejs");
};

const checkDes = async (req, res) => {
   return res.render("checkIn/checkDes.ejs");
};

const checkRecord = async (req, res) => {
   return res.render("checkIn/checkRecord.ejs");
};

const addBank = async (req, res) => {
   return res.render("wallet/addbank.ejs");
};

const selectBank = async (req, res) => {
   return res.render("wallet/selectBank.ejs");
};
const invitationRecord = async (req, res) => {
   return res.render("checkIn/invitationRecord.ejs");
};
const rechargeAwardCollectionRecord = async (req, res) => {
   return res.render("checkIn/rechargeAwardCollectionRecord.ejs");
};
const attendanceRecordPage = async (req, res) => {
   return res.render("checkIn/attendanceRecord.ejs");
};
const attendanceRulesPage = async (req, res) => {
   return res.render("checkIn/attendanceRules.ejs");
};

const changeAvatarPage = async (req, res) => {
   return res.render("member/change_avatar.ejs");
};

// promotion
const promotionPage = async (req, res) => {
   return res.render("promotion/promotion.ejs");
};

const subordinatesPage = async (req, res) => {
   return res.render("promotion/subordinates.ejs");
};

const promotion1Page = async (req, res) => {
   return res.render("promotion/promotion1.ejs");
};

const promotionmyTeamPage = async (req, res) => {
   return res.render("promotion/myTeam.ejs");
};

const promotionDesPage = async (req, res) => {
   return res.render("promotion/promotionDes.ejs");
};

const directDepositPage = async (req, res) => {
   return res.render("promotion/directDeposit.ejs");
};

const roiIncomePage = async (req, res) => {
   return res.render("promotion/roiIncome.ejs");
};

const firstRechargePage = async (req, res) => {
   return res.render("promotion/firstRecharge.ejs");
};

const topRecruiterPage = async (req, res) => {
   return res.render("promotion/topRecruiter.ejs");
};

const deffirencialPage = async (req, res) => {
   return res.render("promotion/deffirencial.ejs");
};

const teamRechargePage = async (req, res) => {
   return res.render("promotion/teamRecharge.ejs");
};

const jackpotIncomePage = async (req, res) => {
   return res.render("promotion/jackpot.ejs");
};

const betIncomePage = async (req, res) => {
   return res.render("promotion/betIncome.ejs");
};

const franchisePage = async (req, res) => {
   return res.render("promotion/franchise.ejs");
};

const salaryIncomePage = async (req, res) => {
   return res.render("promotion/salaryIncome.ejs");
};

const dailySalaryPage = async (req, res) => {
   return res.render("promotion/dailySalary.ejs");
};

const attendanceBonusPage = async (req, res) => {
   return res.render("promotion/attendance.ejs");
};

const myReferralPage = async (req, res) => {
   return res.render("promotion/myReferral.ejs");
};

const myDownlinePage = async (req, res) => {
   return res.render("promotion/myDownline.ejs");
};

const levelDetailsPage = async (req, res) => {
   return res.render("promotion/levelDetails.ejs");
};

const comhistoryPage = async (req, res) => {
   return res.render("promotion/comhistory.ejs");
};

const tutorialPage = async (req, res) => {
   return res.render("promotion/tutorial.ejs");
};

const bonusRecordPage = async (req, res) => {
   return res.render("promotion/bonusrecord.ejs");
};

// wallet
const transactionhistoryPage = async (req, res) => {
   return res.render("wallet/transactionhistory.ejs");
};
const gameHistoryPage = async (req, res) => {
   return res.render("member/game_history.ejs");
};

const loadGameHistory = async (req, res) => {
    try {
        let auth = req.cookies.auth;
        if (!auth) {
            return res.status(401).json({
                message: "Unauthorized",
                status: false,
            });
        }

        const [user] = await connection.query(
            "SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?",
            [auth]
        );
        let userInfo = user[0];

        if (!userInfo) {
            return res.status(404).json({
                message: "User not found",
                status: false,
                timeStamp: new Date().toISOString(),
            });
        }

        const date = req.body.date ?? "";
        const page = parseInt(req.body.page || 1, 10);
        const pageSize = parseInt(req.body.pageSize || 10, 10);
        const offset = (page - 1) * pageSize;

        let query = `
            SELECT 'Trx Win Go' AS game_name, money AS betAmount, get AS winAmount, 
                   FROM_UNIXTIME(time / 1000, '%Y-%m-%d %H:%i:%s') AS created_at 
            FROM trx_wingo_bets WHERE phone = ?
        `;

        let params = [userInfo.phone];

        if (date) {
            query += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            params.push(date);
        }

        query += `
            UNION ALL
            SELECT '1M' AS game_name, money AS betAmount, get AS winAmount, 
                   FROM_UNIXTIME(time / 1000, '%Y-%m-%d %H:%i:%s') AS created_at 
            FROM minutes_1 WHERE phone = ?
        `;
        params.push(userInfo.phone);
        if (date) {
            query += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            params.push(date);
        }

        query += `
            UNION ALL
            SELECT 'K3' AS game_name, money AS betAmount, get AS winAmount, 
                   FROM_UNIXTIME(time / 1000, '%Y-%m-%d %H:%i:%s') AS created_at 
            FROM result_k3 WHERE phone = ?
        `;
        params.push(userInfo.phone);
        if (date) {
            query += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            params.push(date);
        }

        query += `
            UNION ALL
            SELECT '5D' AS game_name, money AS betAmount, get AS winAmount, 
                   FROM_UNIXTIME(time / 1000, '%Y-%m-%d %H:%i:%s') AS created_at 
            FROM result_5d WHERE phone = ?
        `;
        params.push(userInfo.phone);
        if (date) {
            query += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            params.push(date);
        }

        query += `
            UNION ALL
            SELECT 'Wingo' AS game_name, money AS betAmount, get AS winAmount, 
                   FROM_UNIXTIME(time / 1000, '%Y-%m-%d %H:%i:%s') AS created_at 
            FROM trx_wingo_bets WHERE phone = ?
        `;
        params.push(userInfo.phone);
        if (date) {
            query += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            params.push(date);
        }

        query += `
            UNION ALL
            SELECT game_name, betAmount, winAmount, 
                   DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at 
            FROM igtechbets WHERE phone = ?
        `;
        params.push(userInfo.phone);
        if (date) {
            query += " AND DATE(created_at) = ?";
            params.push(date);
        }

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        params.push(pageSize, offset);

        // ✅ **UPDATED: Total Count Query with Date Condition**
        let countQuery = `
            SELECT COUNT(*) AS total FROM (
                SELECT money FROM trx_wingo_bets WHERE phone = ?
        `;

        let countParams = [userInfo.phone];

        if (date) {
            countQuery += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            countParams.push(date);
        }

        countQuery += `
                UNION ALL SELECT money FROM minutes_1 WHERE phone = ?
        `;
        countParams.push(userInfo.phone);

        if (date) {
            countQuery += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            countParams.push(date);
        }

        countQuery += `
                UNION ALL SELECT money FROM result_k3 WHERE phone = ?
        `;
        countParams.push(userInfo.phone);

        if (date) {
            countQuery += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            countParams.push(date);
        }

        countQuery += `
                UNION ALL SELECT money FROM result_5d WHERE phone = ?
        `;
        countParams.push(userInfo.phone);

        if (date) {
            countQuery += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            countParams.push(date);
        }

        countQuery += `
                UNION ALL SELECT money FROM trx_wingo_bets WHERE phone = ?
        `;
        countParams.push(userInfo.phone);

        if (date) {
            countQuery += " AND DATE(FROM_UNIXTIME(time / 1000)) = ?";
            countParams.push(date);
        }

        countQuery += `
                UNION ALL SELECT betAmount FROM igtechbets WHERE phone = ?
        `;
        countParams.push(userInfo.phone);

        if (date) {
            countQuery += " AND DATE(created_at) = ?";
            countParams.push(date);
        }

        countQuery += `) AS totalRecords`;

        const [countResult] = await connection.query(countQuery, countParams);
        const totalRecords = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalRecords / pageSize);

        const [gameHistory] = await connection.query(query, params);

        return res.status(200).json({
            message: "Success",
            status: true,
            datas: gameHistory,
            page,
            pageSize,
            totalPages,
            hasNextPage: page < totalPages,
        });
    } catch (error) {
        console.error("Error loading game history:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            status: false,
            error: error.message,
        });
    }
};



const walletPage = async (req, res) => {
   return res.render("wallet/index.ejs");
};

const rechargePage = async (req, res) => {
   return res.render("wallet/recharge.ejs", {
      MINIMUM_MONEY_USDT: process.env.MINIMUM_MONEY_USDT,
      MINIMUM_MONEY_INR: process.env.MINIMUM_MONEY_INR,
      USDT_INR_EXCHANGE_RATE: process.env.USDT_INR_EXCHANGE_RATE,
   });
};

const rechargerecordPage = async (req, res) => {
   return res.render("wallet/rechargerecord.ejs");
};

const withdrawalPage = async (req, res) => {
   return res.render("wallet/withdrawal.ejs", {
      MINIMUM_MONEY_USDT: process.env.MINIMUM_WITHDRAWAL_MONEY_USDT,
      MINIMUM_MONEY_INR: process.env.MINIMUM_WITHDRAWAL_MONEY_INR,
      USDT_INR_EXCHANGE_RATE: process.env.USDT_INR_EXCHANGE_RATE,
   });
};

const withdrawalrecordPage = async (req, res) => {
   return res.render("wallet/withdrawalrecord.ejs");
};
const transfer = async (req, res) => {
   return res.render("wallet/transfer.ejs");
};

// member page
const mianPage = async (req, res) => {
   let auth = req.cookies.auth;
   const [user] = await connection.query("SELECT `level` FROM users WHERE `token` = ? ", [auth]);
   const [settings] = await connection.query("SELECT `cskh` FROM admin_ac");
   let cskh = settings[0].cskh;
   let level = user[0].level;
   return res.render("member/index.ejs", { level, cskh });
};

const settingsPage = async (req, res) => {
   let auth = req.cookies.auth;
   const [user] = await connection.query("SELECT * FROM users WHERE `token` = ? ", [auth]);

   return res.render("member/settings.ejs", {
      NICKNAME: user[0].name_user,
      USER_ID: user[0].id_user,
   });
};

const aboutPage = async (req, res) => {
   return res.render("member/about/index.ejs");
};

const guidePage = async (req, res) => {
   return res.render("member/guide.ejs");
};

const feedbackPage = async (req, res) => {
   return res.render("member/feedback.ejs");
};

const notificationPage = async (req, res) => {
   return res.render("member/notification.ejs");
};

const loginNotificationPage = async (req, res) => {
   const auth = req.cookies.auth;
   const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [auth]);

   // Check if user exists
   if (!rows.length) {
      return res.status(200).json({
         message: "Failed",
         status: false,
      });
   }
   const rowstr = rows[0]; // Get the first row from the result
   const [getDate] = await connection.query(`SELECT today FROM login WHERE phone = ? ORDER BY today DESC`, [rowstr.phone]);
   return res.render("member/login_notification.ejs", { getDate });
};

const recordsalary = async (req, res) => {
   return res.render("member/about/recordsalary.ejs");
};

const privacyPolicy = async (req, res) => {
   return res.render("member/about/privacyPolicy.ejs");
};

const newtutorial = async (req, res) => {
   return res.render("member/newtutorial.ejs");
};

const forgot = async (req, res) => {
   let auth = req.cookies.auth;
   const [user] = await connection.query("SELECT `time_otp` FROM users WHERE token = ? ", [auth]);
   let time = user[0].time_otp;
   return res.render("member/forgot.ejs", { time });
};

const redenvelopes = async (req, res) => {
   return res.render("member/redenvelopes.ejs");
};
const newGift = async (req, res) => {
   return res.render("checkIn/newGift.ejs");
};

const riskAgreement = async (req, res) => {
   return res.render("member/about/riskAgreement.ejs");
};

const myProfilePage = async (req, res) => {
   return res.render("member/myProfile.ejs");
};

const getSalaryRecord = async (req, res) => {
   const auth = req.cookies.auth;

   const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [auth]);
   let rowstr = rows[0];
   if (!rows) {
      return res.status(200).json({
         message: "Failed",
         status: false,
      });
   }
   const [getPhone] = await connection.query(`SELECT * FROM salary WHERE phone = ? ORDER BY time DESC`, [rowstr.phone]);

   console.log("asdasdasd : " + [rows.phone]);
   return res.status(200).json({
      message: "Success",
      status: true,
      data: {},
      rows: getPhone,
   });
};
const rebateFun = async (req, res) => {
   try {
       let auth = req.cookies.auth;
       console.log("Auth token:", auth);

       if (!auth) {
           return res.status(401).json({ error: "Unauthorized" });
       }

       const phoneResults = await connection.query(
           "SELECT phone FROM users WHERE token = ?",
           [auth]
       );

       if (phoneResults && phoneResults.length > 0 && phoneResults[0].length > 0) {
           const phone = phoneResults[0][0].phone;
           console.log("Phone number:", phone);

           // Get today's date in YYYY-MM-DD format
           const today = new Date().toISOString().split('T')[0];

           // Fetch igtechbets for today
           const historyApiResults = await connection.query(
               "SELECT * FROM igtechbets WHERE phone = ? AND DATE(created_at) = ? ORDER BY created_at DESC",
               [phone, today]
           );
           console.log(historyApiResults, "igtechbets for today");

           // Fetch minutes_1 for today
           const historyResults = await connection.query(
               "SELECT * FROM minutes_1 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ? ORDER BY time DESC",
               [phone, today]
           );
           console.log("minutes_1 for today:", historyResults[0]);

           res.status(200).json({ history: historyResults[0], apiHistory: historyApiResults[0] });
       } else {
           return res.status(404).json({ error: "User not found" });
       }
   } catch (error) {
       console.error("Error fetching data:", error);
       res.status(500).json({ error: "Internal server error" });
   }
};
// Modified claimRebate function in your server code
const claimRebate = async (req, res) => {
  try {
    const { category } = req.body;
    console.log("Claiming rebate for category:", category);
    
    let auth = req.cookies.auth;
    console.log("Auth token:", auth);
    
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get user's phone number from auth token
    const phoneResults = await connection.query(
      "SELECT phone FROM users WHERE token = ?",
      [auth]
    );
    
    if (phoneResults && phoneResults.length > 0 && phoneResults[0].length > 0) {
      const phone = phoneResults[0][0].phone;
      console.log("Phone number:", phone);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch minutes_1 for today
      const historyResults = await connection.query(
        "SELECT * FROM minutes_1 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
        [phone, today]
      );

      // Fetch igtechbets for today
      const apiHistoryResults = await connection.query(
        "SELECT * FROM igtechbets WHERE phone = ? AND DATE(created_at) = ?",
        [phone, today]
      );

      const history = historyResults[0] || [];
      const apiHistory = apiHistoryResults[0] || [];
      
      // Calculate rebate based on category
      let rebateAmount = 0;
      let bettingAmount = 0;
      let rebateRate = 0;
      let rebateDetails = {};
      
      if (category === 'all') {
        // Calculate rebates for all categories
        const lotteryRebate = calculateLotteryRebate(history);
        const casinoRebate = calculateCasinoRebate(apiHistory);
        // Add more categories as needed
        rebateAmount = lotteryRebate.realTime + casinoRebate.realTime;
        bettingAmount = lotteryRebate.bettingAmount + casinoRebate.bettingAmount;
        
        // Store details for each category
        rebateDetails = {
          lottery: {
            bettingAmount: lotteryRebate.bettingAmount,
            rebateRate: 0.0005, // 0.05%
            rebateAmount: lotteryRebate.realTime
          },
          casino: {
            bettingAmount: casinoRebate.bettingAmount,
            rebateRate: 0.002, // 0.10%
            rebateAmount: casinoRebate.realTime
          }
        };
      } else if (category === 'lottery') {
        const lotteryRebate = calculateLotteryRebate(history);
        rebateAmount = lotteryRebate.realTime;
        bettingAmount = lotteryRebate.bettingAmount;
        rebateRate = 0.0005; // 0.05%
        
        rebateDetails = {
          lottery: {
            bettingAmount: lotteryRebate.bettingAmount,
            rebateRate: rebateRate,
            rebateAmount: lotteryRebate.realTime
          }
        };
      } else if (category === 'casino') {
        const casinoRebate = calculateCasinoRebate(apiHistory);
        rebateAmount = casinoRebate.realTime;
        bettingAmount = casinoRebate.bettingAmount;
        rebateRate = 0.002; // 0.10%
        
        rebateDetails = {
          casino: {
            bettingAmount: casinoRebate.bettingAmount,
            rebateRate: rebateRate,
            rebateAmount: casinoRebate.realTime
          }
        };
      } else if (category === 'rummy') {
        // Add rummy calculation if needed
        rebateAmount = 0;
        bettingAmount = 0;
        rebateRate = 0.005; // 0.20%
        
        rebateDetails = {
          rummy: {
            bettingAmount: 0,
            rebateRate: rebateRate,
            rebateAmount: 0
          }
        };
      }
      
      console.log("Calculated rebate amount:", rebateAmount);
      
      // If no rebate to claim, return early
      if (rebateAmount <= 0) {
        return res.status(200).json({ 
          success: false,
          message: "No rebate available to claim"
        });
      }
      
      // Get user's current balance
      const moneyResults = await connection.query(
        "SELECT money FROM users WHERE phone = ?",
        [phone]
      );
      
      if (!moneyResults || !moneyResults[0] || !moneyResults[0][0]) {
        return res.status(404).json({ error: "User balance not found" });
      }
      
      const currentMoney = moneyResults[0][0].money;
      const newBalance = parseFloat(currentMoney) + parseFloat(rebateAmount);
      
      console.log("Current balance:", currentMoney);
      console.log("New balance after rebate:", newBalance);
      
      // Update user's balance
      await connection.query(
        "UPDATE users SET money = ? WHERE phone = ?",
        [newBalance, phone]
      );
      
      // Store rebate claim data in the new rebate_claims table
      await connection.query(
        `INSERT INTO rebate_claims 
        (phone, claim_date, category, betting_amount, rebate_rate, rebate_amount, details) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          phone, 
          new Date(), 
          category, 
          bettingAmount, 
          category ===  (rebateRate * 100).toFixed(2) + '%', 
          rebateAmount,
          JSON.stringify(rebateDetails)
        ]
      );
      
      // Mark rebates as claimed in the original data tables
      if (category === 'all' || category === 'lottery') {
        // Mark lottery rebates as claimed
        const wingoIds = history
          .filter(item => item.game === "wingo" && (!item.rebate_claimed || item.rebate_claimed === 0))
          .map(item => item.id);
          
       
      }
      
      if (category === 'all' || category === 'casino') {
        // Mark casino rebates as claimed
        const casinoIds = apiHistory
          .filter(item => 
            (item.provider === "jili" || item.provider === "spribe") && 
            (!item.rebate_claimed || item.rebate_claimed === 0)
          )
          .map(item => item.id);
          
       
      }
      
      return res.status(200).json({
        success: true,
        message: `Successfully claimed ${parseFloat(rebateAmount).toFixed(2)} rebate`,
        newBalance: newBalance.toFixed(2),
        rebateDetails: rebateDetails
      });
      
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error claiming rebate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Modified calculation functions to also return betting amounts
function calculateLotteryRebate(historyData) {
  // Filter to only include "wingo" games and unclaimed rebates
  const wingoGames = historyData.filter(item => 
    item.game === "wingo" && (!item.rebate_claimed || item.rebate_claimed === 0)
  );
  
  // Calculate total rebate (0.05% of amount)
  const totalAmount = wingoGames.reduce((sum, item) => sum + parseFloat(item.money || 0), 0);
  const totalRebate = totalAmount * 0.0005; // 0.05%
  
  return {
    total: totalRebate,
    realTime: totalRebate,
    bettingAmount: totalAmount
  };
}

// Helper function to calculate casino rebates - should match frontend calculation
function calculateCasinoRebate(apiHistoryData) {
  // Filter to only include jili and spribe providers and unclaimed rebates
  const casinoGames = apiHistoryData.filter(item => 
    (item.provider === "jili" || item.provider === "spribe") && 
    (!item.rebate_claimed || item.rebate_claimed === 0)
  );
  
  // Calculate total rebate (0.10% of betAmount)
  const totalAmount = casinoGames.reduce((sum, item) => sum + parseFloat(item.betAmount || 0), 0);
  const totalRebate = totalAmount * 0.001; // 0.10%
  
  return {
    total: totalRebate,
    realTime: totalRebate,
    bettingAmount: totalAmount
  };
}

const rebatclaimed = async (req, res) => {
   try {
     const auth = req.cookies.auth;
     console.log(auth);
     
     // Get the user information
     const [users] = await connection.query("select * from users where token=?", [auth]);
     
     if (!users || users.length === 0) {
       return res.status(401).json({ error: "User not authenticated" });
     }
     
     const user = users[0]; // Get first user from results
     
     // Get the claim history using the user's phone number
     const [claimedHistory] = await connection.query(
       "select * from rebate_claims where phone=? order by id desc" , 
       [user.phone] // Use the phone property from the user object
     );
     
     console.log(claimedHistory, "Claim history data");
     
     // Send the data back to the client
     return res.status(200).json(claimedHistory);
   } catch (error) {
     console.error("Error in rebatclaimed:", error);
     return res.status(500).json({ error: "Internal server error" });
   }
 };

 
const homeController = {
   MicrogaminggamesPage,
   SpribegamesPage,
   PgSoftgamesPage,
   CQ9gamesPage,
   JiligamesPage,
   JDBgamesPage,
   gameHistoryPage,
   loadGameHistory,
   homePage,
   checkInPage,
   adminGameHistoryPage,
   invibonusPage,
   rebatePage,
   jackpotPage,
   vipPage,
   activityPage,
   dailytaskPage,
   promotionPage,
   subordinatesPage,
   promotion1Page,
   walletPage,
   mianPage,
   myProfilePage,
   promotionmyTeamPage,
   promotionDesPage,
   comhistoryPage,
   tutorialPage,
   bonusRecordPage,
   rechargePage,
   rechargerecordPage,
   withdrawalPage,
   withdrawalrecordPage,
   aboutPage,
   privacyPolicy,
   riskAgreement,
   newGift,
   newtutorial,
   redenvelopes,
   forgot,
   checkDes,
   newHot,
   dailyCheck,
   winzo,
   agent,
   youtube,
   program,
   mystery,
   checkRecord,
   addBank,
   transfer,
   recordsalary,
   getSalaryRecord,
   transactionhistoryPage,
   jackpotRulesPage,
   jackpotWiningStarPage,
   attendancePage,
   firstDepositBonusPage,
   aviatorBettingRewardPage,
   socialVideoAwardPagePage,
   promotionRebateRatioPage,
   settingsPage,
   guidePage,
   feedbackPage,
   notificationPage,
   loginNotificationPage,
   selectBank,
   invitationRecord,
   rechargeAwardCollectionRecord,
   attendanceRecordPage,
   attendanceRulesPage,
   changeAvatarPage,
   invitationRulesPage,
   supportPage,

   directDepositPage,
   roiIncomePage,
   firstRechargePage,
   topRecruiterPage,
   deffirencialPage,
   teamRechargePage,
   jackpotIncomePage,
   betIncomePage,
   franchisePage,
   salaryIncomePage,
   dailySalaryPage,
   attendanceBonusPage,
   myReferralPage,
   myDownlinePage,
   levelDetailsPage,
   historyPage,
   AllgamesPage,
   gamewindowPage,
   inviteBonusPage,
    rebateFun,
   claimRebate,
rebatclaimed
};

export default homeController;
