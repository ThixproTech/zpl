import connection from "../config/connectDB.js";

const timeNow = Date.now();
export const generateClaimRewardID = () => {
    return Math.floor(Math.random() * 2147483647) + 1;
};
const todayDate = new Date().toISOString().split("T")[0];

//
// ROI Slab Income Start Here
//
const updateRemainingBet = async (phone, betAmount) => {
    try {
        const [userInfo] = await connection.query("SELECT id_user, phone FROM users WHERE phone = ?", [phone]);

        if (!userInfo.length) {
            return { success: false, message: "User not found." };
        }

        const user = userInfo[0];

        const [lastRecharge] = await connection.query(
            `SELECT id, remaining_bet FROM recharge WHERE phone = ? AND status = 1 ORDER BY time_remaining_bet DESC LIMIT 1`,
            [phone]
        );

        if (!lastRecharge.length) {
            return { success: false, message: "No active recharge found." };
        }

        let lastRechargeRemainingBet = Number(lastRecharge[0].remaining_bet) || 0;
        const lastRechargeId = lastRecharge[0].id;

        // console.log(`User: ${phone}, Bet Amount: ${betAmount}, Current Remaining Bet: ${lastRechargeRemainingBet}`);

        if (lastRechargeRemainingBet > 0) {
            lastRechargeRemainingBet -= betAmount;

            if (lastRechargeRemainingBet < 0) {
                lastRechargeRemainingBet = 0;
            }

            // Update remaining bet in the database
            const [updateResult] = await connection.query(
                `UPDATE recharge SET remaining_bet = ?, time_remaining_bet = ? WHERE id = ? AND status = 1`,
                [lastRechargeRemainingBet, timeNow, lastRechargeId]
            );

            // console.log(`Updated remaining bet: ${lastRechargeRemainingBet}, Affected Rows: ${updateResult.affectedRows}`);
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

const rewardCollectAutoForAllUsers = async () => {
    try {
        const [users] = await connection.query("SELECT * FROM users WHERE veri = 1");

        if (!users.length) {
            console.log("No verified users found.");
            return;
        }

        console.log(`Processing ${users.length} users...`);

        for (let user of users) {
            try {
                await rewardCollectAuto(user);
                console.log(`Reward processed for user: ${user.phone}`);
            } catch (error) {
                console.error(`Error processing reward for user ${user.phone}:`, error);
            }
        }

        console.log("Reward processing completed for all users.");
    } catch (error) {
        console.error("Error fetching users:", error);
    }
};

const rewardCollectAuto = async (user) => {
    try {

        const reward_id = generateClaimRewardID();

        const [betResult] = await connection.query(
            "SELECT SUM(betAmount) AS total_bet_amount FROM igtechbets WHERE phone = ? AND created_at LIKE ?",
            [user.phone, `${todayDate}%`]
        );

        const [result_5dBetResult] = await connection.query(
            "SELECT SUM(money) AS total_bet_amount FROM result_5d WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            [user.phone, todayDate]
        );

        const [k3BinResult] = await connection.query(
            "SELECT SUM(money) AS total_bet_amount FROM result_k3 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            [user.phone, todayDate]
        );

        const [wingoBetResult] = await connection.query(
            "SELECT SUM(money) AS total_bet_amount FROM minutes_1 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            [user.phone, todayDate]
        );

        const [trxWingoBetResult] = await connection.query(
            "SELECT SUM(money) AS total_bet_amount FROM trx_wingo_bets WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            [user.phone, todayDate]
        );

        let totalBetAmount =
            (parseFloat(betResult[0].total_bet_amount) || 0) +
            (parseFloat(result_5dBetResult[0].total_bet_amount) || 0) +
            (parseFloat(k3BinResult[0].total_bet_amount) || 0) +
            (parseFloat(wingoBetResult[0].total_bet_amount) || 0) +
            (parseFloat(trxWingoBetResult[0].total_bet_amount) || 0);

        let betSlabAmount = totalBetAmount || 0;
        let betSlabBonusPerAmount = 0;

        if (betSlabAmount > 100 && betSlabAmount < 1001) {
            betSlabBonusPerAmount = betSlabAmount * 0.06 / 100;
        } else if (betSlabAmount > 1000 && betSlabAmount < 25001) {
            betSlabBonusPerAmount = betSlabAmount * 0.07 / 100;
        } else if (betSlabAmount > 25000 && betSlabAmount < 50001) {
            betSlabBonusPerAmount = betSlabAmount * 0.08 / 100;
        } else if (betSlabAmount > 50000 && betSlabAmount < 100001) {
            betSlabBonusPerAmount = betSlabAmount * 0.09 / 100;
        } else if (betSlabAmount > 100000 && betSlabAmount < 500000) {
            betSlabBonusPerAmount = betSlabAmount * 0.10 / 100;
        }

        if (betSlabBonusPerAmount > 0) {
            let timeNow = Date.now();

            await connection.query(
                "INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES (?,?,?,?,?,?)",
                [reward_id, user.phone, betSlabBonusPerAmount, "SELF TRADE BONUS", timeNow, 1]
            );

            // Uncomment for updating Remaining Bet //
            // await updateRemainingBet(user.phone, betSlabBonusPerAmount); 

            await connection.execute(
                "UPDATE `users` SET `money` = `money` + ? WHERE `token` = ?",
                [betSlabBonusPerAmount, user.token]
            );

            // console.log(`Bonus updated for ${user.phone}: ${betSlabBonusPerAmount}`);
        }
    } catch (error) {
        console.error(`Error processing rewards for ${user.phone}:`, error);
    }
};
//
// ROI Slab Income End Here
//


//
// Betting Income Start
// 
const commissionLevels = [
    0.70,    // Level 1 - 0.70%
    0.50, // Level 2 - 0.50%
    0.40, // Level 3 - 0.40%
    0.30, // Level 4 - 0.30%
    0.20, // Level 5 - 0.20%
    0.10, // Level 6 - 0.10%
    0.10, // Level 7 - 0.10%
    0.10, // Level 8 - 0.10%
    0.10, // Level 9 - 0.10%
    0.10  // Level 10 - 0.10%
];

/**
 * Distribute commission up to 10 levels based on invite (code column)
 * @param {string} userPhone - Phone number of the user placing the bet
 * @param {number} betAmount - Amount of the bet placed
 */
const distributeCommission = async (userPhone, betAmount) => {
    const reward_id = generateClaimRewardID();
    try {
        let currentPhone = userPhone;
        let level = 0;
        let commissionUpdates = [];

        while (level < commissionLevels.length) {
            // Find the referrer: match invite with code
            const [referrerData] = await connection.query(
                "SELECT phone, code, invite FROM users WHERE code = (SELECT invite FROM users WHERE phone = ?)",
                [currentPhone]
            );

            if (!referrerData.length) break; // No referrer, stop

            currentPhone = referrerData[0].phone; // Move up the referral chain
            let commissionAmount = (betAmount * commissionLevels[level]) / 100;

            if (commissionAmount > 0) {
                commissionUpdates.push({ phone: currentPhone, amount: commissionAmount });
            }

            // console.log(`Level ${level + 1}: User ${currentPhone} gets ${commissionAmount}`);
            level++;
        }

        // Batch update commissions
        if (commissionUpdates.length > 0) {
            for (const update of commissionUpdates) {
                await connection.query(
                    "UPDATE users SET money = money + ? WHERE phone = ?",
                    [update.amount, update.phone]
                );

                if(update.amount > 0){
                    await connection.query(
                        "INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES (?,?,?,?,?,?)",
                        [reward_id, update.phone, update.amount, "TEAM BETTING INCOME BONUS", timeNow, 1]
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error distributing commission:", error);
    }
};

/**
 * Place a bet and calculate the total bet amount for today
 */
const bettingReward = async () => {
    try {
        // Fetch all verified users
        const [users] = await connection.query("SELECT phone FROM users WHERE veri = 1");

        if (!users.length) {
            return { success: false, message: "No verified users found." };
        }

        const todayDate = new Date().toISOString().split("T")[0];

        for (const user of users) {
            let userPhone = user.phone;

            // Fetch all bet amounts for today
            const queries = [
                {
                    sql: "SELECT SUM(betAmount) AS total FROM igtechbets WHERE phone = ? AND created_at LIKE ?",
                    params: (phone, date) => [phone, `${date}%`]
                },
                {
                    sql: "SELECT SUM(money) AS total FROM result_5d WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                    params: (phone, date) => [phone, date]
                },
                {
                    sql: "SELECT SUM(money) AS total FROM result_k3 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                    params: (phone, date) => [phone, date]
                },
                {
                    sql: "SELECT SUM(money) AS total FROM minutes_1 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                    params: (phone, date) => [phone, date]
                },
                {
                    sql: "SELECT SUM(money) AS total FROM trx_wingo_bets WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                    params: (phone, date) => [phone, date]
                }
            ];

            let betAmount = 0;
            for (const queryObj of queries) {
                const [result] = await connection.query(queryObj.sql, queryObj.params(userPhone, todayDate));
                betAmount += parseFloat(result[0].total || 0);
            }

            // console.log(`User ${userPhone} Total Bet: ${betAmount}`);

            // Start commission distribution
            if (betAmount > 0) {
                await distributeCommission(userPhone, betAmount);
            }
        }

        return { success: true, message: "Bet processing completed!" };
    } catch (error) {
        console.error("Error:", error);
        return { success: false, message: "Error in bet processing." };
    }
};
//
// Betting Income End
//


//
// Team Recharge Income Start
// 
const rechargeCommissionLevels = [
    1.6,    // Level 1 - 1.6%
    1.4, // Level 2 - 1.4%
    1.2, // Level 3 - 1.2%
    1, // Level 4 - 1%
    0.8, // Level 5 - 0.8%
    0.4, // Level 6 - 0.4%
    0.4, // Level 7 - 0.4%
    0.4, // Level 8 - 0.4%
    0.4, // Level 9 - 0.4%
    0.4,  // Level 10 - 0.4%
    0.2,  // Level 11 - 0.2%
    0.2,  // Level 12 - 0.2%
    0.2,  // Level 13 - 0.2%
    0.2,  // Level 14 - 0.2%
    0.2,  // Level 15 - 0.2%
    0.2,  // Level 16 - 0.2%
    0.2,  // Level 17 - 0.2%
    0.2,  // Level 18 - 0.2%
    0.2,  // Level 19 - 0.2%
    0.2,  // Level 20 - 0.2%
];

/**
 * Distribute commission up to 20 levels based on invite (code column)
 * @param {string} userPhone - Phone number of the user placing the bet
 * @param {number} rechargeAmount - Amount of the bet placed
 */
const distributeRechargeCommission = async (userPhone, rechargeAmount) => {
    try {
        let currentPhone = userPhone;
        let level = 0;
        let commissionUpdates = [];

        const reward_id = generateClaimRewardID();

        while (level < rechargeCommissionLevels.length && currentPhone) {
            // Fetch referrer's phone using invite (code relationship)
            const [referrerData] = await connection.query(
                "SELECT phone, code, invite FROM users WHERE code = (SELECT invite FROM users WHERE phone = ?) LIMIT 1",
                [currentPhone]
            );

            if (!referrerData.length) break; // No referrer found, exit loop

            currentPhone = referrerData[0].phone; // Move up the referral chain
            let commissionAmount = (rechargeAmount * rechargeCommissionLevels[level]) / 100;

            if (commissionAmount > 0) {
                commissionUpdates.push({ phone: currentPhone, amount: commissionAmount });
            }

            console.log(`Level ${level + 1}: User ${currentPhone} gets ${commissionAmount}`);
            level++;
        }

        // Batch update commissions
        if (commissionUpdates.length > 0) {
            // Bulk update money balance
            const updateQueries = commissionUpdates.map(update =>
                connection.query("UPDATE users SET money = money + ? WHERE phone = ?", [update.amount, update.phone])
            );
            await Promise.all(updateQueries);

            // Bulk insert claimed rewards
            const values = commissionUpdates.map(update =>
                `(${reward_id}, '${update.phone}', ${update.amount}, 'TEAM RECHARGE BONUS', '${timeNow}', 1)`
            ).join(",");

            if(update.amount > 0){
                await connection.query(
                    `INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES ${values}`
                );
            }
        }
    } catch (error) {
        console.error("Error distributing commission:", error);
    }
};


/**
 * Place a Recharge and calculate the total Recharge amount for today
 */
const teamRechargeReward = async () => {
    try {
        // Fetch all verified users
        const [users] = await connection.query("SELECT phone FROM users WHERE veri = 1");

        if (!users.length) {
            return { success: false, message: "No verified users found." };
        }

        const todayDate = new Date().toISOString().split("T")[0];

        for (const user of users) {
            let userPhone = user.phone;

            // Fetch all Recharge amounts for today
            const queries = [
                {
                    sql: "SELECT SUM(money) AS total FROM recharge WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                    params: (phone, date) => [phone, date]
                }
            ];

            let rechargeAmount = 0;
            for (const queryObj of queries) {
                const [result] = await connection.query(queryObj.sql, queryObj.params(userPhone, todayDate));
                rechargeAmount += parseFloat(result[0].total || 0);
            }

            console.log(`User ${userPhone} Total Recharge: ${rechargeAmount}`);

            // Start commission distribution
            if (rechargeAmount > 0) {
                await distributeRechargeCommission(userPhone, rechargeAmount);
            }
        }

        return { success: true, message: "Recharge processing completed!" };
    } catch (error) {
        console.error("Error:", error);
        return { success: false, message: "Error in Recharge processing." };
    }
};
//
// Team Recharge Income End
//


//
// Top Recruiter Bonus Start
// 
const distributeRecruiterCommission = async (userPhone, totalUser, rechargeAmount, userInviteCode) => {
    try {
        if (totalUser <= 0) return; // No invites, no reward

        const reward_id = generateClaimRewardID();
        let commissionUpdates = 0;

        if (totalUser > 10 && rechargeAmount > 49999) {
            commissionUpdates += 2500;
        } else if (totalUser > 5 && rechargeAmount > 24999) {
            commissionUpdates += 1000;
        }

        if (commissionUpdates > 0) {
            await connection.query("UPDATE users SET money = money + ? WHERE code = ?", [commissionUpdates, userInviteCode]);

            const values = `(${reward_id}, '${userPhone}', ${commissionUpdates}, 'TOP RECRUITER BONUS', '${timeNow}', 1)`;

            if(commissionUpdates > 0){
                await connection.query(
                    `INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES ${values}`
                );
            }
        }
    } catch (error) {
        console.error("Error distributing commission:", error);
    }
};

const topRecruiterReward = async () => {
    try {
        const [users] = await connection.query("SELECT phone, code FROM users WHERE veri = 1");

        if (!users.length) {
            return { success: false, message: "No verified users found." };
        }

        for (const user of users) {
            let userPhone = user.phone;
            let userInviteCode = user.code;

            const [userData] = await connection.query(
                "SELECT COUNT(*) AS total FROM users WHERE invite = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                [userInviteCode, todayDate]
            );
            let totalUser = userData[0].total || 0;

            const [rechargeResult] = await connection.query(
                "SELECT SUM(money) AS total FROM recharge WHERE phone IN (SELECT phone FROM users WHERE invite = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?)",
                [userInviteCode, todayDate]
            );
            let rechargeAmount = parseFloat(rechargeResult[0].total || 0);

            // console.log(`User: ${userPhone}, Invited Users: ${totalUser}, Total Recharge: ${rechargeAmount}`);

            if (totalUser > 0) {
                await distributeRecruiterCommission(userPhone, totalUser, rechargeAmount, userInviteCode);
            }
        }

        return { success: true, message: "Top recruiter reward processing completed!" };
    } catch (error) {
        console.error("Error:", error);
        return { success: false, message: "Error in processing." };
    }
};
//
// Top Recruiter Bonus End
//

const getTeamByCode = async (code) => {
    let allMembers = new Set(); // Use a Set to avoid duplicates
    let queue = [code];

    while (queue.length > 0) {
        let currentCode = queue.shift();

        const [teamMembers] = await connection.query(
            `SELECT code FROM users WHERE invite = ?`, 
            [currentCode]
        );

        if (teamMembers.length > 0) {
            for (let user of teamMembers) {
                if (!allMembers.has(user.code)) {
                    allMembers.add(user.code);
                    queue.push(user.code);
                }
            }
        }
    }

    return Array.from(allMembers); // Convert Set to Array before returning
};

// Get active team count and total trade amount
const getTeamData = async (userInviteCode, todayDate) => {
    try {
        let allTeamMembers = await getTeamByCode(userInviteCode);

        if (allTeamMembers.length === 0) {
            return { activeTeamCount: 0, totalTeamTradeAmount: 0, totalTeamCount: 0 };
        }

        // Fetch all team member phone numbers
        const [phoneNumbersResult] = await connection.query(
            `SELECT phone FROM users WHERE code IN (?)`,
            [allTeamMembers]
        );
        let phoneNumbers = phoneNumbersResult.map(user => user.phone);

        if (phoneNumbers.length === 0) {
            return { activeTeamCount: 0, totalTeamTradeAmount: 0, totalTeamCount: allTeamMembers.length };
        }

        // Fetch active team count
        const activeTeamQueries = [
            "SELECT COUNT(DISTINCT phone) AS total FROM igtechbets WHERE phone IN (?) AND DATE(created_at) LIKE ?",
            "SELECT COUNT(DISTINCT phone) AS total FROM result_5d WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            "SELECT COUNT(DISTINCT phone) AS total FROM result_k3 WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            "SELECT COUNT(DISTINCT phone) AS total FROM minutes_1 WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            "SELECT COUNT(DISTINCT phone) AS total FROM trx_wingo_bets WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?"
        ];

        let activeTeamCount = 0;
        for (let query of activeTeamQueries) {
            const [result] = await connection.query(query, [phoneNumbers, todayDate]);
            activeTeamCount += parseFloat(result[0]?.total || 0);
        }

        // Fetch total team trade amount
        const tradeAmountQueries = [
            "SELECT SUM(betAmount) AS total FROM igtechbets WHERE phone IN (?) AND DATE(created_at) LIKE ?",
            "SELECT SUM(money) AS total FROM result_5d WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            "SELECT SUM(money) AS total FROM result_k3 WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            "SELECT SUM(money) AS total FROM minutes_1 WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
            "SELECT SUM(money) AS total FROM trx_wingo_bets WHERE phone IN (?) AND DATE(FROM_UNIXTIME(time / 1000)) = ?"
        ];

        let totalTeamTradeAmount = 0;
        for (let query of tradeAmountQueries) {
            const [result] = await connection.query(query, [phoneNumbers, todayDate]);
            totalTeamTradeAmount += parseFloat(result[0]?.total || 0);
        }

        return { activeTeamCount, totalTeamTradeAmount, totalTeamCount: allTeamMembers.length };
    } catch (error) {
        console.error("Error fetching team data:", error);
        return { activeTeamCount: 0, totalTeamTradeAmount: 0, totalTeamCount: 0 };
    }
};


//
// RANK INCOME ON SLAB Start
// 
/**
 * Determine the rank of the user based on conditions.
 * @returns {Object} - Rank details (salary and commission percentage)
 */
const determineUserRank = (selfDepositAmount, selfTradeAmount, totalSelfTeamCount, activeTeamCount, totalTeamCount, totalTeamTradeAmount) => {
    if (
        selfDepositAmount >= 10000 && selfTradeAmount >= 5000 &&
        totalSelfTeamCount >= 10 && activeTeamCount >= 350 &&
        totalTeamCount >= 700 && totalTeamTradeAmount >= 2000000
    ) {
        return { rank: 10, salary: 15000, commission: 6.0 };
    }
    if (
        selfDepositAmount >= 9000 && selfTradeAmount >= 4500 &&
        totalSelfTeamCount >= 8 && activeTeamCount >= 250 &&
        totalTeamCount >= 500 && totalTeamTradeAmount >= 1000000
    ) {
        return { rank: 9, salary: 12000, commission: 5.5 };
    }
    if (
        selfDepositAmount >= 8000 && selfTradeAmount >= 4000 &&
        totalSelfTeamCount >= 8 && activeTeamCount >= 175 &&
        totalTeamCount >= 350 && totalTeamTradeAmount >= 400000
    ) {
        return { rank: 8, salary: 10000, commission: 5.0 };
    }
    if (
        selfDepositAmount >= 7000 && selfTradeAmount >= 3500 &&
        totalSelfTeamCount >= 7 && activeTeamCount >= 150 &&
        totalTeamCount >= 300 && totalTeamTradeAmount >= 300000
    ) {
        return { rank: 7, salary: 8000, commission: 4.5 };
    }
    if (
        selfDepositAmount >= 6000 && selfTradeAmount >= 3000 &&
        totalSelfTeamCount >= 7 && activeTeamCount >= 125 &&
        totalTeamCount >= 250 && totalTeamTradeAmount >= 250000
    ) {
        return { rank: 6, salary: 6000, commission: 4.0 };
    }
    if (
        selfDepositAmount >= 5000 && selfTradeAmount >= 2500 &&
        totalSelfTeamCount >= 6 && activeTeamCount >= 100 &&
        totalTeamCount >= 200 && totalTeamTradeAmount >= 200000
    ) {
        return { rank: 5, salary: 4000, commission: 3.5 };
    }
    if (
        selfDepositAmount >= 4000 && selfTradeAmount >= 2000 &&
        totalSelfTeamCount >= 6 && activeTeamCount >= 75 &&
        totalTeamCount >= 125 && totalTeamTradeAmount >= 150000
    ) {
        return { rank: 4, salary: 2500, commission: 3.0 };
    }
    if (
        selfDepositAmount >= 3000 && selfTradeAmount >= 1500 &&
        totalSelfTeamCount >= 5 && activeTeamCount >= 50 &&
        totalTeamCount >= 100 && totalTeamTradeAmount >= 100000
    ) {
        return { rank: 3, salary: 1000, commission: 2.4 };
    }
    if (
        selfDepositAmount >= 2000 && selfTradeAmount >= 1000 &&
        totalSelfTeamCount >= 5 && activeTeamCount >= 25 &&
        totalTeamCount >= 50 && totalTeamTradeAmount >= 50000
    ) {
        return { rank: 2, salary: 500, commission: 1.7 };
    }
    if (
        selfDepositAmount >= 1000 && selfTradeAmount >= 500 &&
        totalSelfTeamCount >= 3 && activeTeamCount >= 10 &&
        totalTeamCount >= 25 && totalTeamTradeAmount >= 25000
    ) {
        return { rank: 1, salary: 300, commission: 0.9 };
    }
    return { rank: 0, salary: 0, commission: 0 }; // No rank
};

/**
 * Distribute commission up to the user's rank level based on invite hierarchy
 */
const distributeRankSlabCommission = async (userPhone, selfDepositAmount, selfTradeAmount, totalSelfTeamCount, activeTeamCount, totalTeamCount, totalTeamTradeAmount) => {
    const reward_id = generateClaimRewardID();
    try {
        // Determine rank
        let { rank, salary, commission } = determineUserRank(selfDepositAmount, selfTradeAmount, totalSelfTeamCount, activeTeamCount, totalTeamCount, totalTeamTradeAmount);

        // If user qualifies for salary, insert salary reward
        if (salary > 0) {
            await connection.query(
                "INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES (?,?,?,?,?,?)",
                [reward_id, userPhone, salary, "SALARY BONUS", timeNow, 1]
            );

            await connection.query(
                "UPDATE users SET money = money + ? WHERE phone = ?",
                [salary, userPhone]
            );
        }

        let currentPhone = userPhone;
        let level = 0;
        let commissionUpdates = [];

        // Distribute commission based on the user's rank (level)
        while (level < rank) { // Use 'rank' instead of rankIncomeSlabCommissionLevels.length
            // Find the referrer
            const [referrerData] = await connection.query(
                "SELECT phone, code, invite FROM users WHERE code = (SELECT invite FROM users WHERE phone = ?)",
                [currentPhone]
            );

            if (!referrerData.length) break;

            currentPhone = referrerData[0].phone;
            let commissionAmount = (selfTradeAmount * commission) / 100; // Use the commission from determineUserRank

            if (commissionAmount > 0) {
                commissionUpdates.push({ phone: currentPhone, amount: commissionAmount });
            }

            level++;
        }

        if (commissionUpdates.length > 0) {
            for (const update of commissionUpdates) {
                await connection.query(
                    "UPDATE users SET money = money + ? WHERE phone = ?",
                    [update.amount, update.phone]
                );

                if(update.amount > 0){
                    await connection.query(
                        "INSERT INTO claimed_rewards (reward_id, phone, amount, type, time, status) VALUES (?,?,?,?,?,?)",
                        [reward_id, update.phone, update.amount, "TEAM RANK INCOME ON SLAB BONUS", timeNow, 1]
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error distributing commission:", error);
    }
};
/**
 * Process rank income slab rewards for all verified users
 */
const rankIncomeSlabReward = async () => {
    try {
        const [users] = await connection.query("SELECT phone, code FROM users WHERE veri = 1");

        if (!users.length) {
            return { success: false, message: "No verified users found." };
        }

        const todayDate = new Date().toISOString().split("T")[0];

        for (const user of users) {
            let userPhone = user.phone;
            let userInviteCode = user.code;

            // Get self trade amount
            const queries = [
                "SELECT SUM(betAmount) AS total FROM igtechbets WHERE phone = ? AND DATE(created_at) LIKE ?",
                "SELECT SUM(money) AS total FROM result_5d WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                "SELECT SUM(money) AS total FROM result_k3 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                "SELECT SUM(money) AS total FROM minutes_1 WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                "SELECT SUM(money) AS total FROM trx_wingo_bets WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?"
            ];

            let selfTradeAmount = 0;
            for (let sql of queries) {
                const [result] = await connection.query(sql, [userPhone, todayDate]);
                selfTradeAmount += parseFloat(result[0]?.total || 0);
            }

            // Get self deposit amount
            const [rechargeResult] = await connection.query(
                "SELECT SUM(money) AS total FROM recharge WHERE phone = ? AND DATE(FROM_UNIXTIME(time / 1000)) = ?",
                [userPhone, todayDate]
            );
            let selfDepositAmount = parseFloat(rechargeResult[0]?.total || 0);

            // Get self team count
            const [selfTeamCountResult] = await connection.query(
                "SELECT COUNT(*) AS total FROM users WHERE invite = ?",
                [userInviteCode]
            );
            let totalSelfTeamCount = selfTeamCountResult[0]?.total || 0;

            // Get active team and total trade amount
            const { activeTeamCount, totalTeamTradeAmount, totalTeamCount } = await getTeamData(userInviteCode, todayDate);

            console.log('Phone:', userPhone);
            console.log('Self Deposit:', selfDepositAmount);
            console.log('Self Trade Amount:', selfTradeAmount);
            console.log('Self Team:', totalSelfTeamCount);
            console.log('Active Team:', activeTeamCount);
            console.log('Total Team:', totalTeamCount);
            console.log('Total Team Trade Amount:', totalTeamTradeAmount);

            if (selfTradeAmount > 0) {
                await distributeRankSlabCommission(
                    userPhone,
                    selfDepositAmount,
                    selfTradeAmount,
                    totalSelfTeamCount,
                    activeTeamCount,
                    totalTeamCount,
                    totalTeamTradeAmount
                );
            }
        }

        return { success: true, message: "Processing completed!" };
    } catch (error) {
        console.error("Error:", error);
        return { success: false, message: "Error in processing." };
    }
};
//
// RANK INCOME ON SLAB End
//


export default {
    rewardCollectAutoForAllUsers,
    bettingReward,
    teamRechargeReward,
    topRecruiterReward,
    rankIncomeSlabReward,
};
