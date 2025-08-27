import connection from "../config/connectDB.js";
import md5 from "md5";
import request from "request";
import axios from "axios";
import { REWARD_TYPES_MAP } from "../constants/reward_types.js";
import { getDayTime } from "../helpers/games.js";
import moment from "moment";
import { PaymentStatusMap } from "./paymentController.js";
import {
  getStartOfWeekTimestamp,
  getTimeBasedOnDate,
  getTodayStartTime,
  monthTime,
  yesterdayTime,
} from "../helpers/games.js";

let timeNow = Date.now();

const firstListRecharge = async (req, res) => {
  let auth = req.cookies.auth;
  if (!auth) {
    return res.status(200).json({
      message: "Failed",
      status: false,
      timeStamp: timeNow,
    });
  }

  const [user] = await connection.query(
    "SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?",
    [auth]
  );
  let userInfo = user[0];

  if (!userInfo.invite) {
    return res.status(200).json({
      message: "No invite code found",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [inviteCheck] = await connection.query(
    "SELECT `phone` FROM users WHERE `invite` = ?",
    [userInfo.invite]
  );

  if (inviteCheck.length === 0) {
    return res.status(200).json({
      message: "Invite code does not match any phone number",
      status: false,
      timeStamp: timeNow,
    });
  }
  const [recharge] = await connection.query(
    "SELECT * FROM recharge WHERE phone = ? AND status = 1 ORDER BY id ASC LIMIT 1",
    [userInfo.phone]
  );

  if (!recharge || recharge.length === 0) {
    return res.status(200).json({
      message: "No valid recharge found",
      status: false,
      timeStamp: timeNow,
    });
  }

  let rechargeArray = [recharge[0]];

  return res.status(200).json({
    message: "Receive success",
    datas: rechargeArray,
    status: true,
    timeStamp: timeNow,
  });
};

const SalaryRecord = async (req, res) => {
  const auth = req.cookies.auth;

  const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [
    auth,
  ]);
  let rowstr = rows[0];
  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  const [getPhone] = await connection.query(
    `SELECT * FROM salary WHERE phone = ? ORDER BY time DESC`,
    [rowstr.phone],
  );

  console.log("asdasdasd : " + [rows.phone]);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: getPhone,
  });
};

const dailySalaryRecord = async (req, res) => {
  const auth = req.cookies.auth;

  const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [
    auth,
  ]);
  let rowstr = rows[0];
  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  const [getPhone] = await connection.query(
    `SELECT * FROM salary WHERE phone = ? AND type = 'dailySalary' ORDER BY time DESC`,
    [rowstr.phone]
  );

  console.log("asdasdasd : " + [rows.phone]);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: getPhone,
  });
};

const recruiterSalaryRecord = async (req, res) => {
  const auth = req.cookies.auth;

  const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [
    auth,
  ]);
  let rowstr = rows[0];
  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  const [getPhone] = await connection.query(
    `SELECT * FROM salary WHERE phone = ? AND type = 'recruiterSalary' ORDER BY time DESC`,
    [rowstr.phone]
  );

  console.log("asdasdasd : " + [rows.phone]);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: getPhone,
  });
};

const franchiseIncome = async (req, res) => {
  const auth = req.cookies.auth;

  const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [
    auth,
  ]);
  let rowstr = rows[0];
  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  const [getPhone] = await connection.query(
    `SELECT * FROM claimed_rewards WHERE phone = ? AND type = 'FRANCHISE BONUS' ORDER BY time DESC`,
    [rowstr.phone]
  );

  console.log("asdasdasd : " + [rows.phone]);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: getPhone,
  });
};

const roiIncome = async (req, res) => {
  const auth = req.cookies.auth;

  const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [
    auth,
  ]);
  let rowstr = rows[0];
  if (!rows) {
    return res.status(200).json({
      message: "Failed",
      status: false,
    });
  }
  const [getPhone] = await connection.query(
    `SELECT * FROM claimed_rewards WHERE phone = ? AND type = 'ROI' ORDER BY time DESC`,
    [rowstr.phone]
  );

  console.log("asdasdasd : " + [rows.phone]);
  return res.status(200).json({
    message: "Success",
    status: true,
    data: {},
    rows: getPhone,
  });
};

// const myReferral = async (req, res) => {
//   const auth = req.cookies.auth;
//   const timeNow = new Date().toISOString();

//   if (!auth) {
//     return res.status(200).json({
//       message: "Failed",
//       status: false,
//       timeStamp: timeNow,
//     });
//   }

//   try {
//     const [user] = await connection.query(
//       "SELECT `phone`, `code`, `invite` FROM users WHERE `token` = ?",
//       [auth]
//     );

//     if (!user || user.length === 0) {
//       return res.status(200).json({
//         message: "User not found",
//         status: false,
//         timeStamp: timeNow,
//       });
//     }

//     const userInfo = user[0];

//     if (!userInfo.code) {
//       return res.status(200).json({
//         message: "No code found",
//         status: false,
//         timeStamp: timeNow,
//       });
//     }

//     const [matchingUsers] = await connection.query(
//       "SELECT `phone`, `invite`,`id_user`, `name_user`, `level` FROM users WHERE `invite` = ?",
//       [userInfo.code]
//     );

//     if (!matchingUsers || matchingUsers.length === 0) {
//       return res.status(200).json({
//         message: "Invite code does not match any phone number",
//         status: false,
//         timeStamp: timeNow,
//       });
//     }

//     return res.status(200).json({
//       message: "Success",
//       datas: matchingUsers,
//       status: true,
//       timeStamp: timeNow,
//     });
//   } catch (error) {
//     console.error("Error fetching referral data:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       status: false,
//       timeStamp: timeNow,
//     });
//   }
// };

const userStats = async (startTime, endTime, phone = "") => {
  const [rows] = await connection.query(
    `
      SELECT
          u.phone,
          u.invite,
          u.code,
          u.time,
          u.id_user,
          u.name_user,
          COALESCE(r.total_deposit_amount, 0) AS total_deposit_amount,
          COALESCE(r.total_deposit_number, 0) AS total_deposit_number,
          COALESCE(r.first_deposit_amount, 0) AS first_deposit_amount,
          COALESCE(m.total_bets, 0) AS total_bets,
          COALESCE(m.total_bet_amount, 0) AS total_bet_amount,
          COALESCE(c.total_commission, 0) AS total_commission
      FROM
          users u
      LEFT JOIN
          (
              SELECT
                  phone,
                  SUM(CASE WHEN status = 1 THEN COALESCE(money, 0) ELSE 0 END) AS total_deposit_amount,
                  COUNT(CASE WHEN status = 1 THEN phone ELSE NULL END) AS total_deposit_number,
                  SUM(CASE WHEN status = 1 THEN money ELSE 0 END) AS first_deposit_amount
              FROM
                  recharge
              WHERE
                  time > ? AND time < ?
              GROUP BY
                  phone
          ) r ON u.phone = r.phone
      LEFT JOIN
          (
              SELECT 
                  phone,
                  COALESCE(SUM(total_bet_amount), 0) AS total_bet_amount,
                  COALESCE(SUM(total_bets), 0) AS total_bets
              FROM (
                  SELECT 
                      phone,
                      SUM(money + fee) AS total_bet_amount,
                      COUNT(*) AS total_bets
                  FROM minutes_1
                  WHERE time >= ? AND time <= ?
                  GROUP BY phone
                  UNION ALL
                  SELECT 
                      phone,
                      SUM(money + fee) AS total_bet_amount,
                      COUNT(*) AS total_bets
                  FROM trx_wingo_bets
                  WHERE time >= ? AND time <= ?
                  GROUP BY phone
              ) AS combined
              GROUP BY phone
          ) m ON u.phone = m.phone
      LEFT JOIN
          (
              SELECT
                  from_user_phone AS phone,
                  SUM(money) AS total_commission
              FROM
                  commissions
              WHERE
                  time > ? AND time <= ? AND phone = ?
              GROUP BY
                  from_user_phone
          ) c ON u.phone = c.phone
      GROUP BY
          u.phone
      ORDER BY
          u.time DESC;
      `,
    [
      startTime,
      endTime,
      startTime,
      endTime,
      startTime,
      endTime,
      startTime,
      endTime,
      phone,
    ],
  );

  return rows;
};

const getUserLevels = (rows, userCode) => {
  const maxLevel = 10;
  const inviteMap = createInviteMap(rows);
  //console.log(inviteMap,"inviteMap");
  const usersByLevels = getLevelUsers(inviteMap, userCode, 1, maxLevel);
  //console.log(usersByLevels,"usersByLevels")
  return { usersByLevels, level1Referrals: inviteMap[userCode] };

};

const createInviteMap = (rows) => {
  const inviteMap = {};

  rows.forEach(({ invite, ...user }) => { // Destructuring to get invite and the rest of the user data
    if (!inviteMap[invite]) {
      inviteMap[invite] = [];
    }
    inviteMap[invite].push(user); // Only push the user data without invite
  });

  return inviteMap;
};

const getLevelUsers = (inviteMap, userCode, currentLevel, maxLevel) => {
  if (currentLevel > maxLevel) return [];

  const levelUsers = inviteMap[userCode] || [];
  //console.log(levelUsers,"levelUsers")
  if (levelUsers.length === 0) return [];

  return levelUsers.flatMap((user) => {
    // Get the users from the next level
    const nextLevelUsers = getLevelUsers(inviteMap, user.code, currentLevel + 1, maxLevel);
    // Return the user along with their level and the next level users
    return [{ ...user, user_level: currentLevel }, ...nextLevelUsers];
  });
};

const myReferral = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `code`,phone, `invite`,`name_user` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];
    const startDate = +req.query.startDate;
    const endDate = getTimeBasedOnDate(startDate);

    const searchFromUid = req.query.id || "";
    const levelFilter = req.query.level;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    // const levelFilter = "";

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userStatsData = await userStats(startDate, endDate, user.phone);
    const { usersByLevels = [] } = getUserLevels(userStatsData, user.code);
    //console.log(usersByLevels,"usersByLevels")

    // const filteredUsers = usersByLevels.filter(user => user.time >= startDate && user.id_user.includes(searchFromUid) && (levelFilter !== "All" ? user.user_level === +levelFilter : true));
    const filteredUsers = usersByLevels.filter(
      (user) =>
        user.id_user.includes(searchFromUid) &&
        (levelFilter !== "All" ? user.user_level === +levelFilter : true),
    );
    // const usersFilterByPositiveData = filteredUsers.filter(
    //   (user) =>
    //     user.total_deposit_number > 0 ||
    //     user.total_deposit_amount > 0 ||
    //     user.total_bets > 0,
    // );

    const sortedUsersByBet = filteredUsers.sort((a, b) => b.total_bet_amount - a.total_bet_amount);

    const subordinatesRechargeQuantity = filteredUsers.reduce(
      (acc, curr) => acc + curr.total_deposit_number,
      0,
    );
    const subordinatesRechargeAmount = filteredUsers.reduce(
      (acc, curr) => acc + +curr.total_deposit_amount,
      0,
    );
    /**********************for bets ********************************** */
    const subordinatesWithBetting = filteredUsers.filter(
      (user) => user.total_bets > 0,
    );
    const subordinatesWithBettingCount = subordinatesWithBetting.length;
    const subordinatesBettingAmount = subordinatesWithBetting
      .reduce((acc, curr) => acc + +curr.total_bet_amount, 0)
      .toFixed();

    /**********************for first deposit ********************************** */
    const subordinatesWithFirstDeposit = filteredUsers.filter(
      (user) => user.total_deposit_number === 1,
    );

    let subordinatesWithFirstDepositCount = 0;
    let subordinatesWithFirstDepositAmount = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0'); // Add 1 to month and pad with '0'
    const day = String(yesterday.getDate()).padStart(2, '0'); // Pad single digits with '0'
    const yesterdayString = `${year}-${month}-${day}`;
    const yesydm = `${year}-${day}-${month}`;
    let firstdepositephoneNumbers = subordinatesWithFirstDeposit.map(user => user.phone);

    const [firstrechargesByPhone] = await connection.query(`SELECT phone, COUNT(phone) AS recharge_count FROM recharge WHERE status = 1 AND phone IN (?) GROUP BY phone`,
      [firstdepositephoneNumbers.length > 0 ? firstdepositephoneNumbers : ['invalid-phone']]);
    for (const recharge of firstrechargesByPhone) {
      // console.log(recharge.recharge_count)
      if (recharge.recharge_count === 1) {
        const [rechargeDetails] = await connection.query(`SELECT phone,money,today FROM recharge WHERE status = 1 AND phone = ? ORDER BY today DESC LIMIT 1`, [recharge.phone]);
        if (rechargeDetails.length > 0 && rechargeDetails[0].today.slice(0, 10) === yesydm) {
          subordinatesWithFirstDepositCount++;
          subordinatesWithFirstDepositAmount = subordinatesWithFirstDepositAmount + rechargeDetails[0].money;
        }
      }
    }

    //for pagination
    const paginatedUsers = sortedUsersByBet.slice(
      offset,
      offset + limit,
    );
    const totalUsers = sortedUsersByBet.length;
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      status: true,
      meta: {
        totalPages,
        currentPage: page,
      },
      data: paginatedUsers,
      subordinatesRechargeQuantity,
      subordinatesRechargeAmount,
      subordinatesWithBettingCount,
      subordinatesBettingAmount,
      subordinatesWithFirstDepositCount,
      subordinatesWithFirstDepositAmount,
      message: "Successfully fetched subordinates data",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const fetchTodayRecharges = async (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const timeNow = new Date(); // Get the current timestamp

  try {
    // Query to select today's recharges that have status = 1
    const [results] = await connection.query(`
      SELECT r.phone AS rechargePhone, r.money AS rechargeMoney, u.money AS userMoney 
      FROM recharge r
      JOIN users u ON r.phone = u.phone
      WHERE DATE(r.today) = CURDATE() AND r.status = 1
    `);

    if (results.length === 0) {
      // If no recharges are found, send a response with a message
      return res.status(200).json({ message: 'No recharges found for today' });
    }

    // Calculate ROI and update user money
    const usersWithUpdatedAmounts = await Promise.all(results.map(async result => {
      const rechargeMoney = result.rechargeMoney;
      const userMoney = result.userMoney;

      // Assume getROIPercentage is a predefined function that returns the ROI percentage based on userMoney
      const roiPercentage = getROIPercentage(userMoney);
      const roiAmount = rechargeMoney * (roiPercentage / 100);
      const updatedMoney = userMoney + roiAmount;

      console.log(`User Phone: ${result.rechargePhone}, Previous Money: ${userMoney}, ROI: ${roiAmount}, Updated Money: ${updatedMoney}`);

      // Update the user's money in the database
      await connection.query(
        'UPDATE users SET money = ? WHERE phone = ?',
        [updatedMoney, result.rechargePhone]
      );
      console.log(`User ${result.rechargePhone} updated successfully!`);

      // Insert the reward into the claimed_rewards table
      await connection.query(
        "INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES ('R', ?, ?, 'ROI', ?, 1)",
        [result.rechargePhone, roiAmount, timeNow]
      );
      console.log(`Reward inserted for user ${result.rechargePhone} successfully!`);

      // Return user data for response
      return {
        phone: result.rechargePhone,
        roiAmount,
        updatedMoney,
      };
    }));

    // Send the final response with updated user data
    res.status(200).json({ todayRecharges: results, usersWithUpdatedAmounts });

  } catch (error) {
    // Log the error and send an error response
    console.error('Error fetching today\'s recharges:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching recharges and users.' });
  }
};


const getROIPercentage = (userMoney) => {
  if (userMoney >= 100 && userMoney <= 1000) {
    return 0.1;
  } else if (userMoney >= 1001 && userMoney <= 25000) {
    return 0.15;
  } else if (userMoney >= 25001 && userMoney <= 50000) {
    return 0.20;
  } else if (userMoney >= 50001 && userMoney <= 100000) {
    return 0.25;
  } else if (userMoney >= 100001 && userMoney <= 500000) {
    return 0.30;
  }
  return 0;
};

const userLevelInfo = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const timeNow = new Date();

  try {
    const [results] = await connection.query(`
      SELECT r.phone AS rechargePhone, r.money AS rechargeMoney, u.money AS userMoney, u.level AS userLevel
      FROM recharge r
      JOIN users u ON r.phone = u.phone
      WHERE DATE(r.today) = CURDATE() AND r.status = 1
    `);

    if (results.length === 0) {
      return res.status(200).json({ message: 'No recharges found for today' });
    }

    const usersWithUpdatedAmounts = results.map(result => {
      const { rechargeMoney, userMoney, userLevel } = result; // Destructure userLevel
      const roiPercentage = getBonusPercentage(userLevel); // Use userLevel
      const roiAmount = rechargeMoney * (roiPercentage / 100);
      const updatedMoney = userMoney + roiAmount;

      console.log(`User Phone: ${result.rechargePhone}, Previous Money: ${userMoney}, ROI: ${roiAmount}, Updated Money: ${updatedMoney}`);

      return {
        phone: result.rechargePhone,
        roiAmount,
        updatedMoney,
      };
    });

    // Using Promise.all without wrapping in new Promise
    await Promise.all(usersWithUpdatedAmounts.map(async user => {
      try {
        await connection.query(
          'UPDATE users SET money = ? WHERE phone = ?',
          [user.updatedMoney, user.phone]
        );
        console.log(`User ${user.phone} updated successfully!`);

        // Check if roiAmount is greater than 0 before inserting
        if (user.roiAmount > 0) {
          await connection.query(
            "INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES ('B', ?, ?, 'TEAM RECHARGE BONUS', ?, 1)",
            [user.phone, user.roiAmount, timeNow]
          );
          console.log(`Reward inserted for user ${user.phone} successfully!`);
        } else {
          console.log(`No reward to insert for user ${user.phone} as ROI amount is 0.`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.phone}:`, error);
        throw error; // Throw error to be caught by Promise.all
      }
    }));

    res.status(200).json({ todayRecharges: results, usersWithUpdatedAmounts });

  } catch (error) {
    console.error('Error fetching today\'s recharges:', error);
    res.status(500).json({ error: 'An error occurred while fetching recharges and users.' });
  }
};

const getBonusPercentage = (userLevel) => {
  switch (true) {
    case userLevel === 1:
      return 1.6;
    case userLevel === 2:
      return 1.4;
    case userLevel === 3:
      return 1.2;
    case userLevel === 4:
      return 1.0;
    case userLevel === 5:
      return 0.8;
    case userLevel >= 6 && userLevel <= 10:
      return 0.4;
    case userLevel >= 11 && userLevel <= 20:
      return 0.2;
    default:
      return 0;
  }
};

const ranks = [
  { rank: 1, minDeposit: 1000, minTrade: 500, direct: 3, team: 25, activeTeam: 10, totalTrade: 25000, salary: 300, income: 0.009 },
  { rank: 2, minDeposit: 2000, minTrade: 1000, direct: 5, team: 50, activeTeam: 25, totalTrade: 50000, salary: 500, income: 0.017 },
  { rank: 3, minDeposit: 3000, minTrade: 1500, direct: 5, team: 100, activeTeam: 50, totalTrade: 100000, salary: 1000, income: 0.024 },
  { rank: 4, minDeposit: 4000, minTrade: 2000, direct: 6, team: 150, activeTeam: 75, totalTrade: 150000, salary: 2500, income: 0.03 },
  { rank: 5, minDeposit: 5000, minTrade: 2500, direct: 6, team: 200, activeTeam: 100, totalTrade: 200000, salary: 4000, income: 0.035 },
  { rank: 6, minDeposit: 6000, minTrade: 3000, direct: 7, team: 250, activeTeam: 125, totalTrade: 250000, salary: 6000, income: 0.04 },
  { rank: 7, minDeposit: 7000, minTrade: 3500, direct: 7, team: 300, activeTeam: 150, totalTrade: 300000, salary: 8000, income: 0.045 },
  { rank: 8, minDeposit: 8000, minTrade: 4000, direct: 8, team: 350, activeTeam: 175, totalTrade: 400000, salary: 10000, income: 0.05 },
  { rank: 9, minDeposit: 9000, minTrade: 4500, direct: 8, team: 500, activeTeam: 250, totalTrade: 1000000, salary: 12000, income: 0.055 },
  { rank: 10, minDeposit: 10000, minTrade: 5000, direct: 10, team: 700, activeTeam: 350, totalTrade: 2000000, salary: 15000, income: 0.06 },
];

// Function to determine rank based on user performance
const determineRank = (user) => {
  for (const rank of ranks) {
    if (
      user.total_deposit_amount >= rank.minDeposit &&
      user.total_bet_amount >= rank.minTrade &&
      user.total_directs >= rank.direct &&
      user.total_team >= rank.team &&
      user.active_team >= rank.activeTeam &&
      user.total_trade >= rank.totalTrade
    ) {
      return rank.rank;
    }
  }
  return null; // Return null if no rank is applicable
};

const myTeamRank = async (req, res) => {
  try {
    const authToken = req.cookies.auth;
    const [userRow] = await connection.execute(
      "SELECT `code`, phone, `invite`, `name_user` FROM `users` WHERE `token` = ? AND `veri` = 1",
      [authToken],
    );
    const user = userRow?.[0];

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userStatsData = await userStats(); // Adjust this according to your data fetching logic
    const { usersByLevels = [] } = getUserLevels(userStatsData, user.code);

    const usersWithRanks = usersByLevels.map(user => {
      const rank = determineRank(user);
      return {
        ...user,
        rank,
      };
    });

    res.json({
      status: true,
      data: usersWithRanks,
      message: "Successfully fetched subordinates data with ranks",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const incomeController = {
  firstListRecharge,
  SalaryRecord,
  dailySalaryRecord,
  myReferral,
  franchiseIncome,
  fetchTodayRecharges,
  getROIPercentage,
  userLevelInfo,
  myTeamRank,
  roiIncome,
  recruiterSalaryRecord,
};

export default incomeController;