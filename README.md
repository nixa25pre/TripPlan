# 🏖️ Trip Saving Dashboard

A modern and responsive Trip Saving Dashboard built using HTML, CSS, JavaScript, and Chart.js.

The dashboard automatically displays:

* Total Savings
* Remaining Amount
* Goal Progress
* Member Contribution Distribution
* Monthly Collection Statistics
* Top Contributors Leaderboard
* Searchable Member Cards

---

## 🚀 Features

### Dashboard Summary

Displays:

* Total Saved Amount
* Remaining Amount
* Number of Members
* Goal Progress Percentage

### Goal Progress Ring

A doughnut chart showing:

* Saved Amount
* Remaining Amount

### Contribution Distribution

Pie chart showing contribution percentage of each member.

### Monthly Collection

Bar chart displaying monthly collection from January to December.

### Top Contributors

Leaderboard showing highest contributors.

### Member Search

Instant search to find a member quickly.

### Member Cards

Each member card displays:

* Name
* Amount Paid
* Pending Amount
* Target Amount
* Progress Bar
* Contribution Percentage

---

## 📊 Goal Information

| Item                 | Value             |
| -------------------- | ----------------- |
| Goal Amount          | ₹111,000          |
| Members              | 10                |
| Monthly Contribution | ₹1,000 Per Member |

---

## 🛠️ Technologies Used

* HTML5
* CSS3
* JavaScript (ES6)
* Chart.js
* Google Sheets (Data Source)

---

## 📁 Project Structure

TripPlan/

├── index.html

├── css/

│ └── style.css

├── js/

│ └── app.js

└── README.md

---

## 📱 Responsive Design

The application is fully responsive and supports:

* Mobile Devices
* Tablets
* Laptops
* Desktop Screens

---

## 🔄 Dynamic Data Source

The dashboard reads data from Google Sheets.

Sheet Structure:

| Name | Share Per Month | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total per Person |
| ---- | --------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---------------- |

Whenever the sheet is updated, the dashboard can be refreshed to display the latest information.

---

## 📈 Current Statistics

Based on current data:

* Total Saved: ₹37,000
* Remaining: ₹74,000
* Progress: 33.33%

Monthly Collection:

| Month | Amount |
| ----- | ------ |
| Jan   | ₹8,000 |
| Feb   | ₹7,000 |
| Mar   | ₹6,000 |
| Apr   | ₹6,000 |
| May   | ₹5,000 |
| Jun   | ₹4,000 |
| Jul   | ₹1,000 |

---

## ▶️ Run Locally

## 👤 Member account storage

The Create account tab stores member details in the browser's `localStorage` under
`goaTripAccounts`. Each record contains an id, display name, normalized username,
member role, and creation date. Passwords are transformed to a SHA-256 hash before
storage and are never displayed in the Stored accounts section.

The browser-only flow is implemented in `account-store.js`:

1. `TripAccountStore.create()` validates the account and writes it to storage.
2. `TripAccountStore.authenticate()` hashes the supplied password and compares it
   to the saved hash.
3. On sign-in, the session identifies the account; expenses created by that
   account are saved in `goaTripLocalExpenses` and are shown on the overview.

Because this is a static site, these accounts are specific to the current browser
and device. A shared, production account system requires a server-side API and a
database with salted password hashes.

Start a local server:

```bash
cd TripPlan
python3 -m http.server 8000
```

Open:

http://localhost:8000

---

## 🌟 Future Enhancements

* Google Sheets API Integration
* Automatic Live Updates
* Export Reports (PDF/Excel)
* Member Contribution History
* Authentication
* Admin Dashboard
* Dark / Light Theme Toggle

---

## 👨‍💻 Author

Nixan

Trip Saving Dashboard Project
