# Wallet System Implementation

## Overview

A complete wallet system has been implemented for the Hostel Booking Platform, similar to the reference project at `/Users/sunil/Downloads/idea`. The implementation includes:

1. **Customer Wallet** - For customers to add funds and pay for bookings
2. **Owner Wallet** - For hostel owners to receive payments and withdraw earnings
3. **Admin Wallet** - For the platform to track commissions and manage withdrawals

---

## Database Tables

Run the following migration script to create the required tables:

```bash
cd /Users/sunil/Desktop/hostal/backend
npx tsx scripts/run-wallet-migration.ts
```

Or execute the SQL directly:
```bash
mysql -u root -p hostel_db < scripts/create-wallet-tables.sql
```

### Tables Created:

| Table | Description |
|-------|-------------|
| `wallet_transactions` | Customer wallet transaction history |
| `owner_wallets` | Hostel owner wallet balances |
| `admin_wallets` | Platform revenue tracking |
| `withdraw_requests` | Owner withdrawal requests |
| `wallet_bonus_rules` | Wallet bonus configurations |
| `wallet_payments` | Payment gateway records |
| `withdrawal_methods` | Global withdrawal methods |
| `owner_withdrawal_methods` | Owner's saved withdrawal methods |
| `account_transactions` | Cash flow tracking |

---

## API Endpoints

### Customer Wallet APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/customer/balance` | Get wallet balance and loyalty points |
| GET | `/api/wallet/customer/transactions` | Get transaction history |
| POST | `/api/wallet/customer/add-fund` | Add fund to wallet |
| POST | `/api/wallet/customer/pay-booking` | Pay for booking using wallet |
| PUT | `/api/wallet/customer/pay-booking` | Partial payment from wallet |
| POST | `/api/wallet/customer/loyalty/convert` | Convert loyalty points to wallet |

### Owner Wallet APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/owner/dashboard` | Get wallet dashboard |
| GET | `/api/wallet/owner/withdraw` | Get withdrawal requests |
| POST | `/api/wallet/owner/withdraw` | Create withdrawal request |
| DELETE | `/api/wallet/owner/withdraw/[id]` | Cancel withdrawal request |
| GET | `/api/wallet/owner/withdraw-methods` | Get saved withdrawal methods |
| POST | `/api/wallet/owner/withdraw-methods` | Add withdrawal method |
| PUT | `/api/wallet/owner/withdraw-methods` | Set default method |
| DELETE | `/api/wallet/owner/withdraw-methods` | Delete withdrawal method |

### Admin Wallet APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/admin/dashboard` | Get admin wallet dashboard |
| GET | `/api/wallet/admin/withdrawals` | Get all withdrawal requests |
| PUT | `/api/wallet/admin/withdrawals` | Approve/reject withdrawal |
| GET | `/api/wallet/admin/report` | Get wallet report |
| GET | `/api/wallet/admin/settings` | Get wallet settings |
| PUT | `/api/wallet/admin/settings` | Update wallet settings |
| GET | `/api/wallet/admin/bonus-rules` | Get bonus rules |
| POST | `/api/wallet/admin/bonus-rules` | Create bonus rule |
| PUT | `/api/wallet/admin/bonus-rules` | Update bonus rule |
| DELETE | `/api/wallet/admin/bonus-rules` | Delete bonus rule |
| POST | `/api/wallet/admin/add-fund` | Admin adds fund to customer |
| GET | `/api/wallet/admin/customer-report` | Customer wallet report |

---

## Frontend Pages

### Admin Pages

| Page | Path | Description |
|------|------|-------------|
| Wallet Dashboard | `/admin/wallet/dashboard` | Overview of all wallet activities |
| Withdrawals | `/admin/wallet/withdrawals` | Manage owner withdrawal requests |
| Customer Report | `/admin/wallet/customer-report` | View customer wallet balances |
| Settings | `/admin/wallet/settings` | Configure wallet settings |
| Add Fund | `/admin/customers/wallet/add-fund` | Add fund to customer wallet |
| Bonus Rules | `/admin/customers/wallet/bonus` | Manage wallet bonus rules |

### Owner Pages

| Page | Path | Description |
|------|------|-------------|
| Wallet Dashboard | `/owner/wallet/dashboard` | View earnings and balance |
| Withdraw Requests | `/owner/wallet/withdraw` | Manage withdrawal requests |
| Withdraw Methods | `/owner/wallet/withdraw-methods` | Manage saved payment methods |

### Customer Pages

| Page | Path | Description |
|------|------|-------------|
| My Wallet | `/user/wallet` | View balance, add fund, convert points |

---

## Key Features

### Customer Wallet
- ✅ Add fund via payment gateway
- ✅ Admin can manually add fund
- ✅ Pay for bookings using wallet
- ✅ Partial payment support
- ✅ Automatic refund to wallet
- ✅ Loyalty points earning and conversion
- ✅ Referral bonus
- ✅ Cashback rewards
- ✅ Transaction history with filters

### Owner Wallet
- ✅ Track earnings from bookings
- ✅ Cash in hand tracking (COD)
- ✅ Withdrawable balance calculation
- ✅ Withdrawal requests with approval flow
- ✅ Multiple withdrawal methods
- ✅ Auto-disbursement support
- ✅ Earnings statistics (daily/weekly/monthly)

### Admin Wallet
- ✅ Platform commission tracking
- ✅ Approve/reject withdrawal requests
- ✅ Customer wallet management
- ✅ Bonus rules configuration
- ✅ Wallet settings management
- ✅ Transaction reports
- ✅ Export functionality

---

## Configuration Settings

The following settings can be configured via the admin panel:

| Setting | Description | Default |
|---------|-------------|---------|
| `wallet_status` | Enable/disable wallet feature | 1 (enabled) |
| `wallet_add_refund` | Auto-refund to wallet | 1 (enabled) |
| `loyalty_point_status` | Enable loyalty points | 1 (enabled) |
| `loyalty_point_exchange_rate` | Points per ₹1 | 10 |
| `loyalty_point_item_purchase_point` | % earned as points | 5 |
| `min_owner_withdraw_amount` | Minimum withdrawal | 100 |
| `owner_commission_rate` | Platform commission % | 10 |
| `customer_add_fund_min_amount` | Minimum add fund | 0 |

---

## Integration with Bookings

The wallet system integrates with the booking system:

1. **Payment**: Customers can pay for bookings using wallet balance
2. **Refunds**: Cancelled bookings automatically refund to wallet
3. **Commission**: Platform commission is tracked in admin wallet
4. **Owner Earnings**: Booking amounts minus commission go to owner wallet
5. **Loyalty Points**: Customers earn points on bookings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WALLET SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   Customer   │   │    Owner     │   │    Admin     │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│         │                  │                   │                 │
│  ┌──────▼───────┐   ┌──────▼───────┐   ┌──────▼───────┐        │
│  │   wallet_    │   │    owner_    │   │   admin_     │        │
│  │ transactions │   │   wallets    │   │   wallets    │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│         │                  │                   │                 │
│  ┌──────▼──────────────────▼───────────────────▼──────┐        │
│  │              order_transactions                      │        │
│  │         (commission split for each booking)          │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Created

### Backend
- `scripts/create-wallet-tables.sql` - Database migration
- `scripts/run-wallet-migration.ts` - Migration runner
- `src/services/walletService.ts` - Core wallet service
- `app/api/wallet/customer/` - Customer wallet APIs
- `app/api/wallet/owner/` - Owner wallet APIs
- `app/api/wallet/admin/` - Admin wallet APIs

### Frontend
- `app/admin/wallet/` - Admin wallet pages
- `app/owner/wallet/` - Owner wallet pages
- `app/user/wallet/` - Customer wallet page
- Updated sidebar items for all roles

---

## Next Steps

1. Run the database migration
2. Start the backend server
3. Access the admin panel to configure wallet settings
4. Test the wallet functionality

For any issues or questions, please refer to the code comments or the reference implementation at `/Users/sunil/Downloads/idea`.
