# Saviya: Support & Empowerment Platform
**Design and Development of a Grama Niladhari-Verified Privacy-Preserving Community Assistance Management System for Sri Lankan Citizens**

Saviya is a controlled digital bridge between beneficiaries and donors, with Grama Niladhari (GN) verification at the centre. The system addresses the challenges of informal social media requests by protecting beneficiary identity, providing donors with confidence that assistance reaches genuine needs, and ensuring assistance records are traceable.

## 🚀 Core Features
* **Authentication & Roles:** Role-based access for Beneficiary, GN Officer, Donor, and Administrator.
* **Beneficiary Requests:** Allows users to create assistance requests and attach supporting evidence.
* **GN Verification:** Enables GN Officers to review requests and record verification decisions securely.
* **Donor Discovery:** Donors can browse, search, and filter verified assistance requests.
* **Privacy Controls:** Exposes only the information appropriate to each role, protecting sensitive data.
* **Donation Records:** Captures donation and assistance records for full traceability.

## 🛠️ Technology Stack
* **Frontend:** React, responsive UI interfaces, designed with Figma[cite: 1].
* **Backend:** Node.js, RESTful APIs, role-based authentication[cite: 1].
* **Database:** MySQL with a schema aligned to the verification workflow[cite: 1].
* **Services & Cloud:** Firebase (Authentication, Firestore, Storage)[cite: 2].

## 📂 Repository Structure
* `/backend` - Node.js backend API and core services[cite: 2].
* `/frontend` - React frontend application[cite: 2].
* `firebase.json` & `.firebaserc` - Firebase hosting and project configurations[cite: 2].
* `firestore.rules` & `storage.rules` - Security rules for database and storage[cite: 2].

## ⚙️ Getting Started

### Prerequisites
* Node.js (v16 or higher)
* MySQL Server
* Firebase CLI 

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/nishinpriyashan/saviya.git](https://github.com/nishinpriyashan/saviya.git)
   cd saviya

cd backend
npm install
# Configure your .env file with MySQL and Firebase credentials here
npm start

cd ../frontend
npm install
# Configure your frontend environment variables here
npm start
