# Saviya backend

Saviya uses Firebase as its backend rather than a local Node server:

- Firebase Authentication handles accounts and sessions.
- Cloud Firestore stores users, assistance requests, donations, and audit events.
- Cloud Storage stores private supporting documents.
- `../firestore.rules` and `../storage.rules` enforce access control.

Create a Firebase project, enable Email/Password Authentication, Firestore, and Storage, then copy `../frontend/.env.example` to `../frontend/.env.local` and fill in the web app configuration. Deploy the rules with the Firebase CLI from this directory's parent when ready.

Without Firebase configuration, the public landing page still renders locally. Login, registration, and protected workflows correctly report that backend configuration is required.
