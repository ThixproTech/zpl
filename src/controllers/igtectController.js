import axios from "axios";
import connection from "../config/connectDB.js";
import "dotenv/config";
import { AllGames } from "../views/utils/allgames.js";
import {VIP_REWORDS_LEVEL_BY_AMOUNT, getSubordinateDataByPhone} from "./vipController.js";

const updateRemainingBet = async (phone, betAmount) => {
   try {
      const timeNow = Date.now();
      const [user] = await connection.query("SELECT id_user, phone FROM users WHERE phone = ?", [phone]);
      if (!user.length) {
         return { success: false, message: "User not found." };
      }
      const userInfo = user[0];
      const [lastRecharge] = await connection.query(
         `SELECT id, remaining_bet FROM recharge 
       WHERE phone = ? AND status = 1 ORDER BY time_remaining_bet DESC LIMIT 1`,
         [phone],
      );
      if (!lastRecharge.length) {
         return { success: false, message: "No active recharge found." };
      }
      let lastRechargeRemainingBet = Number(lastRecharge[0].remaining_bet) || 0;
      const lastRechargeId = lastRecharge[0].id;
      console.log(`User: ${phone}, Bet Amount: ${betAmount}, Remaining Bet: ${lastRechargeRemainingBet}`);
      if (lastRechargeRemainingBet > 0) {
         // Deduct bet amount from remaining bet balance
         lastRechargeRemainingBet -= betAmount;

         // Ensure the remaining bet doesn't go negative
         if (lastRechargeRemainingBet < 0) {
            lastRechargeRemainingBet = 0;
         }

         // Update remaining bet in database
         await connection.query(`UPDATE recharge SET remaining_bet = ?, time_remaining_bet = ? WHERE id = ? AND status = 1`, [lastRechargeRemainingBet, timeNow, lastRechargeId]);

         console.log(`Updated remaining bet: ${lastRechargeRemainingBet}`);
      }

      return {
         success: true,
         message: "Rollover condition applied successfully.",
         remainingBetAmount: lastRechargeRemainingBet,
         timeStamp: timeNow,
      };
   } catch (error) {
      console.error("Error applying rollover condition:", error);
      return {
         success: false,
         message: "An error occurred while applying rollover conditions.",
         error: error.message,
      };
   }
};

export const getGameDetailsById = gameId => {
   const game = AllGames.find(item => item.id === gameId);

   if (game) {
      return {
         name: game.name,
         provider: game.provider,
      };
   } else {
      false;
   }
};
export const getIGtechGameLink = async (req, res) => {
   try {
      const token = req.cookies.auth;
      const gameId = req.query.gameId;
      if (!token) {
         return res.status(404).json({ success: false, message: "login Error" });
      }
      // Validate user authorization from database
      const [rows] = await connection.execute("SELECT `token`, `status`, `money`, `phone` FROM `users` WHERE `token` = ? AND `veri` = 1", [token]);
      if (!rows.length || rows[0].token !== token || rows[0].status !== 1) {
         return res.status(400).json({
            message: "Login is required to access this API",
            isAuthorized: false,
         });
      }

      // Ensure gameId is provided
      if (!gameId) {
         return res.status(400).json({
            message: "gameID is required!",
            isAuthorized: true,
         });
      }

      // Construct API request payload
      const requestData = {
         userId: rows[0].phone + "spidergaming",
         gameId: gameId,
         lang: "en",
         money: rows[0]?.money,
         home_url: "https://spidergameing.com",
         platform: 1,
      };

      // Make the API call
      const apiResponse = await axios.post(process.env.IGTECH_BASE_URL, requestData, {
         headers: {
            "x-igtechcasino-apikey": process.env.IGTECH_KEY,
            "Content-Type": "application/json",
         },
      });

      const gameLaunchUrl = apiResponse?.data?.payload?.game_launch_url;
      if (apiResponse?.data?.code !== 0 || !gameLaunchUrl) {
         return res.status(401).json({ status: false, msg: apiResponse?.data?.msg || "Error!" });
      }
      if (gameLaunchUrl) {
         return res.status(200).json({
            status: true,
            data: gameLaunchUrl,
         });
      } else {
         return res.status(500).json({
            success: false,
            message: "Failed to retrieve game URL.",
         });
      }
   } catch (error) {
      console.error("API Response Error Data:", error?.response?.data?.message);

      return res.status(500).json({
         message: "Something went wrong!",
         error: error?.response?.data?.message || "Unknown error",
      });
   }
};

export const IGTECHCallbak = async (req, res) => {
   console.log("callbak func");
   let { bet_amount, win_amount, member_account, game_uid, game_round, serial_number, currency_code, token } = req.body;
   try {
      member_account = member_account.split("spidergaming")[0];
      const [rows] = await connection.execute("SELECT `token`, `status`, `money`, `phone` FROM `users` WHERE `phone` = ? AND `veri` = 1", [member_account]);
      console.log("step1");

      const userBalance = rows[0].money;
      const userPhone = rows[0].phone;

      // Calculate the new balance
      const newBalance = userBalance - Number(bet_amount) + Number(win_amount);

      if (newBalance < 0) {
         return res.status(400).json({
            message: "Insufficient balance for this operation",
            isAuthorized: false,
         });
      }
      if (Number(bet_amount) || Number(win_amount)) {
         const igtechbets = await connection.execute("SELECT 1 FROM igtechbets WHERE game_round = ?", [game_round]);
         const game = getGameDetailsById(game_uid);

         if (igtechbets[0].length === 0) {
            await connection.execute("INSERT INTO igtechbets (phone, game_uid, game_name, provider, game_round, betAmount, winAmount, serial_number, currency_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [member_account, game_uid, game?.name || "livecasino", game?.provider || "livecasino", game_round, bet_amount, win_amount, serial_number, currency_code]);
         } else {
            await connection.execute("UPDATE igtechbets SET betAmount = betAmount + ?, winAmount = winAmount + ? WHERE game_round = ?", [bet_amount, win_amount, game_round]);
         }
      }

      const totalBetData = await getSubordinateDataByPhone(userPhone);
      const totalBet = totalBetData.bettingAmount; // Extract the amount

      const vipReward = VIP_REWORDS_LEVEL_BY_AMOUNT
      .filter(vip => vip.amount <= totalBet)
      .reduce((max, vip) => (vip.amount > max.amount ? vip : max), VIP_REWORDS_LEVEL_BY_AMOUNT[0]);

      let userVipLevel = vipReward.level;

      await connection.execute("UPDATE `users` SET `money` = ?, vip_level = ? WHERE `phone` = ?", [newBalance, userVipLevel, member_account]);
      updateRemainingBet(member_account, Number(bet_amount));
      return res.status(200).json({ success: true, message: "callback received", handle: true, money: newBalance });
   } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
         message: "An error occurred while updating the balance",
         isAuthorized: false,
      });
   }
};

export const getIGTECHGameHistory = async (req, res) => {
   try {
      const token = req.cookies.auth;
      if (!token) {
         return res.status(401).json({ success: false, message: "Authentication required." });
      }

      const [user] = await connection.execute("SELECT `token`, `status`, `phone` FROM `users` WHERE `token` = ? AND `veri` = 1", [token]);

      if (!user.length || user[0].status !== 1) {
         return res.status(403).json({ success: false, message: "Unauthorized access." });
      }

      const { search = "", startDate, endDate, page = 1, limit = 10, type } = req.query;
      const offset = (page - 1) * limit;
      const phone = user[0].phone;
      let query = "SELECT * FROM igtechbets WHERE 1=1";
      let countQuery = "SELECT COUNT(*) as count FROM igtechbets WHERE 1=1";
      let sumWin = "SELECT SUM(winAmount) as winTotal FROM igtechbets WHERE winAmount > 0";
      let sumLoss = "SELECT SUM(betAmount) as lossTotal FROM igtechbets WHERE 1 ";
      const params = [];
      const countParams = [];
      const winParams = [];
      const lossParams = [];

      // If type is "user", filter by phone
      if (type === "user") {
         query += " AND phone = ?";
         countQuery += " AND phone = ?";
         sumWin += " AND phone = ?";
         sumLoss += " AND phone = ?";
         params.push(phone);
         countParams.push(phone);
         winParams.push(phone);
         lossParams.push(phone);
      }
      // Otherwise, return all users' bets (no filter by phone)

      if (search) {
         query += " AND phone = ?";
         countQuery += " AND phone = ?";
         sumWin += " AND phone = ?";
         sumLoss += " AND phone = ?";
         params.push(`${search}`);
         countParams.push(`${search}`);
         winParams.push(`${search}`);
         lossParams.push(`${search}`);
      }
      if (startDate) {
         query += " AND created_at >= ?";
         countQuery += " AND created_at >= ?";
         sumWin += " AND created_at >= ?";
         sumLoss += " AND created_at >= ?";
         params.push(`${startDate}%`);
         countParams.push(`${startDate}%`);
         winParams.push(`${startDate}%`);
         lossParams.push(`${startDate}%`);
      }
      if (endDate) {
         query += " AND created_at <= ?";
         countQuery += " AND created_at <= ?";
         sumWin += " AND created_at <= ?";
         sumLoss += " AND created_at <= ?";
         params.push(`${endDate}%`);
         countParams.push(`${endDate}%`);
         winParams.push(`${endDate}%`);
         lossParams.push(`${endDate}%`);
      }

      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      // Execute queries
      const [history] = await connection.execute(query, params);
      const [countResult] = await connection.execute(countQuery, countParams);
      const totalRecords = countResult[0]?.count || 0;

      const [winResult] = await connection.execute(sumWin, winParams);
      const [lossResult] = await connection.execute(sumLoss, lossParams);
      const totalWin = winResult[0]?.winTotal || 0;
      const totalLoss = lossResult[0]?.lossTotal || 0;

      return res.status(200).json({
         success: true,
         data: history,
         totalRecords,
         totalWin,
         totalLoss,
         currentPage: parseInt(page),
         totalPages: Math.ceil(totalRecords / limit),
      });
   } catch (error) {
      console.error("Error fetching game history:", error);
      return res.status(500).json({
         success: false,
         message: "An error occurred while fetching the game history.",
         error: error.message,
      });
   }
};

// Support Settings
export const getSettingCskh = async (req, res) => {
   try {
      let [rows] = await connection.query(`SELECT telegram, cskh, app FROM admin_ac LIMIT 1`);

      if (rows.length === 0) {
         return res.status(404).json({
            message: "No data found",
            status: false,
         });
      }

      return res.status(200).json({
         message: "Success",
         status: true,
         data: rows[0],
      });
   } catch (error) {
      console.error("Error fetching data:", error);
      return res.status(500).json({
         message: "Server error",
         status: false,
      });
   }
};
