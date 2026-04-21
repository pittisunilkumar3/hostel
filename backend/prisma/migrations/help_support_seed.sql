-- ============================================================
-- HELP & SUPPORT — Example / Seed Data
-- Run: mysql -u root hostel_db < prisma/migrations/help_support_seed.sql
-- ============================================================

-- ============================================================
-- 1. CONTACT MESSAGES (15 examples — mix of new, replied, seen)
-- ============================================================

INSERT INTO contact_messages (name, email, phone, subject, message, reply, seen, status, created_at, updated_at) VALUES

-- NEW / UNREAD messages (seen = 0)
(
  'Rahul Sharma',
  'rahul.sharma@gmail.com',
  '9876543210',
  'Room Availability Inquiry',
  'Hi, I am looking for a single room with AC and attached bathroom. Do you have any availability for the upcoming month? I am a working professional and would prefer a quiet floor. Please let me know the pricing and deposit details.',
  NULL, 0, 1,
  NOW(), NOW()
),
(
  'Priya Patel',
  'priya.patel@yahoo.com',
  '9812345678',
  'WiFi Not Working',
  'I am staying in Room 201 and the WiFi has been very slow for the past 3 days. I have an important online exam next week and need a stable connection. Could you please look into this urgently?',
  NULL, 0, 1,
  DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)
),
(
  'Mohammed Ali',
  'mohammed.ali@outlook.com',
  '9765432100',
  'Mess Facility Timing',
  'Hello, I wanted to know about the mess and food facility at your hostel. What are the breakfast, lunch and dinner timings? Is there a vegetarian menu available? Also, is the mess included in the room rent or charged separately?',
  NULL, 0, 1,
  DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR)
),
(
  'Anjali Desai',
  'anjali.desai@gmail.com',
  '9654321098',
  'Safety & Security Concern',
  'I am a female student planning to join your hostel. I wanted to understand the security arrangements — is there CCTV surveillance, 24/7 security guard, and restricted entry? Also, are there separate floors for boys and girls?',
  NULL, 0, 1,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
  'Vikram Singh',
  'vikram.singh@gmail.com',
  '9543210987',
  'Parking Facility',
  'I have a two-wheeler and wanted to know if there is dedicated parking space available for residents. Is there any extra charge for parking? Also, is the parking area covered or open?',
  NULL, 0, 1,
  DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
),

-- REPLIED messages (seen = 1, with reply JSON)
(
  'Sneha Reddy',
  'sneha.reddy@gmail.com',
  '9432109876',
  'Booking Cancellation Request',
  'I had booked Room 102 but due to a change in my job location, I need to cancel my booking. My booking ID is BK-2024-045. Please process the cancellation and refund my deposit as per the policy.',
  '{"subject": "Re: Booking Cancellation Request", "body": "Hi Sneha,\n\nWe have processed your cancellation request for booking BK-2024-045. The refund of ₹4,000 will be credited to your account within 5-7 business days.\n\nWe are sorry to see you go and wish you all the best in your new location!\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
  'Amit Kumar',
  'amit.kumar@hotmail.com',
  '9321098765',
  'Hot Water Issue in Room 301',
  'There is no hot water supply in Room 301 since yesterday morning. The geyser seems to be malfunctioning. Kindly send a technician to fix this as soon as possible. Taking cold water baths in this weather is very difficult.',
  '{"subject": "Re: Hot Water Issue in Room 301", "body": "Hi Amit,\n\nThank you for reporting this issue. Our maintenance team has visited Room 301 and replaced the faulty geyser. Hot water supply should now be fully restored.\n\nWe apologize for the inconvenience caused.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
),
(
  'Kavita Nair',
  'kavita.nair@gmail.com',
  '9210987654',
  'Room Change Request',
  'I am currently in Room 201 (triple sharing) and would like to shift to a single room if available. My roommate snores loudly and it is affecting my sleep and studies. I am willing to pay the difference in rent.',
  '{"subject": "Re: Room Change Request", "body": "Hi Kavita,\n\nWe understand your concern. We have a single room (Room 105) available on the first floor starting next week. The rent difference would be ₹1,500/month.\n\nPlease visit the office to complete the room transfer formalities.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
  'Rajesh Gupta',
  'rajesh.gupta@gmail.com',
  '9109876543',
  'Guest Visit Policy',
  'Can my parents come to visit me at the hostel? They will be coming from out of town next weekend. Are guests allowed inside the hostel premises? What are the visiting hours and do they need to show any ID?',
  '{"subject": "Re: Guest Visit Policy", "body": "Hi Rajesh,\n\nYes, guests are allowed during visiting hours (10 AM - 8 PM). Your parents will need to carry a valid government ID and register at the reception desk upon arrival.\n\nPlease inform the security desk 24 hours in advance about the visit.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)
),
(
  'Neha Joshi',
  'neha.joshi@yahoo.com',
  '9009876543',
  'Fee Payment Receipt',
  'I have paid my room rent for this month via UPI but have not received any payment receipt. Could you please send me the receipt at the earliest? I need it for my company reimbursement. My room number is 102.',
  '{"subject": "Re: Fee Payment Receipt", "body": "Hi Neha,\n\nWe have verified your UPI payment of ₹4,000 for Room 102. The receipt has been generated and sent to your registered email address.\n\nPlease check your inbox (and spam folder). Let us know if you need anything else.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)
),

-- MORE NEW / UNREAD (recent)
(
  'Deepak Verma',
  'deepak.verma@gmail.com',
  '8976543210',
  'AC Not Cooling Properly',
  'The air conditioner in my room (101) is not cooling properly. Even at 18°C, the room feels warm. I think it needs gas refilling or servicing. Please arrange for a technician visit.',
  NULL, 0, 1,
  DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)
),
(
  'Meera Iyer',
  'meera.iyer@gmail.com',
  '8865432109',
  'Laundry Service Query',
  'Do you provide laundry service at the hostel? If yes, what are the charges and how frequently can I give clothes for washing? Is there an iron available for self-use?',
  NULL, 0, 1,
  DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_SUB(NOW(), INTERVAL 8 HOUR)
),

-- MORE REPLIED (older)
(
  'Suresh Babu',
  'suresh.babu@gmail.com',
  '8754321098',
  'Curfew Timing',
  'What is the curfew time at the hostel? I sometimes have late night shifts at my office. Is there a provision for late entry with prior permission?',
  '{"subject": "Re: Curfew Timing", "body": "Hi Suresh,\n\nThe standard curfew time is 10:30 PM. However, for working professionals with late shifts, we offer a late entry pass. Please submit a letter from your employer to the hostel manager.\n\nThe main gate is monitored 24/7 and late entry requires signing the register.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)
),
(
  'Fatima Khan',
  'fatima.khan@outlook.com',
  '8643210987',
  'Photography Project Stay',
  'Hello, I am a photography student and I will be visiting the city for a 2-week project. Do you offer short-term stays? I only need a basic single room with WiFi. Please share the short-term rates.',
  '{"subject": "Re: Photography Project Stay", "body": "Hi Fatima,\n\nYes, we do offer short-term stays! For a 2-week period, the rate for a single room with WiFi would be ₹3,500 per week.\n\nPlease book through our website or visit the reception with a valid ID.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 13 DAY)
),
(
  'Arjun Menon',
  'arjun.menon@gmail.com',
  '8532109876',
  'Locker Facility',
  'Is there a personal locker available in the rooms? I have some valuable items and documents that I want to keep secure. If not in the room, is there a common locker facility?',
  '{"subject": "Re: Locker Facility", "body": "Hi Arjun,\n\nYes, every room comes with a personal locker. You will receive a key at the time of check-in. Additionally, we have a safe deposit facility at the reception for high-value items.\n\nThere is no extra charge for either service.\n\nBest regards,\nHostel Support Team"}',
  1, 1,
  DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)
);


-- ============================================================
-- 2. CONVERSATIONS (3 conversations with different users)
-- ============================================================

-- Conversation with John Customer (user_id = 3)
INSERT INTO conversations (id, user_id, last_message, unread_count, status, created_at, updated_at) VALUES
(1, 3, 'Thank you so much! That helps a lot.', 0, 1,
 DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- Conversation with Hostel Owner (user_id = 2)
INSERT INTO conversations (id, user_id, last_message, unread_count, status, created_at, updated_at) VALUES
(2, 2, 'I have updated the room prices for next month.', 0, 1,
 DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- New conversation with a user (unread)
INSERT INTO conversations (id, user_id, last_message, unread_count, status, created_at, updated_at) VALUES
(3, 3, 'When will the maintenance work in the common area be completed?', 2, 1,
 DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 15 MINUTE));


-- ============================================================
-- 3. CONVERSATION MESSAGES (detailed chat threads)
-- ============================================================

-- ---- Conversation 1: John Customer asking about booking ----
INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message, is_read, created_at) VALUES
-- John starts
(1, 3, 'user', 'Hi, I booked a room last week. Can you confirm my check-in date?', 1,
 DATE_SUB(NOW(), INTERVAL 3 DAY)),
-- Admin replies
(1, 1, 'admin', 'Hello John! Yes, your booking for Room 101 is confirmed. Check-in date is April 25, 2026. Please carry a valid government ID.', 1,
 DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 30 MINUTE),
-- John follows up
(1, 3, 'user', 'Great! What about the security deposit? How much do I need to pay at check-in?', 1,
 DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Admin replies
(1, 1, 'admin', 'The security deposit is ₹5,000 (refundable). You can pay via cash, UPI, or card at the reception. You will also need 2 passport-size photos.', 1,
 DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 45 MINUTE),
-- John asks about amenities
(1, 3, 'user', 'Is the room furnished? What amenities are included?', 1,
 DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Admin replies
(1, 1, 'admin', 'Yes, Room 101 is fully furnished with a bed, mattress, study table, chair, wardrobe, and an AC. WiFi, housekeeping, and 24/7 water supply are included in the rent.', 1,
 DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 20 MINUTE),
-- John thanks
(1, 3, 'user', 'Thank you so much! That helps a lot.', 1,
 DATE_SUB(NOW(), INTERVAL 3 HOUR));


-- ---- Conversation 2: Hostel Owner discussing updates ----
INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message, is_read, created_at) VALUES
(2, 2, 'user', 'Hi admin, I wanted to discuss the room pricing updates for the next quarter.', 1,
 DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 1, 'admin', 'Sure! What changes are you planning?', 1,
 DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 1 HOUR),
(2, 2, 'user', 'I am thinking of increasing the single room rent from ₹5,000 to ₹5,500 and the double sharing from ₹4,000 to ₹4,500. The dormitory rate will stay the same.', 1,
 DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 1, 'admin', 'That sounds reasonable given the market rates. Should I update this in the system?', 1,
 DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 2 HOUR),
(2, 2, 'user', 'Yes, please update it effective from May 1st. Also, add a note that existing tenants will have the old rate till their current term ends.', 1,
 DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 1, 'admin', 'Done! I have updated the prices in the system. Existing tenants will see the old rate in their dashboard. The new rates will show for fresh bookings only.', 1,
 DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 30 MINUTE),
(2, 2, 'user', 'I have updated the room prices for next month.', 1,
 DATE_SUB(NOW(), INTERVAL 1 DAY));


-- ---- Conversation 3: John asking about maintenance (UNREAD) ----
INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message, is_read, created_at) VALUES
(3, 3, 'user', 'Hello, I noticed some construction work happening in the common area. What is going on?', 1,
 DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 1, 'admin', 'Hi John! We are renovating the common lounge area. We are adding new sofas, a TV, and a small library corner. The work should be completed in about a week.', 1,
 DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR),
(3, 3, 'user', 'Oh nice! Will there be any noise disturbance during the day? I work from my room sometimes.', 1,
 DATE_SUB(NOW(), INTERVAL 20 HOUR)),
(3, 1, 'admin', 'The noisy work (drilling, etc.) will only be done between 10 AM - 12 PM. Rest of the day should be quiet. We apologize for any inconvenience!', 1,
 DATE_SUB(NOW(), INTERVAL 19 HOUR)),
(3, 3, 'user', 'That is manageable. Thanks for the heads up!', 1,
 DATE_SUB(NOW(), INTERVAL 18 HOUR)),
(3, 3, 'user', 'When will the maintenance work in the common area be completed?', 0,
 DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(3, 3, 'user', 'Also, the water pressure in the 2nd floor bathroom has been low since yesterday.', 0,
 DATE_SUB(NOW(), INTERVAL 10 MINUTE));
