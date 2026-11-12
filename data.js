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

/* Email fields:
   body:   blank line = new paragraph, single newline = line break.
           Put {link} where the link should appear; if absent, the link goes after the body.
   footer: optional small grey footer text (sender's address, unsubscribe line, etc.)
   Pairs A0n / B0n are matched in type, length and cues. Keep them matched when editing. */

const PRACTICE_EMAIL = {
  id: "PRACTICE",
  from: "Maple Gym <hello@maplegym.example>",
  subject: "Booking confirmed: Vinyasa Yoga, Thu 6:00 PM",
  body: "Hi,\n\nYou're booked in! Here are your class details:\n\nVinyasa Yoga (all levels)\nThursday, 6:00 PM to 7:00 PM\nStudio 2, Maple Gym Riverside\nInstructor: Priya\n\nPlease arrive 10 minutes early and bring a towel. Mats are available at reception.\n\nCan't make it? Cancel at least 4 hours before the class starts by replying to this email, so someone on the waiting list can take your spot.\n\nSee you there,\nThe Maple Gym team",
  footer: "Maple Gym Riverside, 14 Quay Street\nYou're receiving this because you booked a class.",
  link: "",
  truth: "legit",
  aiVerdict: "Safe",
  risk: 9,
  isAIWrong: false,
};

const emailsSetA = [
  { id: "A01", from: "Lumen Library <noreply@lumenlibrary.example>", subject: "Reminder: 2 items due back on Friday",
    body: "Hello,\n\nThis is a friendly reminder that the following items on your library account are due back soon:\n\n1. The Quiet Coast (book), due Fri 15 Nov\n2. Field Guide to Garden Birds (book), due Fri 15 Nov\n\nYou can renew each item up to 3 times, unless another member has reserved it. Renew online from your account page, in the Lumen Library app, or at any front desk.\n\n{link}\n\nThanks for using Lumen Library.\nCustomer Services",
    footer: "Lumen Library, Central Branch, 2 Market Square\nThis is an automated message. Please don't reply.",
    link: "Link: https://lumenlibrary.example/account", truth: "legit", aiVerdict: "Safe", risk: 8, isAIWrong: false },

  { id: "A02", from: "Alderbank Security <alerts@alderbank-support.example>", subject: "Action required: verify your account",
    body: "Dear Valued Customer,\n\nWe detected an unusual sign-in attempt on your Alderbank online banking account:\n\nDevice: Windows PC\nLocation: Kyiv, Ukraine\nTime: 03:14 AM\n\nIf this was not you, your account may be at risk. For your protection, online access will be suspended unless you confirm your identity within 24 hours.\n\n{link}\n\nYou will need your card number and online banking password to complete verification.\n\nAlderbank Security Team",
    footer: "Alderbank plc. Please do not reply to this email.\nRef: SEC-20931-AX",
    link: "Link: https://alderbank-secure.example/verify", truth: "phishing", aiVerdict: "Safe", risk: 15, isAIWrong: true },

  { id: "A03", from: "Brightpost Delivery <track@brightpost-parcels.example>", subject: "Parcel held: pay $1.99 redelivery fee",
    body: "Brightpost Notice\n\nWe attempted to deliver your parcel today but no one was available to receive it.\n\nTracking number: BP82731940GB\nStatus: Held at depot (unpaid fee)\n\nTo arrange a new delivery, an outstanding fee of $1.99 must be paid. If payment is not received within 48 hours, your parcel will be returned to the sender.\n\n{link}\n\nThank you for choosing Brightpost.",
    footer: "Brightpost Delivery Services. This mailbox is not monitored.",
    link: "Link: https://brightpost-redeliver.example/pay", truth: "phishing", aiVerdict: "Phishing", risk: 94, isAIWrong: false },

  { id: "A04", from: "Ironwood University IT <itdesk@ironwood.example>", subject: "Scheduled maintenance: Student Portal, Sat 2 to 4 AM",
    body: "Hi all,\n\nThe Student Portal and Ironwood Mail web access will be unavailable for planned maintenance:\n\nWhen: Saturday 16 Nov, 2:00 AM to 4:00 AM\nAffected: Student Portal, course registration, web mail\nNot affected: Wi-Fi, library systems, mail on phone apps\n\nYou don't need to do anything. Any work saved in the portal before the window will not be affected.\n\nIf you have problems after 4:00 AM, contact the IT Service Desk in the Library foyer or call extension 4400.\n\nThanks,\nIT Services",
    footer: "Ironwood University IT Services\nService status updates are posted on the IT noticeboard.",
    link: "", truth: "legit", aiVerdict: "Probably safe", risk: 27, isAIWrong: false },

  { id: "A05", from: "Kestrel Insurance <documents@kestrelinsure.example>", subject: "Your home insurance renewal documents are ready",
    body: "Hello,\n\nYour home insurance policy (ending 4471) renews on 1 December. Your renewal documents, including your new schedule and premium summary, are now available in your account.\n\nYour annual premium: $412.60 (last year: $398.20)\n\nIf your details haven't changed, you don't need to do anything. Your policy will renew automatically.\n\nTo view your documents, sign in to your account through our website or the Kestrel app as usual.\n\n{link}\n\nWe will never ask for your password or full card number by email.\n\nKind regards,\nKestrel Insurance Customer Team",
    footer: "Kestrel Insurance Ltd, 90 Harbour Road\nManage email preferences in your account settings.",
    link: "Link: https://kestrelinsure.example/portal", truth: "legit", aiVerdict: "Safe", risk: 12, isAIWrong: false },

  { id: "A06", from: "Fernhill Payroll <hr-update@fernhill-payroll.example>", subject: "Update your direct deposit details by 5 PM today",
    body: "Hi,\n\nAs announced, Fernhill is moving to a new payroll provider this month. All employees must re-enter their bank details in the new system before the next pay run.\n\nDeadline: Today, 5:00 PM\n\nEmployees who do not complete this step will have their November salary delayed until the next cycle.\n\nPlease have the following ready:\n- Bank account number and sort code\n- Employee ID\n- Date of birth\n\n{link}\n\nThank you for your cooperation.\nFernhill HR & Payroll",
    footer: "Fernhill Group HR. Do not forward this email.",
    link: "Link: https://fernhill-payroll-update.example/deposit", truth: "phishing", aiVerdict: "Safe", risk: 18, isAIWrong: true },

  { id: "A07", from: "Juniper Travel <bookings@junipertravel.example>", subject: "Booking confirmation #48213: Lisbon, 6 to 10 Dec",
    body: "Thanks for booking with Juniper Travel!\n\nBooking reference: 48213\nOutbound: Fri 6 Dec, depart 07:40, arrive 10:55\nReturn: Tue 10 Dec, depart 18:20, arrive 21:35\nPassengers: 1 adult\nBaggage: 1 cabin bag (10 kg)\nTotal paid: $286.40\n\nYour e-tickets and receipt are in your account under My Trips. Online check-in opens 24 hours before departure.\n\n{link}\n\nNeed to make a change? You can manage your booking online up to 3 hours before your flight.\n\nHave a great trip,\nJuniper Travel",
    footer: "Juniper Travel Ltd, 7 Canal Wharf\nYou received this email because you made a booking.",
    link: "Link: https://junipertravel.example/trips", truth: "legit", aiVerdict: "Probably safe", risk: 31, isAIWrong: false },

  { id: "A08", from: "Halcyon Streaming <billing@halcyon-tv.example>", subject: "Payment failed: update your card to keep watching",
    body: "Hi,\n\nWe were unable to process your monthly payment of $12.99. This can happen if your card has expired or your bank declined the charge.\n\nYour membership is now ON HOLD. To avoid losing access to your profiles, watch history and downloads, please update your payment details immediately.\n\n{link}\n\nIf we don't receive payment within 24 hours, your account will be permanently closed.\n\nThe Halcyon Team",
    footer: "Halcyon Streaming. Questions? Visit our Help Centre.",
    link: "Link: https://halcyon-billing-help.example/card", truth: "phishing", aiVerdict: "Probably phishing", risk: 72, isAIWrong: false },

  { id: "A09", from: "Cloudvale Storage <team@cloudvale.example>", subject: "You've used 90% of your Cloudvale storage",
    body: "Hi,\n\nYou're using 13.5 GB of your 15 GB free storage. When you reach your limit, new files and photos will stop syncing, but everything already stored stays safe.\n\nWhat's taking up space:\nPhotos: 9.2 GB\nDocuments: 2.8 GB\nTrash: 1.5 GB\n\nEmptying your trash is a quick way to free up space. You can also review large files or compare plans in your storage settings.\n\n{link}\n\nNo action is required right now.\n\nThe Cloudvale team",
    footer: "Cloudvale Inc, 220 Lindsey Street\nUnsubscribe from storage tips in your account settings.",
    link: "Link: https://cloudvale.example/settings/storage", truth: "legit", aiVerdict: "Probably phishing", risk: 64, isAIWrong: true },

  { id: "A10", from: "Greenleaf Telecom <promo@greenleaf-rewards.example>", subject: "Congratulations! You've been selected for a FREE phone",
    body: "Dear Greenleaf Customer,\n\nCONGRATULATIONS! As a thank you for your loyalty, your number was randomly selected to receive a brand new smartphone, absolutely free!\n\nPrize value: $899\nOffer code: GL-WIN-3382\n\nTo claim your prize, simply confirm your delivery address and pay a small shipping and handling fee of $4.95.\n\n{link}\n\nHurry, this offer expires at midnight and only 3 phones are left!\n\nGreenleaf Rewards Team",
    footer: "Greenleaf Rewards. Terms and conditions apply.",
    link: "Link: https://greenleaf-prize.example/claim", truth: "phishing", aiVerdict: "Phishing", risk: 97, isAIWrong: false },
];

const emailsSetB = [
  { id: "B01", from: "Oakridge Council <services@oakridgecouncil.example>", subject: "Reminder: bin collection moves to Wednesday this week",
    body: "Hello,\n\nBecause of the public holiday on Monday, all waste and recycling collections this week will be one day later than usual.\n\nYour usual day: Tuesday\nThis week: Wednesday 13 Nov\nBins: Recycling (blue) and garden waste (green)\n\nPlease put your bins out by 7:00 AM on the day of collection. Collections return to normal next week.\n\nYou can check your full collection calendar on the council website.\n\n{link}\n\nThanks,\nOakridge Council Waste Services",
    footer: "Oakridge Council, Town Hall, 1 High Street\nYou signed up for collection reminders. Unsubscribe on our website.",
    link: "Link: https://oakridgecouncil.example/bins", truth: "legit", aiVerdict: "Safe", risk: 10, isAIWrong: false },

  { id: "B02", from: "Tidewater Bank <security@tidewater-alerts.example>", subject: "Your debit card has been temporarily locked",
    body: "Dear Customer,\n\nOur fraud prevention system flagged a suspicious transaction on your Tidewater debit card:\n\nMerchant: ONLINE-ELEC-STORE\nAmount: $1,249.00\nTime: 02:51 AM\n\nAs a precaution, your card has been temporarily locked. To unlock it, you must confirm your identity within 24 hours, or the card will be permanently cancelled.\n\n{link}\n\nPlease have your card number, expiry date and PIN ready.\n\nTidewater Fraud Team",
    footer: "Tidewater Bank. Please do not reply to this email.\nCase ID: FR-77120-TW",
    link: "Link: https://tidewater-unlock.example/card", truth: "phishing", aiVerdict: "Safe", risk: 17, isAIWrong: true },

  { id: "B03", from: "Swiftpost Couriers <delivery@swiftpost-notice.example>", subject: "Missed delivery: reschedule now ($2.49 fee)",
    body: "Swiftpost Delivery Update\n\nOur driver attempted delivery today but was unable to leave your package.\n\nShipment ID: SP-490216-77\nStatus: Awaiting handling charge\n\nTo book a new delivery slot, a handling charge of $2.49 is required. Unclaimed packages will be returned to the sender after 48 hours.\n\n{link}\n\nThank you for using Swiftpost.",
    footer: "Swiftpost Couriers. This is an automated notification.",
    link: "Link: https://swiftpost-reschedule.example/fee", truth: "phishing", aiVerdict: "Phishing", risk: 92, isAIWrong: false },

  { id: "B04", from: "Redwood College IT <help@redwoodcollege.example>", subject: "Campus Wi-Fi upgrade: Sunday 7 to 9 AM",
    body: "Hi everyone,\n\nWe're upgrading the campus Wi-Fi network to improve speed in the library and residence halls:\n\nWhen: Sunday 17 Nov, 7:00 AM to 9:00 AM\nAffected: RedwoodNet and Guest Wi-Fi\nNot affected: Wired connections in computer labs\n\nYou may be disconnected for a few minutes during this time. You don't need to change any settings, and your devices will reconnect automatically.\n\nIf you still can't connect after 9:00 AM, visit the IT Help Desk in Building C or call extension 2100.\n\nThanks for your patience,\nRedwood College IT",
    footer: "Redwood College IT Services\nPlanned work is listed on the IT status page.",
    link: "", truth: "legit", aiVerdict: "Probably safe", risk: 25, isAIWrong: false },

  { id: "B05", from: "Pinecrest Health <appointments@pinecresthealth.example>", subject: "Appointment reminder: Monday 18 Nov, 10:30 AM",
    body: "Hello,\n\nThis is a reminder of your upcoming appointment:\n\nDate: Monday 18 November\nTime: 10:30 AM\nWith: Dr. Okafor (General Practice)\nWhere: Pinecrest Health Centre, Room 4\n\nPlease arrive 10 minutes early and bring a list of any medicines you are taking.\n\nIf you need to cancel or reschedule, please call the number on your appointment card at least 24 hours in advance so we can offer the slot to another patient.\n\nWe will never ask for payment or personal details by email.\n\nPinecrest Health Reception",
    footer: "Pinecrest Health Centre, 31 Elm Road\nThis is an automated reminder. Please don't reply.",
    link: "", truth: "legit", aiVerdict: "Safe", risk: 14, isAIWrong: false },

  { id: "B06", from: "Marlow Staff Services <benefits@marlow-staffhub.example>", subject: "Confirm your tax details today to avoid a pay delay",
    body: "Hi,\n\nDuring our year-end audit, we found that your employee tax record is incomplete. To be included in this month's payroll, you must confirm your details today.\n\nDeadline: Today, 6:00 PM\n\nIf your record is not updated in time, your salary may be withheld until the issue is resolved.\n\nYou will need:\n- Tax reference number\n- Bank account details\n- Employee ID and date of birth\n\n{link}\n\nThank you,\nMarlow Staff Services",
    footer: "Marlow Staff Services. Confidential. Do not share this email.",
    link: "Link: https://marlow-staffhub-tax.example/form", truth: "phishing", aiVerdict: "Safe", risk: 19, isAIWrong: true },

  { id: "B07", from: "Cedar Rail <tickets@cedarrail.example>", subject: "Your e-ticket for 14 March: Northgate to Bayside",
    body: "Thanks for travelling with Cedar Rail!\n\nOrder reference: CR-55902\nJourney: Northgate to Bayside\nDate: Fri 14 March\nDeparts: 08:12 from platform 3\nArrives: 10:47\nTicket: Standard Off-Peak Return, 1 adult\nTotal paid: $64.20\n\nYour e-ticket is in your account and in the Cedar Rail app. Please have it ready on your phone to scan at the gates.\n\n{link}\n\nPlans changed? You can change or refund your ticket online before departure. Fees may apply.\n\nCedar Rail Customer Services",
    footer: "Cedar Rail Ltd, Station House, Northgate\nYou received this email because you bought a ticket.",
    link: "Link: https://cedarrail.example/tickets", truth: "legit", aiVerdict: "Probably safe", risk: 29, isAIWrong: false },

  { id: "B08", from: "Starlight Music <billing@starlight-plus.example>", subject: "Subscription expired: renew your card to keep your music",
    body: "Hi,\n\nWe couldn't renew your Starlight Plus subscription ($9.99/month). Your payment method may have expired or been declined.\n\nYour account is now SUSPENDED. To avoid losing your saved playlists, liked songs and downloads, please re-enter your card details immediately.\n\n{link}\n\nIf we don't hear from you within 24 hours, your library will be permanently deleted.\n\nThe Starlight Team",
    footer: "Starlight Music. Need help? Visit our Support page.",
    link: "Link: https://starlight-renew-now.example/card", truth: "phishing", aiVerdict: "Probably phishing", risk: 70, isAIWrong: false },

  { id: "B09", from: "Skyfile Cloud <hello@skyfile.example>", subject: "Your backup finished with 3 warnings",
    body: "Hi,\n\nYour scheduled backup of \"Laptop\" finished last night, but 3 files were skipped because they were larger than your plan's 4 GB file limit.\n\nBackup completed: Tue 12 Nov, 1:14 AM\nFiles backed up: 18,402\nFiles skipped: 3 (videos, 11.6 GB in total)\n\nEverything else was backed up as normal. You can see the skipped files and choose what to do with them in your dashboard.\n\n{link}\n\nNo action is needed if you don't want these files backed up.\n\nThe Skyfile team",
    footer: "Skyfile Ltd, 48 Foundry Lane\nTurn off backup reports in your notification settings.",
    link: "Link: https://skyfile.example/dashboard/backups", truth: "legit", aiVerdict: "Probably phishing", risk: 66, isAIWrong: true },

  { id: "B10", from: "Bluewave Mobile <offers@bluewave-gifts.example>", subject: "You're our lucky customer! Claim your $500 gift card",
    body: "Dear Bluewave Customer,\n\nGREAT NEWS! Your mobile number was chosen as this month's lucky winner of a $500 shopping gift card!\n\nReward value: $500\nClaim code: BW-GIFT-6610\n\nTo receive your gift card, just confirm your details and pay a small processing fee of $3.95.\n\n{link}\n\nAct fast! This reward expires in 12 hours and cannot be reissued.\n\nBluewave Rewards Team",
    footer: "Bluewave Rewards. Terms and conditions apply.",
    link: "Link: https://bluewave-gift.example/claim", truth: "phishing", aiVerdict: "Phishing", risk: 96, isAIWrong: false },
];

const EMAIL_SETS = { A: emailsSetA, B: emailsSetB };
