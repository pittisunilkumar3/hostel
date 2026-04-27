# 📊 Migration Status Report
## Generated: 2026-04-27 (Updated)

---

## ✅ Database Tables (53 Total)

| # | Table Name | Migration File | Status |
|---|------------|----------------|--------|
| 1 | account_transactions | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 2 | admin_wallets | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 3 | advertisements | src/migrations/006_advertisements.sql | ✅ |
| 4 | analytic_scripts | src/migrations/013_cms_analytics.sql | ✅ |
| 5 | banners | src/migrations/013_cms_analytics.sql | ✅ |
| 6 | bookings | src/migrations/001_init.sql | ✅ |
| 7 | business_settings | prisma/migrations/business_settings.sql | ✅ |
| 8 | campaigns | src/migrations/005_promotions.sql | ✅ |
| 9 | cashback_offers | src/migrations/005_promotions.sql | ✅ |
| 10 | cms_pages | src/migrations/013_cms_analytics.sql | ✅ |
| 11 | contact_messages | prisma/migrations/help_support.sql | ✅ |
| 12 | conversation_messages | prisma/migrations/help_support.sql | ✅ |
| 13 | conversations | prisma/migrations/help_support.sql | ✅ |
| 14 | coupons | src/migrations/005_promotions.sql | ✅ |
| 15 | email_templates | prisma/migrations/email_templates.sql | ✅ |
| 16 | email_verifications | src/migrations/007_firebase_otp_verification.sql | ✅ |
| 17 | floors | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 18 | hostel_discounts | src/migrations/010_hostel_tables.sql | ✅ |
| 19 | hostel_reviews | src/migrations/010_hostel_tables.sql | ✅ |
| 20 | hostel_schedules | src/migrations/010_hostel_tables.sql | ✅ |
| 21 | hostel_subscriptions | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 22 | hostels | src/migrations/009_hostels.sql | ✅ |
| 23 | languages | src/migrations/014_languages_translations.sql | ✅ |
| 24 | loyalty_point_transactions | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 25 | loyalty_points | src/migrations/015_loyalty_wallet.sql | ✅ |
| 26 | notification_messages | src/migrations/002_notification_settings.sql | ✅ |
| 27 | notification_settings | src/migrations/002_notification_settings.sql | ✅ |
| 28 | order_taxes | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 29 | otp_providers | prisma/migrations/otp_providers.sql | ✅ |
| 30 | owner_wallets | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 31 | owner_withdrawal_methods | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 32 | page_seo_data | src/migrations/013_cms_analytics.sql | ✅ |
| 33 | password_resets | src/migrations/007_firebase_otp_verification.sql | ✅ |
| 34 | payment_gateways | prisma/migrations/payment_settings.sql | ✅ |
| 35 | payment_transactions | src/migrations/012_payment_transactions.sql | ✅ |
| 36 | phone_verifications | src/migrations/007_firebase_otp_verification.sql | ✅ |
| 37 | push_notification_campaigns | src/migrations/004_push_notification_campaigns.sql | ✅ |
| 38 | push_notifications | src/migrations/003_push_notifications.sql | ✅ |
| 39 | rooms | src/migrations/001_init.sql | ✅ |
| 40 | social_media_links | src/migrations/013_cms_analytics.sql | ✅ |
| 41 | subscribers | src/migrations/013_cms_analytics.sql | ✅ |
| 42 | subscription_plans | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 43 | system_settings | src/migrations/011_system_settings.sql | ✅ |
| 44 | tax_configurations | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 45 | taxes | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 46 | translations | src/migrations/014_languages_translations.sql | ✅ |
| 47 | users | src/migrations/001_init.sql | ✅ |
| 48 | wallet_bonus_rules | src/migrations/015_loyalty_wallet.sql | ✅ |
| 49 | wallet_payments | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 50 | wallet_transactions | src/migrations/015_loyalty_wallet.sql | ✅ |
| 51 | withdraw_requests | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 52 | withdrawal_methods | src/migrations/023_missing_tables_consolidated.sql | ✅ |
| 53 | zones | src/migrations/008_zones.sql | ✅ |

---

## 📁 Migration Files (21 files)

### src/migrations/ (19 files)
1. **001_init.sql** - users, rooms, bookings
2. **002_notification_settings.sql** - notification_settings, notification_messages
3. **003_push_notifications.sql** - push_notifications
4. **004_push_notification_campaigns.sql** - push_notification_campaigns
5. **005_promotions.sql** - campaigns, coupons, cashback_offers
6. **006_advertisements.sql** - advertisements
7. **007_firebase_otp_verification.sql** - phone_verifications, email_verifications, password_resets
8. **008_zones.sql** - zones
9. **009_hostels.sql** - hostels with commission fields
10. **010_hostel_tables.sql** - hostel_schedules, hostel_discounts, hostel_reviews
11. **011_system_settings.sql** - system_settings
12. **012_payment_transactions.sql** - payment_transactions
13. **013_cms_analytics.sql** - cms_pages, analytic_scripts, banners, social_media_links, subscribers, page_seo_data
14. **014_languages_translations.sql** - languages, translations
15. **015_loyalty_wallet.sql** - loyalty_points, wallet_bonus_rules, wallet_transactions
16. **016_advertisements_enhance.sql** - ALTER TABLE advertisements (adds columns)
17. **017_tax_system.sql** - taxes, tax_configurations, order_taxes (with ALTER bookings)
18. **020_missing_tables.sql** - Various tables + loyalty_point_transactions
19. **021_subscription_plans.sql** - subscription_plans, hostel_subscriptions
20. **022_floor_room_management.sql** - floors + ALTER rooms
21. **023_missing_tables_consolidated.sql** - **ALL 14 missing tables consolidated** ⭐

### prisma/migrations/ (9 files)
1. **000_complete_schema.sql** - Complete reference schema
2. **add_hostel_commission.sql** - ALTER TABLE hostels (commission fields)
3. **business_settings.sql** - business_settings table
4. **email_templates.sql** - email_templates table
5. **help_support.sql** - contact_messages, conversations, conversation_messages
6. **help_support_seed.sql** - Seed data for help support
7. **login_setup_settings.sql** - System settings data
8. **otp_providers.sql** - otp_providers table
9. **payment_settings.sql** - payment_gateways table

---

## 🆕 Tables Added in Migration 023

| Table | Purpose |
|-------|---------|
| taxes | Tax rates (GST, VAT, etc.) |
| tax_configurations | System-wide tax settings |
| order_taxes | Applied taxes per booking |
| subscription_plans | Admin-created subscription plans |
| hostel_subscriptions | Owner subscriptions to plans |
| floors | Floor management per hostel |
| loyalty_point_transactions | Loyalty point transaction history |
| owner_wallets | Owner wallet balances |
| admin_wallets | Admin commission tracking |
| withdraw_requests | Owner withdrawal requests |
| wallet_payments | Wallet fund additions |
| withdrawal_methods | Available withdrawal methods |
| owner_withdrawal_methods | Owner's configured withdrawal methods |
| account_transactions | Financial transaction ledger |

---

## ✅ Status: COMPLETE

All 53 database tables now have proper migration files!

### Migration Execution Order:
1. 001_init.sql (users, rooms, bookings)
2. 008_zones.sql (zones - needed by hostels)
3. 009_hostels.sql (hostels - depends on users, zones)
4. 010_hostel_tables.sql (hostel_schedules, hostel_discounts, hostel_reviews)
5. 002-007 (notification, push notifications, promotions, advertisements, verification)
6. 011-015 (system settings, payment, CMS, languages, loyalty/wallet)
7. 016-022 (enhancements, tax system, subscriptions, floors)
8. **023_missing_tables_consolidated.sql** (ALL remaining 14 tables) ⭐
9. prisma/migrations/* (business_settings, help_support, email_templates, etc.)

### To Run the Migration:
```bash
cd backend
npx tsx scripts/run-missing-tables-migration.ts
```
