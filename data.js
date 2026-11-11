/* ============================================================
   EDITABLE EXPERIMENT DATA. All placeholder, fictional, no live links.
   truth: "phishing" | "legit"
   aiVerdict: one of the SCALE labels below
   isAIWrong: true on exactly 3 emails per set, SAME positions in both sets:
     pos 2  = phishing rated Safe
     pos 6  = phishing rated Safe
     pos 9  = legit rated Probably phishing
   ============================================================ */

const SCALE = [
  { label: "Safe", score: 0 },
  { label: "Probably safe", score: 33 },
  { label: "Probably phishing", score: 67 },
  { label: "Phishing", score: 100 },
];

/* Version table: round1 / round2 = {cond, set}. cond: "suggest" (L4) | "preselect" (L5) */
const VERSIONS = {
  1: [{ cond: "suggest",   set: "A" }, { cond: "preselect", set: "B" }],
  2: [{ cond: "preselect", set: "A" }, { cond: "suggest",   set: "B" }],
  3: [{ cond: "suggest",   set: "B" }, { cond: "preselect", set: "A" }],
  4: [{ cond: "preselect", set: "B" }, { cond: "suggest",   set: "A" }],
};

/* Attention check inserted after this many emails (5 => shown as item 6) */
const ATTENTION_AFTER = 5;
const ATTENTION_EMAIL = {
  from: "Study Team <check@example-study.test>",
  subject: "Quick attention check",
  body: "For this message, please select 'Phishing' to confirm you're paying attention.",
  requiredScore: 100,
};

const PRACTICE_EMAIL = {
  id: "PRACTICE",
  from: "Maple Gym <hello@maplegym.example>",
  subject: "Your class booking for Thursday",
  body: "Hi, this confirms your yoga class on Thursday at 6:00 PM. Reply to this email if you need to cancel. See you there!",
  link: "",
  truth: "legit",
  aiVerdict: "Safe",
  risk: 9,
  isAIWrong: false,
};

const emailsSetA = [
  { id: "A01", from: "Lumen Library <noreply@lumenlibrary.example>", subject: "Books due in 3 days",
    body: "Hello, two items on your account are due back on Friday. You can renew them from your account page or at the front desk.",
    link: "Link: https://lumenlibrary.example/account", truth: "legit", aiVerdict: "Safe", risk: 8, isAIWrong: false },
  { id: "A02", from: "Alderbank Security <alerts@alderbank-support.example>", subject: "Action required: verify your account",
    body: "We detected unusual sign-in activity. To avoid suspension, confirm your identity within 24 hours using the secure link below.",
    link: "Link: https://alderbank-secure.example/verify", truth: "phishing", aiVerdict: "Safe", risk: 15, isAIWrong: true },
  { id: "A03", from: "Brightpost Delivery <track@brightpost-parcels.example>", subject: "Parcel held: pay $1.99 fee",
    body: "Your parcel could not be delivered. Pay a small redelivery fee now or it will be returned to sender.",
    link: "Link: https://brightpost-redeliver.example/pay", truth: "phishing", aiVerdict: "Phishing", risk: 94, isAIWrong: false },
  { id: "A04", from: "Ironwood University IT <itdesk@ironwood.example>", subject: "Scheduled maintenance Saturday",
    body: "The student portal will be offline Saturday 2:00 to 4:00 AM for scheduled maintenance. No action is needed on your part.",
    link: "", truth: "legit", aiVerdict: "Probably safe", risk: 27, isAIWrong: false },
  { id: "A05", from: "Kestrel Insurance <documents@kestrelinsure.example>", subject: "Your renewal documents are ready",
    body: "Your policy renewal documents are available. Please sign in to your usual customer portal to view them. We will never ask for your password by email.",
    link: "Link: https://kestrelinsure.example/portal", truth: "legit", aiVerdict: "Safe", risk: 12, isAIWrong: false },
  { id: "A06", from: "Fernhill Payroll <hr-update@fernhill-payroll.example>", subject: "Update your direct deposit details",
    body: "Payroll is changing providers. Re-enter your bank details by end of day to make sure your next payment is not delayed.",
    link: "Link: https://fernhill-payroll-update.example/deposit", truth: "phishing", aiVerdict: "Safe", risk: 18, isAIWrong: true },
  { id: "A07", from: "Juniper Travel <bookings@junipertravel.example>", subject: "Booking confirmation #48213",
    body: "Thanks for booking with us. Your flight details are attached to your account. Check-in opens 24 hours before departure.",
    link: "Link: https://junipertravel.example/trips", truth: "legit", aiVerdict: "Probably safe", risk: 31, isAIWrong: false },
  { id: "A08", from: "Halcyon Streaming <billing@halcyon-tv.example>", subject: "Payment failed, update card",
    body: "We could not process your last payment. Update your card details immediately to keep watching.",
    link: "Link: https://halcyon-billing-help.example/card", truth: "phishing", aiVerdict: "Probably phishing", risk: 72, isAIWrong: false },
  { id: "A09", from: "Cloudvale Storage <team@cloudvale.example>", subject: "You have used 90% of your storage",
    body: "You are close to your storage limit. You can free up space or review plans in your account settings whenever you like.",
    link: "Link: https://cloudvale.example/settings/storage", truth: "legit", aiVerdict: "Probably phishing", risk: 64, isAIWrong: true },
  { id: "A10", from: "Greenleaf Telecom <promo@greenleaf-rewards.example>", subject: "You won a free phone!",
    body: "Congratulations! You were selected for a free phone. Claim it now by entering your details and a small shipping fee.",
    link: "Link: https://greenleaf-prize.example/claim", truth: "phishing", aiVerdict: "Phishing", risk: 97, isAIWrong: false },
];

const emailsSetB = [
  { id: "B01", from: "Oakridge Council <services@oakridgecouncil.example>", subject: "Bin collection change this week",
    body: "Hello, due to a public holiday your recycling collection moves to Wednesday. Check the council website for the full schedule.",
    link: "Link: https://oakridgecouncil.example/bins", truth: "legit", aiVerdict: "Safe", risk: 10, isAIWrong: false },
  { id: "B02", from: "Tidewater Bank <security@tidewater-alerts.example>", subject: "Your card has been locked",
    body: "Suspicious activity was found on your card. Unlock it now by confirming your details, or it will stay blocked.",
    link: "Link: https://tidewater-unlock.example/card", truth: "phishing", aiVerdict: "Safe", risk: 17, isAIWrong: true },
  { id: "B03", from: "Swiftpost Couriers <delivery@swiftpost-notice.example>", subject: "Missed delivery, reschedule now",
    body: "We tried to deliver your package. Pay the handling charge to book a new delivery slot.",
    link: "Link: https://swiftpost-reschedule.example/fee", truth: "phishing", aiVerdict: "Phishing", risk: 92, isAIWrong: false },
  { id: "B04", from: "Redwood College IT <help@redwoodcollege.example>", subject: "Wi-Fi upgrade on Sunday",
    body: "Campus Wi-Fi will be upgraded Sunday morning. You may be disconnected briefly. No action is needed.",
    link: "", truth: "legit", aiVerdict: "Probably safe", risk: 25, isAIWrong: false },
  { id: "B05", from: "Pinecrest Health <appointments@pinecresthealth.example>", subject: "Appointment reminder, Monday 10:30",
    body: "This is a reminder of your appointment on Monday at 10:30 AM. To reschedule, call the number on your appointment card.",
    link: "", truth: "legit", aiVerdict: "Safe", risk: 14, isAIWrong: false },
  { id: "B06", from: "Marlow Staff Services <benefits@marlow-staffhub.example>", subject: "Confirm your tax details today",
    body: "Our records are incomplete. Submit your tax and bank details through the form today to avoid a pay delay.",
    link: "Link: https://marlow-staffhub-tax.example/form", truth: "phishing", aiVerdict: "Safe", risk: 19, isAIWrong: true },
  { id: "B07", from: "Cedar Rail <tickets@cedarrail.example>", subject: "Your e-ticket for 14 March",
    body: "Thanks for your purchase. Your e-ticket is in your account. Please have it ready on your phone when boarding.",
    link: "Link: https://cedarrail.example/tickets", truth: "legit", aiVerdict: "Probably safe", risk: 29, isAIWrong: false },
  { id: "B08", from: "Starlight Music <billing@starlight-plus.example>", subject: "Subscription expired, renew card",
    body: "Your subscription has expired. Re-enter your card details now or lose your saved playlists.",
    link: "Link: https://starlight-renew-now.example/card", truth: "phishing", aiVerdict: "Probably phishing", risk: 70, isAIWrong: false },
  { id: "B09", from: "Skyfile Cloud <hello@skyfile.example>", subject: "Your backup finished with warnings",
    body: "Your last backup completed, but a few large files were skipped. You can review them in your dashboard when convenient.",
    link: "Link: https://skyfile.example/dashboard/backups", truth: "legit", aiVerdict: "Probably phishing", risk: 66, isAIWrong: true },
  { id: "B10", from: "Bluewave Mobile <offers@bluewave-gifts.example>", subject: "Claim your free gift card",
    body: "You are our lucky customer of the month. Enter your details and pay a small fee to receive a gift card.",
    link: "Link: https://bluewave-gift.example/claim", truth: "phishing", aiVerdict: "Phishing", risk: 96, isAIWrong: false },
];

const EMAIL_SETS = { A: emailsSetA, B: emailsSetB };
