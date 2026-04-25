# 📊 Migration Status Report
## Generated: 2026-04-26

---

## ✅ Database Tables (39 Total)

| # | Table Name | Migration File | Status |
|---|------------|----------------|--------|
| 1 | advertisements | src/migrations/006_advertisements.sql | ✅ |
| 2 | analytic_scripts | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 3 | banners | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 4 | bookings | src/migrations/001_init.sql | ✅ |
| 5 | business_settings | prisma/migrations/business_settings.sql | ✅ |
| 6 | campaigns | src/migrations/005_promotions.sql | ✅ |
| 7 | cashback_offers | src/migrations/005_promotions.sql | ✅ |
| 8 | cms_pages | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 9 | contact_messages | prisma/migrations/help_support.sql | ✅ |
| 10 | conversation_messages | prisma/migrations/help_support.sql | ✅ |
| 11 | conversations | prisma/migrations/help_support.sql | ✅ |
| 12 | coupons | src/migrations/005_promotions.sql | ✅ |
| 13 | email_templates | prisma/migrations/email_templates.sql | ✅ |
| 14 | email_verifications | src/migrations/007_firebase_otp_verification.sql | ✅ |
| 15 | hostel_discounts | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 16 | hostel_reviews | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 17 | hostel_schedules | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 18 | hostels | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 19 | languages | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 20 | loyalty_points | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 21 | notification_messages | src/migrations/002_notification_settings.sql | ✅ |
| 22 | notification_settings | src/migrations/002_notification_settings.sql | ✅ |
| 23 | otp_providers | prisma/migrations/otp_providers.sql | ✅ |
| 24 | page_seo_data | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 25 | password_resets | src/migrations/007_firebase_otp_verification.sql | ✅ |
| 26 | payment_gateways | prisma/migrations/payment_settings.sql | ✅ |
| 27 | payment_transactions | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 28 | phone_verifications | src/migrations/007_firebase_otp_verification.sql | ✅ |
| 29 | push_notification_campaigns | src/migrations/004_push_notification_campaigns.sql | ✅ |
| 30 | push_notifications | src/migrations/003_push_notifications.sql | ✅ |
| 31 | rooms | src/migrations/001_init.sql | ✅ |
| 32 | social_media_links | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 33 | subscribers | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 34 | system_settings | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 35 | translations | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 36 | users | src/migrations/001_init.sql | ✅ |
| 37 | wallet_bonus_rules | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 38 | wallet_transactions | prisma/migrations/000_complete_schema.sql | ✅ NEW |
| 39 | zones | prisma/migrations/000_complete_schema.sql | ✅ NEW |

---

## 📁 Migration Files

### src/migrations/
1. **001_init.sql** - users, rooms, bookings
2. **002_notification_settings.sql** - notification_settings, notification_messages
3. **003_push_notifications.sql** - push_notifications
4. **004_push_notification_campaigns.sql** - push_notification_campaigns
5. **005_promotions.sql** - campaigns, coupons, cashback_offers
6. **006_advertisements.sql** - advertisements
7. **007_firebase_otp_verification.sql** - phone_verifications, email_verifications, password_resets

### prisma/migrations/
1. **000_complete_schema.sql** - ALL 39 tables (NEW - Complete reference)
2. **add_hostel_commission.sql** - ALTER TABLE hostels (commission fields)
3. **business_settings.sql** - business_settings table
4. **email_templates.sql** - email_templates table
5. **help_support.sql** - contact_messages, conversations, conversation_messages
6. **help_support_seed.sql** - Seed data for help support
7. **login_setup_settings.sql** - System settings data
8. **otp_providers.sql** - otp_providers table
9. **payment_settings.sql** - payment_gateways table

---

## 🆕 Newly Created Migration File

**File:** `prisma/migrations/000_complete_schema.sql`

This is a **complete migration file** that contains all 39 tables with their full schema. It can be used to:
- Set up a fresh database
- Document the complete database structure
- Reference for future migrations

---

## 📝 Notes

1. All tables use **InnoDB** engine with **utf8mb4** charset
2. All tables have **created_at** and **updated_at** timestamps
3. Foreign keys are properly set up with CASCADE deletes
4. The `hostels` table includes the new **commission fields** (business_model, commission_rate, commission_on_delivery)
5. The `conversation_messages` table includes 'owner' in the sender_type ENUM

---

## ✅ Status: COMPLETE

All 39 database tables now have corresponding migration files!
