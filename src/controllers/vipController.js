import moment from "moment";
import connection from "../config/connectDB.js";
import {
  REWARD_STATUS_TYPES_MAP,
  REWARD_TYPES_MAP,
} from "../constants/reward_types.js";


const VIP_REWORDS_LEVEL_BY_AMOUNT = [
  { level: 0, amount: 0 },
  { level: 1, amount: 3000 },
  { level: 2, amount: 30000 },
  { level: 3, amount: 500000 },
  { level: 4, amount: 5000000 },
  { level: 5, amount: 10000000 },
  { level: 6, amount: 80000000 },
  { level: 7, amount: 300000000 },
  { level: 8, amount: 1000000000 },
  { level: 9, amount: 5000000000 },
  { level: 10, amount: 9999999999 },
];

const VIP_REWORDS_LIST = [
  {
    level: 0,
    expRequired: 0,
    levelUpReward: 0,
    monthlyReward: 0,
    safePercentage: 0,
    rebateRate: 0,
  },
  {
    level: 1,
    expRequired: 3_000,
    levelUpReward: 70,
    monthlyReward: 30,
    safePercentage: 0.2,
    rebateRate: 0.05,
  },
  {
    level: 2,
    expRequired: 30_000,
    levelUpReward: 200,
    monthlyReward: 90,
    safePercentage: 0.2,
    rebateRate: 0.05,
  },
  {
    level: 3,
    expRequired: 500_000,
    levelUpReward: 710,
    monthlyReward: 310,
    safePercentage: 0.2,
    rebateRate: 0.1,
  },
  {
    level: 4,
    expRequired: 5_000_000,
    levelUpReward: 1990,
    monthlyReward: 910,
    safePercentage: 0.3,
    rebateRate: 0.1,
  },
  {
    level: 5,
    expRequired: 10_000_000,
    levelUpReward: 7110,
    monthlyReward: 1910,
    safePercentage: 0.3,
    rebateRate: 0.1,
  },
  {
    level: 6,
    expRequired: 80_000_000,
    levelUpReward: 16900,
    monthlyReward: 6900,
    safePercentage: 0.3,
    rebateRate: 0.15,
  },
  {
    level: 7,
    expRequired: 300_000_000,
    levelUpReward: 69000,
    monthlyReward: 16900,
    safePercentage: 0.4,
    rebateRate: 0.15,
  },
  {
    level: 8,
    expRequired: 1_000_000_000,
    levelUpReward: 169000,
    monthlyReward: 69000,
    safePercentage: 0.4,
    rebateRate: 0.15,
  },
  {
    level: 9,
    expRequired: 5_000_000_000,
    levelUpReward: 690000,
    monthlyReward: 169000,
    safePercentage: 0.4,
    rebateRate: 0.2,
  },
  {
    level: 10,
    expRequired: 9_999_999_999,
    levelUpReward: 1690000,
    monthlyReward: 690000,
    safePercentage: 0.7,
    rebateRate: 0.3,
  },
];

// helpers ---------------------------------------------------------------------
const getSubordinateDataByPhone = async (phone) => {
  const [gameWingo] = await connection.query(
    "SELECT SUM(money) as totalBettingAmount FROM minutes_1 WHERE phone = ?",
    [phone],
  );
  const gameWingoBettingAmount = gameWingo[0].totalBettingAmount || 0;

  const [gameK3] = await connection.query(
    "SELECT SUM(money) as totalBettingAmount FROM result_k3 WHERE phone = ?",
    [phone],
  );
  const gameK3BettingAmount = gameK3[0].totalBettingAmount || 0;

  const [game5D] = await connection.query(
    "SELECT SUM(money) as totalBettingAmount FROM result_5d WHERE phone = ?",
    [phone],
  );
  const game5DBettingAmount = game5D[0].totalBettingAmount || 0;

  const [gameTrxWingo] = await connection.query(
    "SELECT SUM(money) as totalBettingAmount FROM trx_wingo_bets WHERE phone = ?",
    [phone],
  );
  const gameTrxWingoBettingAmount = gameTrxWingo[0].totalBettingAmount || 0;

  const [apiGame] = await connection.query(
    "SELECT SUM(betAmount) as totalApiAmount FROM igtechbets WHERE phone = ?",
    [phone],
  );
  const apiGameAmount = apiGame[0].totalApiAmount || 0;
  
  return {
    bettingAmount:
      parseInt(gameWingoBettingAmount) +
      parseInt(gameK3BettingAmount) +
      parseInt(game5DBettingAmount) +
      parseInt(apiGameAmount) +
      parseInt(gameTrxWingoBettingAmount),
  };
};

const insertRewordClaim = async ({
  rewardId,
  rewardType,
  phone,
  amount,
  status,
  time,
}) => {
  await connection.execute(
    "INSERT INTO `claimed_rewards` (`reward_id`, `type`, `phone`, `amount`, `status`, `time`) VALUES (?, ?, ?, ?, ?, ?)",
    [rewardId, rewardType, phone, amount, status, time],
  );
};
// ------------------------------------------------------------------------------

// controllers -----------------------------------------------------------------
const releaseVIPLevel = async () => {
    console.log('vip');
  try {
    // let lastMonth1st2amUnix = moment().subtract(1, "months").startOf("month").add(2, "hours").unix();
    // let lastMonth1st2am = moment(lastMonth1st2amUnix * 1000).format("YYYY-MM-DD HH:mm:ss");
    const [users] = await connection.query(
      "SELECT `vip_level`, `phone`, `money` FROM `users`",
    );

    for (let user of users) {
      const { phone, money, vip_level: lastVipLevel } = user;
      const { bettingAmount: expPoint } =
        await getSubordinateDataByPhone(phone);

      const currentVipLevel = VIP_REWORDS_LIST.find((vip, index) => {
        if (VIP_REWORDS_LIST?.[index + 1]) {
          return (
            expPoint >= vip.expRequired &&
            expPoint < VIP_REWORDS_LIST[index + 1].expRequired
          );
        } else {
          return expPoint >= vip.expRequired;
        }
      });

      if (currentVipLevel.level === 0) {
        continue;
      }

    //   if (currentVipLevel.level > lastVipLevel) {
    //     // Update user's VIP level and Insert levelUpReward
    //     await connection.execute(
    //       "UPDATE users SET vip_level = ?, money = money + ?, total_money = total_money + ? WHERE phone = ?",
    //       [
    //         currentVipLevel.level,
    //         currentVipLevel.levelUpReward,
    //         currentVipLevel.levelUpReward,
    //         phone,
    //       ],
    //     );

    //     await insertRewordClaim({
    //       rewardId: currentVipLevel.level,
    //       rewardType: REWARD_TYPES_MAP.VIP_LEVEL_UP_BONUS,
    //       phone,
    //       amount: currentVipLevel.levelUpReward,
    //       status: REWARD_STATUS_TYPES_MAP.SUCCESS,
    //       time: moment().unix(),
    //     });
    //   } else {
    //     await connection.execute(
    //       "UPDATE users SET vip_level = ? WHERE phone = ?",
    //       [currentVipLevel.level, phone],
    //     );
    //   }

      // Insert monthly reward
      await insertRewordClaim({
        rewardId: currentVipLevel.level,
        rewardType: REWARD_TYPES_MAP.VIP_MONTHLY_REWARD,
        phone,
        amount: currentVipLevel.monthlyReward,
        status: REWARD_STATUS_TYPES_MAP.SUCCESS,
        time: moment().unix(),
      });
      await connection.execute(
        "UPDATE users SET money = money + ? WHERE phone = ?",
        [currentVipLevel.monthlyReward, phone],
      );
    }
  } catch (error) {
    console.log(error);
  }
};

// releaseVIPLevel();

const getMyVIPLevelInfo = async (req, res) => {
  try {
    const authToken = req.cookies.auth;

    if (!authToken) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const [users] = await connection.execute(
      "SELECT `phone`, `vip_level` FROM `users` WHERE `token` = ?",
      [authToken],
    );
    const phone = users[0].phone;
    const vipLevel = users[0].vip_level;

    const { bettingAmount: expPoint } = await getSubordinateDataByPhone(phone);

    const payoutDaysLeft = moment()
      .startOf("month")
      .add(1, "month")
      .add(2, "hours")
      .diff(moment(), "days");

    res.status(200).json({
      status: true,
      data: {
        expPoint: expPoint,
        vipLevel: vipLevel,
        payoutDaysLeft: payoutDaysLeft,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const getVIPHistory = async (req, res) => {
  try {
    const authToken = req.cookies.auth;

    if (!authToken) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const [users] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ?",
      [authToken],
    );
    const phone = users[0].phone;

    const [claimedRewards] = await connection.execute(
      "SELECT * FROM `claimed_rewards` WHERE `phone` = ? AND (type = ? OR type = ?)",
      [
        phone,
        REWARD_TYPES_MAP.VIP_LEVEL_UP_BONUS,
        REWARD_TYPES_MAP.VIP_MONTHLY_REWARD,
      ],
    );

    res.status(200).json({
      status: true,
      list: claimedRewards,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const claimVIPLevelUp = async (req, res) => {
  try {
    const authToken = req.cookies.auth;

    if (!authToken) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const [users] = await connection.execute(
      "SELECT `phone` FROM `users` WHERE `token` = ?",
      [authToken],
    );

    if (users.length === 0) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const phone = users[0].phone;
    const level = req.body.level;
    const levelUpReward = req.body.levelUpReward;

    // Update user's claim VIP level and Insert levelUpReward
    await connection.execute(
      "UPDATE users SET claim_vip_level = ?, money = money + ?, total_money = total_money + ? WHERE phone = ?",
      [level, levelUpReward, levelUpReward, phone]
    );

    await insertRewordClaim({
      rewardId: level,
      rewardType: REWARD_TYPES_MAP.VIP_LEVEL_UP_BONUS,
      phone,
      amount: levelUpReward,
      status: REWARD_STATUS_TYPES_MAP.SUCCESS,
      time: moment().unix(),
    });

    // Corrected redirect response
    return res.status(200).json({ status: true, message: "VIP Level Up Claimed", redirectTo: "/vip" });

  } catch (error) {
    console.error("Error claiming VIP Level Up:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

const vipController = {
  releaseVIPLevel,
  getMyVIPLevelInfo,
  getVIPHistory,
  claimVIPLevelUp,
};

export default vipController;

export { VIP_REWORDS_LEVEL_BY_AMOUNT, getSubordinateDataByPhone };
