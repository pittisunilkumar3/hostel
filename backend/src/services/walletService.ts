import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// CUSTOMER WALLET - Matches reference CustomerLogic
// ============================================================

/**
 * Create wallet transaction - matches CustomerLogic::create_wallet_transaction()
 * Reference: /Users/sunil/Downloads/idea/app/CentralLogics/CustomerLogic.php
 */
export async function createWalletTransaction(
  userId: number,
  amount: number,
  transactionType: string,
  reference: string,
  referenceType?: string,
  description?: string
): Promise<any> {
  // Check if wallet is enabled
  const [walletStatus] = await db.execute<RowDataPacket[]>(
    "SELECT value FROM business_settings WHERE `key` = 'wallet_status'"
  );
  if (walletStatus.length === 0 || walletStatus[0].value !== "1") {
    return false;
  }

  // Get current balance
  const [user] = await db.execute<RowDataPacket[]>(
    "SELECT wallet_balance FROM users WHERE id = ?",
    [userId]
  );
  if (user.length === 0) return false;

  const currentBalance = parseFloat(user[0].wallet_balance) || 0;
  const transactionId = uuidv4();

  let debit = 0.0;
  let credit = 0.0;
  let adminBonus = 0.0;

  // Credit types (add fund, refund, loyalty, referral, cashback)
  if (["add_fund_by_admin", "add_fund", "order_refund", "booking_refund", "loyalty_point", "referrer", "CashBack"].includes(transactionType)) {
    credit = amount;
    
    // Calculate bonus for add_fund
    if (transactionType === "add_fund") {
      adminBonus = await calculateWalletBonus(amount);
    }
    // Convert loyalty points to wallet amount
    else if (transactionType === "loyalty_point") {
      const [exchangeRate] = await db.execute<RowDataPacket[]>(
        "SELECT value FROM business_settings WHERE `key` = 'loyalty_point_exchange_rate'"
      );
      const rate = exchangeRate.length > 0 ? parseInt(exchangeRate[0].value) : 10;
      credit = Math.floor(amount / rate);
    }
  }
  // Debit types (order place, booking payment, partial payment)
  else if (["order_place", "booking_payment", "partial_payment"].includes(transactionType)) {
    debit = amount;
  }

  const newBalance = currentBalance + credit + adminBonus - debit;

  try {
    await db.beginTransaction();

    // Update user wallet balance
    await db.execute(
      "UPDATE users SET wallet_balance = ? WHERE id = ?",
      [newBalance, userId]
    );

    // Create transaction record
    await db.execute(
      `INSERT INTO wallet_transactions 
       (user_id, transaction_id, credit, debit, admin_bonus, balance, transaction_type, reference, reference_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, transactionId, credit, debit, adminBonus, newBalance, transactionType, reference, reference || transactionId]
    );

    // Log admin expense for bonus
    if (adminBonus > 0) {
      await db.execute(
        `INSERT INTO account_transactions 
         (from_type, from_id, created_by, method, ref, amount, current_balance, type, created_at, updated_at)
         VALUES ('admin', 1, 'admin', 'wallet_bonus', ?, ?, 0, 'cash_out', NOW(), NOW())`,
        [transactionId, adminBonus]
      );
    }

    await db.commit();

    // Return transaction for non-return types
    if (["loyalty_point", "order_place", "add_fund_by_admin", "referrer", "partial_payment", "booking_payment"].includes(transactionType)) {
      return {
        id: 0,
        user_id: userId,
        transaction_id: transactionId,
        credit,
        debit,
        admin_bonus: adminBonus,
        balance: newBalance,
        transaction_type: transactionType,
        reference,
        reference_id: reference || transactionId,
        created_at: new Date().toISOString(),
      };
    }
    return true;
  } catch (error) {
    await db.rollback();
    console.error("Wallet transaction failed:", error);
    return false;
  }
}

/**
 * Calculate wallet bonus - matches CustomerLogic::calculate_wallet_bonus()
 */
export async function calculateWalletBonus(amount: number): Promise<number> {
  const [bonuses] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM wallet_bonus_rules 
     WHERE status = 1 
     AND (start_date IS NULL OR start_date <= CURDATE())
     AND (end_date IS NULL OR end_date >= CURDATE())
     AND minimum_add_amount <= ?
     ORDER BY bonus_amount DESC 
     LIMIT 1`,
    [amount]
  );

  if (bonuses.length === 0) return 0;

  const bonus = bonuses[0];
  let bonusAmount = 0;

  if (bonus.bonus_type === "percentage") {
    bonusAmount = (amount * bonus.bonus_amount) / 100;
    if (bonus.maximum_bonus_amount > 0 && bonusAmount > bonus.maximum_bonus_amount) {
      bonusAmount = bonus.maximum_bonus_amount;
    }
  } else {
    bonusAmount = bonus.bonus_amount;
  }

  return bonusAmount;
}

/**
 * Create loyalty point transaction - matches CustomerLogic::create_loyalty_point_transaction()
 */
export async function createLoyaltyPointTransaction(
  userId: number,
  reference: string,
  amount: number,
  transactionType: string
): Promise<any> {
  // Check if loyalty points are enabled
  const [loyaltyStatus] = await db.execute<RowDataPacket[]>(
    "SELECT value FROM business_settings WHERE `key` = 'loyalty_point_status'"
  );
  if (loyaltyStatus.length === 0 || loyaltyStatus[0].value !== "1") {
    return true;
  }

  // Get settings
  const [settings] = await db.execute<RowDataPacket[]>(
    "SELECT `key`, value FROM business_settings WHERE `key` IN ('loyalty_point_exchange_rate', 'loyalty_point_item_purchase_point')"
  );
  const settingsMap: Record<string, string> = {};
  settings.forEach((s: any) => { settingsMap[s.key] = s.value; });

  const exchangeRate = parseInt(settingsMap["loyalty_point_exchange_rate"] || "10");
  const purchasePointPercent = parseInt(settingsMap["loyalty_point_item_purchase_point"] || "5");

  let credit = 0;
  let debit = 0;

  if (transactionType === "order_place" || transactionType === "booking_payment") {
    credit = Math.floor(amount * purchasePointPercent / 100);
  } else if (transactionType === "point_to_wallet") {
    debit = amount;
  }

  const [user] = await db.execute<RowDataPacket[]>(
    "SELECT loyalty_points FROM users WHERE id = ?",
    [userId]
  );
  if (user.length === 0) return false;

  const currentPoints = user[0].loyalty_points || 0;
  const newPoints = currentPoints + credit - debit;

  try {
    await db.beginTransaction();

    await db.execute(
      "UPDATE users SET loyalty_points = ? WHERE id = ?",
      [newPoints, userId]
    );

    await db.execute(
      `INSERT INTO loyalty_point_transactions 
       (user_id, transaction_id, credit, debit, balance, transaction_type, reference, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, uuidv4(), credit, debit, newPoints, transactionType, reference]
    );

    await db.commit();

    return {
      user_id: userId,
      credit,
      debit,
      balance: newPoints,
      transaction_type: transactionType,
    };
  } catch (error) {
    await db.rollback();
    console.error("Loyalty point transaction failed:", error);
    return false;
  }
}

/**
 * Convert loyalty points to wallet - matches reference point_to_wallet
 */
export async function convertLoyaltyPointsToWallet(userId: number, points: number): Promise<any> {
  const [user] = await db.execute<RowDataPacket[]>(
    "SELECT loyalty_points FROM users WHERE id = ?",
    [userId]
  );
  if (user.length === 0 || user[0].loyalty_points < points) {
    return false;
  }

  // Get exchange rate
  const [exchangeRate] = await db.execute<RowDataPacket[]>(
    "SELECT value FROM business_settings WHERE `key` = 'loyalty_point_exchange_rate'"
  );
  const rate = exchangeRate.length > 0 ? parseInt(exchangeRate[0].value) : 10;
  const walletAmount = points / rate;

  // Deduct loyalty points
  await createLoyaltyPointTransaction(userId, "point_to_wallet", points, "point_to_wallet");

  // Add to wallet
  return await createWalletTransaction(
    userId,
    walletAmount,
    "loyalty_point",
    "loyalty_point",
    "loyalty_point",
    `Converted ${points} loyalty points to wallet`
  );
}

/**
 * Process booking payment from wallet
 */
export async function processBookingPayment(
  userId: number,
  bookingId: number,
  amount: number
): Promise<any> {
  return await createWalletTransaction(
    userId,
    amount,
    "booking_payment",
    bookingId.toString(),
    "booking",
    `Payment for booking #${bookingId}`
  );
}

/**
 * Process booking refund to wallet
 */
export async function processBookingRefund(
  userId: number,
  bookingId: number,
  amount: number
): Promise<any> {
  // Check if refund to wallet is enabled
  const [refundStatus] = await db.execute<RowDataPacket[]>(
    "SELECT value FROM business_settings WHERE `key` = 'wallet_add_refund'"
  );
  if (refundStatus.length === 0 || refundStatus[0].value !== "1") {
    return false;
  }

  return await createWalletTransaction(
    userId,
    amount,
    "booking_refund",
    bookingId.toString(),
    "booking",
    `Refund for booking #${bookingId}`
  );
}

/**
 * Get customer wallet balance
 */
export async function getCustomerWalletBalance(userId: number): Promise<number> {
  const [user] = await db.execute<RowDataPacket[]>(
    "SELECT wallet_balance FROM users WHERE id = ?",
    [userId]
  );
  return user.length > 0 ? parseFloat(user[0].wallet_balance) || 0 : 0;
}

/**
 * Get customer loyalty points
 */
export async function getCustomerLoyaltyPoints(userId: number): Promise<number> {
  const [user] = await db.execute<RowDataPacket[]>(
    "SELECT loyalty_points FROM users WHERE id = ?",
    [userId]
  );
  return user.length > 0 ? user[0].loyalty_points || 0 : 0;
}

/**
 * Add loyalty points for purchase
 */
export async function addLoyaltyPoints(userId: number, amount: number): Promise<number> {
  const result = await createLoyaltyPointTransaction(
    userId,
    "booking_payment",
    amount,
    "order_place"
  );
  return result ? result.credit : 0;
}

/**
 * Get wallet transactions with pagination
 */
export async function getWalletTransactions(
  userId: number,
  page: number = 1,
  limit: number = 20,
  type?: string
): Promise<any> {
  const offset = (page - 1) * limit;

  let whereClause = "WHERE user_id = ?";
  const params: any[] = [userId];

  // Filter by transaction type - matches reference filtering
  if (type === "order") {
    whereClause += " AND transaction_type IN ('order_place', 'order_refund', 'partial_payment', 'booking_payment', 'booking_refund')";
  } else if (type === "loyalty_point") {
    whereClause += " AND transaction_type IN ('loyalty_point')";
  } else if (type === "add_fund") {
    whereClause += " AND transaction_type IN ('add_fund')";
  } else if (type === "referrer") {
    whereClause += " AND transaction_type IN ('referrer')";
  } else if (type === "CashBack") {
    whereClause += " AND transaction_type IN ('CashBack')";
  }

  // Get total count
  const [countResult] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM wallet_transactions ${whereClause}`,
    params
  );
  const total = countResult[0].total;

  // Get transactions
  const [transactions] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM wallet_transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get wallet bonuses (active and running)
 */
export async function getWalletBonuses(): Promise<any[]> {
  const [bonuses] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM wallet_bonus_rules 
     WHERE status = 1 
     AND (start_date IS NULL OR start_date <= CURDATE())
     AND (end_date IS NULL OR end_date >= CURDATE())
     ORDER BY bonus_amount DESC`
  );
  return bonuses;
}

/**
 * Process wallet payment success hook - matches wallet_success() in helpers.php
 */
export async function walletPaymentSuccess(
  walletPaymentId: number,
  paymentMethod: string,
  payerId: number,
  paymentAmount: number
): Promise<void> {
  // Update payment status
  await db.execute(
    "UPDATE wallet_payments SET payment_status = 'success', payment_method = ? WHERE id = ?",
    [paymentMethod, walletPaymentId]
  );

  // Create wallet transaction
  await createWalletTransaction(
    payerId,
    paymentAmount,
    "add_fund",
    paymentMethod,
    "wallet_payment",
    `Added ₹${paymentAmount} to wallet via ${paymentMethod}`
  );
}

/**
 * Process wallet payment failed hook - matches wallet_failed() in helpers.php
 */
export async function walletPaymentFailed(
  walletPaymentId: number,
  paymentMethod: string
): Promise<void> {
  await db.execute(
    "UPDATE wallet_payments SET payment_status = 'failed', payment_method = ? WHERE id = ?",
    [paymentMethod, walletPaymentId]
  );
}

// ============================================================
// OWNER WALLET - Matches reference RestaurantWallet logic
// ============================================================

/**
 * Get owner wallet - creates if not exists
 */
export async function getOwnerWallet(ownerId: number): Promise<any> {
  // Check if wallet exists
  const [wallet] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM owner_wallets WHERE owner_id = ?",
    [ownerId]
  );

  if (wallet.length === 0) {
    // Create wallet if not exists
    await db.execute(
      "INSERT INTO owner_wallets (owner_id) VALUES (?)",
      [ownerId]
    );
    const [newWallet] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM owner_wallets WHERE owner_id = ?",
      [ownerId]
    );
    return newWallet[0];
  }

  return wallet[0];
}

/**
 * Calculate owner balance - matches RestaurantWallet::getBalanceAttribute()
 * Formula: balance = total_earning - (total_withdrawn + pending_withdraw + collected_cash)
 */
export async function getOwnerBalance(ownerId: number): Promise<number> {
  const wallet = await getOwnerWallet(ownerId);
  if (wallet.total_earning <= 0) return 0;
  return parseFloat(
    (
      wallet.total_earning -
      (wallet.total_withdrawn + wallet.pending_withdraw + wallet.collected_cash)
    ).toFixed(8)
  );
}

/**
 * Add earning to owner wallet (from booking)
 */
export async function addOwnerEarning(
  ownerId: number,
  amount: number,
  commissionRate: number
): Promise<void> {
  const commission = (amount * commissionRate) / 100;
  const ownerEarning = amount - commission;

  await getOwnerWallet(ownerId);

  await db.execute(
    `UPDATE owner_wallets 
     SET total_earning = total_earning + ? 
     WHERE owner_id = ?`,
    [ownerEarning, ownerId]
  );

  // Add to admin wallet as commission
  await addAdminCommission(commission);
}

/**
 * Add collected cash to owner wallet (COD)
 */
export async function addOwnerCollectedCash(ownerId: number, amount: number): Promise<void> {
  await getOwnerWallet(ownerId);

  await db.execute(
    `UPDATE owner_wallets 
     SET collected_cash = collected_cash + ? 
     WHERE owner_id = ?`,
    [amount, ownerId]
  );
}

/**
 * Create withdraw request
 */
export async function createWithdrawRequest(
  ownerId: number,
  amount: number,
  withdrawalMethodId?: number,
  withdrawalMethodFields?: any,
  type: string = "manual"
): Promise<any> {
  // Check minimum withdraw amount
  const [minAmount] = await db.execute<RowDataPacket[]>(
    "SELECT value FROM business_settings WHERE `key` = 'min_owner_withdraw_amount'"
  );
  const minWithdraw = minAmount.length > 0 ? parseFloat(minAmount[0].value) : 100;

  if (amount < minWithdraw) {
    return { error: `Minimum withdrawal amount is ₹${minWithdraw}` };
  }

  // Check balance
  const balance = await getOwnerBalance(ownerId);
  if (balance < amount) {
    return { error: "Insufficient balance" };
  }

  try {
    await db.beginTransaction();

    // Update pending_withdraw
    await db.execute(
      `UPDATE owner_wallets 
       SET pending_withdraw = pending_withdraw + ? 
       WHERE owner_id = ?`,
      [amount, ownerId]
    );

    // Create withdraw request
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO withdraw_requests 
       (owner_id, amount, withdrawal_method_id, withdrawal_method_fields, type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [ownerId, amount, withdrawalMethodId || null, JSON.stringify(withdrawalMethodFields || {}), type]
    );

    await db.commit();

    return { id: result.insertId, amount, approved: 0 };
  } catch (error) {
    await db.rollback();
    console.error("Create withdraw request failed:", error);
    return { error: "Failed to create withdraw request" };
  }
}

/**
 * Approve withdraw request
 */
export async function approveWithdrawRequest(requestId: number): Promise<boolean> {
  try {
    const [request] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM withdraw_requests WHERE id = ? AND approved = 0",
      [requestId]
    );

    if (request.length === 0) return false;

    await db.beginTransaction();

    // Update request status
    await db.execute(
      "UPDATE withdraw_requests SET approved = 1, updated_at = NOW() WHERE id = ?",
      [requestId]
    );

    // Update owner wallet
    await db.execute(
      `UPDATE owner_wallets 
       SET total_withdrawn = total_withdrawn + ?, 
           pending_withdraw = pending_withdraw - ?
       WHERE owner_id = ?`,
      [request[0].amount, request[0].amount, request[0].owner_id]
    );

    await db.commit();
    return true;
  } catch (error) {
    await db.rollback();
    console.error("Approve withdraw failed:", error);
    return false;
  }
}

/**
 * Reject withdraw request
 */
export async function rejectWithdrawRequest(requestId: number): Promise<boolean> {
  try {
    const [request] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM withdraw_requests WHERE id = ? AND approved = 0",
      [requestId]
    );

    if (request.length === 0) return false;

    await db.beginTransaction();

    // Update request status
    await db.execute(
      "UPDATE withdraw_requests SET approved = 2, updated_at = NOW() WHERE id = ?",
      [requestId]
    );

    // Update owner wallet - release pending
    await db.execute(
      `UPDATE owner_wallets 
       SET pending_withdraw = pending_withdraw - ?
       WHERE owner_id = ?`,
      [request[0].amount, request[0].owner_id]
    );

    await db.commit();
    return true;
  } catch (error) {
    await db.rollback();
    console.error("Reject withdraw failed:", error);
    return false;
  }
}

/**
 * Cancel withdraw request (by owner)
 */
export async function cancelWithdrawRequest(requestId: number, ownerId: number): Promise<boolean> {
  try {
    const [request] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM withdraw_requests WHERE id = ? AND owner_id = ? AND approved = 0",
      [requestId, ownerId]
    );

    if (request.length === 0) return false;

    await db.beginTransaction();

    // Delete request
    await db.execute("DELETE FROM withdraw_requests WHERE id = ?", [requestId]);

    // Update owner wallet - release pending
    await db.execute(
      `UPDATE owner_wallets 
       SET pending_withdraw = pending_withdraw - ?
       WHERE owner_id = ?`,
      [request[0].amount, ownerId]
    );

    await db.commit();
    return true;
  } catch (error) {
    await db.rollback();
    console.error("Cancel withdraw failed:", error);
    return false;
  }
}

/**
 * Get owner withdraw requests
 */
export async function getOwnerWithdrawRequests(ownerId: number): Promise<any[]> {
  const [requests] = await db.execute<RowDataPacket[]>(
    `SELECT wr.*, wm.method_name 
     FROM withdraw_requests wr
     LEFT JOIN withdrawal_methods wm ON wr.withdrawal_method_id = wm.id
     WHERE wr.owner_id = ?
     ORDER BY wr.created_at DESC`,
    [ownerId]
  );
  return requests;
}

/**
 * Update withdraw request (admin approve/reject)
 */
export async function updateWithdrawRequest(
  requestId: number,
  approved: number,
  note?: string
): Promise<boolean> {
  try {
    // Get the request details first
    const [requests] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM withdraw_requests WHERE id = ?",
      [requestId]
    );
    if (requests.length === 0) return false;
    const request = requests[0];

    // Update the request
    await db.execute(
      "UPDATE withdraw_requests SET approved = ?, note = ?, updated_at = NOW() WHERE id = ?",
      [approved, note || null, requestId]
    );

    // If approved, update owner wallet
    if (approved === 1) {
      await db.execute(
        `UPDATE owner_wallets SET 
          total_withdrawn = total_withdrawn + ?,
          pending_withdraw = pending_withdraw - ?
         WHERE owner_id = ?`,
        [request.amount, request.amount, request.owner_id]
      );
    } else {
      // If rejected, just reduce pending
      await db.execute(
        "UPDATE owner_wallets SET pending_withdraw = pending_withdraw - ? WHERE owner_id = ?",
        [request.amount, request.owner_id]
      );
    }
    return true;
  } catch (error) {
    console.error("Update withdraw request failed:", error);
    return false;
  }
}

/**
 * Get customer wallet transactions (paginated)
 */
export async function getCustomerWalletTransactions(
  userId: number,
  page: number = 1,
  limit: number = 20,
  type?: string
): Promise<any> {
  let query = "SELECT * FROM wallet_transactions WHERE user_id = ?";
  let countQuery = "SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?";
  const params: any[] = [userId];
  const countParams: any[] = [userId];

  if (type && type !== "all") {
    query += " AND transaction_type = ?";
    countQuery += " AND transaction_type = ?";
    params.push(type);
    countParams.push(type);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  const offset = (page - 1) * limit;
  params.push(Number(limit), Number(offset));

  const [transactions] = await db.execute<RowDataPacket[]>(query, params);
  const [countResult] = await db.execute<RowDataPacket[]>(countQuery, countParams);

  return {
    transactions,
    total: countResult[0]?.total || 0,
    page,
    limit,
    total_pages: Math.ceil((countResult[0]?.total || 0) / limit),
  };
}

/**
 * Get owner dashboard data
 */
export async function getOwnerDashboard(ownerId: number): Promise<any> {
  const wallet = await getOwnerWallet(ownerId);
  const balance = await getOwnerBalance(ownerId);

  // Get commission rate
  const [commissionRate] = await db.execute<RowDataPacket[]>(
    "SELECT value FROM business_settings WHERE `key` = 'owner_commission_rate'"
  );
  const commission = commissionRate.length > 0 ? parseFloat(commissionRate[0].value) : 10;

  // Get pending withdrawals count
  const [pendingCount] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM withdraw_requests WHERE owner_id = ? AND approved = 0",
    [ownerId]
  );

  // Get total bookings for owner
  const [totalBookings] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     WHERE r.owner_id = ? AND b.payment_status = 'PAID'`,
    [ownerId]
  );

  // Get today's earnings
  const [todayEarnings] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(SUM(b.total_amount), 0) as total
     FROM bookings b
     JOIN rooms r ON b.room_id = r.id
     WHERE r.owner_id = ? 
     AND b.payment_status = 'PAID'
     AND DATE(b.created_at) = CURDATE()`,
    [ownerId]
  );

  return {
    wallet,
    balance,
    commission_rate: commission,
    pending_withdrawals: pendingCount[0].count,
    total_bookings: totalBookings[0].count,
    today_earnings: todayEarnings[0].total,
  };
}

// ============================================================
// ADMIN WALLET - Matches reference AdminWallet logic
// ============================================================

/**
 * Get or create admin wallet
 */
export async function getAdminWallet(adminId: number = 1): Promise<any> {
  const [wallet] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM admin_wallets WHERE admin_id = ?",
    [adminId]
  );

  if (wallet.length === 0) {
    await db.execute(
      "INSERT INTO admin_wallets (admin_id) VALUES (?)",
      [adminId]
    );
    const [newWallet] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM admin_wallets WHERE admin_id = ?",
      [adminId]
    );
    return newWallet[0];
  }

  return wallet[0];
}

/**
 * Add commission to admin wallet
 */
export async function addAdminCommission(amount: number): Promise<void> {
  const wallet = await getAdminWallet(1);

  await db.execute(
    `UPDATE admin_wallets 
     SET total_commission_earning = total_commission_earning + ?,
         digital_received = digital_received + ?
     WHERE admin_id = 1`,
    [amount, amount]
  );
}

/**
 * Admin adds fund to customer wallet
 */
export async function adminAddFundToCustomer(
  adminId: number,
  customerId: number,
  amount: number,
  bonus: number = 0
): Promise<any> {
  try {
    await db.beginTransaction();

    // Create wallet transaction
    const transaction = await createWalletTransaction(
      customerId,
      amount,
      "add_fund_by_admin",
      `admin_${adminId}`,
      "admin",
      `Fund added by admin`
    );

    // Add bonus if specified
    if (bonus > 0) {
      await createWalletTransaction(
        customerId,
        bonus,
        "add_fund_by_admin",
        `admin_bonus_${adminId}`,
        "admin",
        `Bonus added by admin`
      );
    }

    await db.commit();
    return transaction;
  } catch (error) {
    await db.rollback();
    console.error("Admin add fund failed:", error);
    return false;
  }
}

/**
 * Get admin dashboard data
 */
export async function getAdminDashboard(): Promise<any> {
  const wallet = await getAdminWallet(1);

  // Get total customer wallet balance
  const [totalCustomerBalance] = await db.execute<RowDataPacket[]>(
    "SELECT COALESCE(SUM(wallet_balance), 0) as total FROM users WHERE role = 'USER'"
  );

  // Get total owner balance
  const [totalOwnerBalance] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(SUM(total_earning - total_withdrawn - pending_withdraw - collected_cash), 0) as total 
     FROM owner_wallets`
  );

  // Get pending withdrawal requests
  const [pendingWithdrawals] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdraw_requests WHERE approved = 0"
  );

  // Get today's transactions
  const [todayTransactions] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM wallet_transactions WHERE DATE(created_at) = CURDATE()"
  );

  // Get today's revenue
  const [todayRevenue] = await db.execute<RowDataPacket[]>(
    `SELECT COALESCE(SUM(admin_bonus), 0) as bonus
     FROM wallet_transactions 
     WHERE DATE(created_at) = CURDATE() AND admin_bonus > 0`
  );

  return {
    wallet,
    total_customer_balance: totalCustomerBalance[0].total,
    total_owner_balance: totalOwnerBalance[0].total,
    pending_withdrawals_count: pendingWithdrawals[0].count,
    pending_withdrawals_amount: pendingWithdrawals[0].total,
    today_transactions: todayTransactions[0].count,
    today_revenue: todayRevenue[0].bonus,
  };
}

/**
 * Get all withdrawal requests
 */
export async function getAllWithdrawRequests(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<any> {
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const params: any[] = [];

  if (status === "pending") {
    whereClause += " AND wr.approved = 0";
  } else if (status === "approved") {
    whereClause += " AND wr.approved = 1";
  } else if (status === "rejected") {
    whereClause += " AND wr.approved = 2";
  }

  // Get total count
  const [countResult] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM withdraw_requests wr ${whereClause}`,
    params
  );
  const total = countResult[0].total;

  // Get requests with owner info
  const [requests] = await db.execute<RowDataPacket[]>(
    `SELECT wr.*, u.name as owner_name, u.email as owner_email, wm.method_name
     FROM withdraw_requests wr
     JOIN users u ON wr.owner_id = u.id
     LEFT JOIN withdrawal_methods wm ON wr.withdrawal_method_id = wm.id
     ${whereClause}
     ORDER BY wr.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get wallet report
 */
export async function getWalletReport(
  startDate?: string,
  endDate?: string
): Promise<any> {
  let whereClause = "WHERE 1=1";
  const params: any[] = [];

  if (startDate) {
    whereClause += " AND DATE(created_at) >= ?";
    params.push(startDate);
  }
  if (endDate) {
    whereClause += " AND DATE(created_at) <= ?";
    params.push(endDate);
  }

  // Get transaction summary
  const [summary] = await db.execute<RowDataPacket[]>(
    `SELECT 
       COUNT(*) as total_transactions,
       COALESCE(SUM(credit), 0) as total_credit,
       COALESCE(SUM(debit), 0) as total_debit,
       COALESCE(SUM(admin_bonus), 0) as total_bonus
     FROM wallet_transactions ${whereClause}`,
    params
  );

  // Get by transaction type
  const [byType] = await db.execute<RowDataPacket[]>(
    `SELECT 
       transaction_type,
       COUNT(*) as count,
       COALESCE(SUM(credit), 0) as credit,
       COALESCE(SUM(debit), 0) as debit
     FROM wallet_transactions ${whereClause}
     GROUP BY transaction_type`,
    params
  );

  return {
    summary: summary[0],
    by_type: byType,
  };
}

/**
 * Get customer wallet report
 */
export async function getCustomerWalletReport(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<any> {
  const offset = (page - 1) * limit;

  let whereClause = "WHERE u.role = 'USER'";
  const params: any[] = [];

  if (search) {
    whereClause += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Get total count
  const [countResult] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM users u ${whereClause}`,
    params
  );
  const total = countResult[0].total;

  // Get customers with wallet data
  const [customers] = await db.execute<RowDataPacket[]>(
    `SELECT 
       u.id,
       u.name,
       u.email,
       u.phone,
       COALESCE(u.wallet_balance, 0) as wallet_balance,
       COALESCE(u.loyalty_points, 0) as loyalty_points,
       COALESCE(credit_summary.total_credit, 0) as total_credit,
       COALESCE(debit_summary.total_debit, 0) as total_debit,
       COALESCE(bonus_summary.total_bonus, 0) as total_bonus,
       COALESCE(tx_count.transaction_count, 0) as transaction_count,
       last_tx.last_transaction
     FROM users u
     LEFT JOIN (
       SELECT user_id, SUM(credit) as total_credit 
       FROM wallet_transactions 
       WHERE credit > 0 
       GROUP BY user_id
     ) credit_summary ON u.id = credit_summary.user_id
     LEFT JOIN (
       SELECT user_id, SUM(debit) as total_debit 
       FROM wallet_transactions 
       WHERE debit > 0 
       GROUP BY user_id
     ) debit_summary ON u.id = debit_summary.user_id
     LEFT JOIN (
       SELECT user_id, SUM(admin_bonus) as total_bonus 
       FROM wallet_transactions 
       WHERE admin_bonus > 0 
       GROUP BY user_id
     ) bonus_summary ON u.id = bonus_summary.user_id
     LEFT JOIN (
       SELECT user_id, COUNT(*) as transaction_count 
       FROM wallet_transactions 
       GROUP BY user_id
     ) tx_count ON u.id = tx_count.user_id
     LEFT JOIN (
       SELECT user_id, MAX(created_at) as last_transaction 
       FROM wallet_transactions 
       GROUP BY user_id
     ) last_tx ON u.id = last_tx.user_id
     ${whereClause}
     ORDER BY u.wallet_balance DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Get totals
  const [totals] = await db.execute<RowDataPacket[]>(
    `SELECT 
       COUNT(*) as total_customers,
       COALESCE(SUM(wallet_balance), 0) as total_balance,
       COALESCE(SUM(loyalty_points), 0) as total_loyalty_points
     FROM users u
     WHERE u.role = 'USER' AND u.wallet_balance > 0`
  );

  return {
    data: customers,
    summary: totals[0],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// WALLET SETTINGS - Matches reference BusinessSetting
// ============================================================

/**
 * Get wallet settings
 */
export async function getWalletSettings(): Promise<any> {
  const [settings] = await db.execute<RowDataPacket[]>(
    `SELECT \`key\`, value FROM business_settings 
     WHERE \`key\` IN (
       'wallet_status',
       'wallet_add_refund',
       'loyalty_point_status',
       'loyalty_point_exchange_rate',
       'loyalty_point_item_purchase_point',
       'min_owner_withdraw_amount',
       'owner_commission_rate',
       'customer_add_fund_min_amount'
     )`
  );

  const result: Record<string, string> = {};
  settings.forEach((s: any) => {
    result[s.key] = s.value;
  });
  return result;
}

/**
 * Update wallet settings
 */
export async function updateWalletSettings(settings: Record<string, string>): Promise<boolean> {
  try {
    await db.beginTransaction();

    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        `INSERT INTO business_settings (\`key\`, value, updated_at) 
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE value = ?, updated_at = NOW()`,
        [key, value, value]
      );
    }

    await db.commit();
    return true;
  } catch (error) {
    await db.rollback();
    console.error("Update settings failed:", error);
    return false;
  }
}

// ============================================================
// WALLET BONUS RULES
// ============================================================

/**
 * Get all bonus rules
 */
export async function getBonusRules(): Promise<any[]> {
  const [rules] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM wallet_bonus_rules ORDER BY created_at DESC"
  );
  return rules;
}

/**
 * Create bonus rule
 */
export async function createBonusRule(data: {
  title: string;
  description?: string;
  bonus_type: string;
  bonus_amount: number;
  minimum_add_amount: number;
  maximum_bonus_amount: number;
  start_date?: string;
  end_date?: string;
  status: number;
}): Promise<any> {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO wallet_bonus_rules 
     (title, description, bonus_type, bonus_amount, minimum_add_amount, maximum_bonus_amount, start_date, end_date, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      data.title,
      data.description || null,
      data.bonus_type,
      data.bonus_amount,
      data.minimum_add_amount,
      data.maximum_bonus_amount,
      data.start_date || null,
      data.end_date || null,
      data.status,
    ]
  );

  return { id: result.insertId, ...data };
}

/**
 * Update bonus rule
 */
export async function updateBonusRule(
  ruleId: number,
  data: Partial<{
    title: string;
    description: string;
    bonus_type: string;
    bonus_amount: number;
    minimum_add_amount: number;
    maximum_bonus_amount: number;
    start_date: string;
    end_date: string;
    status: number;
  }>
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  fields.push("updated_at = NOW()");
  values.push(ruleId);

  await db.execute(
    `UPDATE wallet_bonus_rules SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return true;
}

/**
 * Delete bonus rule
 */
export async function deleteBonusRule(ruleId: number): Promise<boolean> {
  await db.execute("DELETE FROM wallet_bonus_rules WHERE id = ?", [ruleId]);
  return true;
}

// ============================================================
// WITHDRAWAL METHODS
// ============================================================

/**
 * Get global withdrawal methods
 */
export async function getWithdrawalMethods(): Promise<any[]> {
  const [methods] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM withdrawal_methods WHERE is_active = 1"
  );
  return methods;
}

/**
 * Get owner withdrawal methods
 */
export async function getOwnerWithdrawalMethods(ownerId: number): Promise<any[]> {
  const [methods] = await db.execute<RowDataPacket[]>(
    `SELECT owm.*, wm.method_name 
     FROM owner_withdrawal_methods owm
     JOIN withdrawal_methods wm ON owm.withdrawal_method_id = wm.id
     WHERE owm.owner_id = ? AND owm.is_active = 1
     ORDER BY owm.is_default DESC`,
    [ownerId]
  );
  return methods;
}

/**
 * Add owner withdrawal method
 */
export async function addOwnerWithdrawalMethod(
  ownerId: number,
  withdrawalMethodId: number,
  methodFields: any,
  isDefault: boolean = false
): Promise<any> {
  // Get method name
  const [method] = await db.execute<RowDataPacket[]>(
    "SELECT method_name FROM withdrawal_methods WHERE id = ?",
    [withdrawalMethodId]
  );
  if (method.length === 0) return null;

  // If setting as default, unset others
  if (isDefault) {
    await db.execute(
      "UPDATE owner_withdrawal_methods SET is_default = 0 WHERE owner_id = ?",
      [ownerId]
    );
  }

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO owner_withdrawal_methods 
     (owner_id, withdrawal_method_id, method_name, method_fields, is_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [ownerId, withdrawalMethodId, method[0].method_name, JSON.stringify(methodFields), isDefault ? 1 : 0]
  );

  return { id: result.insertId };
}

/**
 * Update owner withdrawal method
 */
export async function updateOwnerWithdrawalMethod(
  methodId: number,
  ownerId: number,
  data: { is_default?: boolean; method_fields?: any }
): Promise<boolean> {
  if (data.is_default) {
    await db.execute(
      "UPDATE owner_withdrawal_methods SET is_default = 0 WHERE owner_id = ?",
      [ownerId]
    );
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (data.is_default !== undefined) {
    fields.push("is_default = ?");
    values.push(data.is_default ? 1 : 0);
  }
  if (data.method_fields) {
    fields.push("method_fields = ?");
    values.push(JSON.stringify(data.method_fields));
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = NOW()");
  values.push(methodId, ownerId);

  await db.execute(
    `UPDATE owner_withdrawal_methods SET ${fields.join(", ")} WHERE id = ? AND owner_id = ?`,
    values
  );

  return true;
}

/**
 * Delete owner withdrawal method
 */
export async function deleteOwnerWithdrawalMethod(methodId: number, ownerId: number): Promise<boolean> {
  await db.execute(
    "DELETE FROM owner_withdrawal_methods WHERE id = ? AND owner_id = ?",
    [methodId, ownerId]
  );
  return true;
}

// ── Set default withdrawal method ──
export async function setDefaultWithdrawalMethod(ownerId: number, methodId: number): Promise<void> {
  // First, unset all defaults for this owner
  await db.execute(
    "UPDATE owner_withdrawal_methods SET is_default = 0 WHERE owner_id = ?",
    [ownerId]
  );
  // Then set the selected one as default
  await db.execute(
    "UPDATE owner_withdrawal_methods SET is_default = 1 WHERE id = ? AND owner_id = ?",
    [methodId, ownerId]
  );
}
