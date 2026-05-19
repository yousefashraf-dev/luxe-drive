# قواعد Firebase — مشروع السيارات

## 1️⃣ قواعد Firestore

**المكان:** Firebase Console > Firestore Database > Rules

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // === Public Read (الكل يقدر يقرا) ===
    match /cars/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'yousefgaafer85@gmail.com';
    }

    // === Favorites —— المستخدم يشوف ويعدل اللي له بس ===
    match /favorites/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // === Users —— المستخدم يشوف بروفايله والأدمن يشوف الكل ===
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.email == 'yousefgaafer85@gmail.com');
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // === Stats (زي total_visits) ===
    match /stats/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'yousefgaafer85@gmail.com';
    }

    // === Deny كل حاجة تانية ===
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 2️⃣ قواعد Firebase Storage

**المكان:** Firebase Console > Storage > Rules

```firestore
rules_version = '2';

service firebase.cloud.goog {
  match /b/{bucket}/o {
    // === Cars Images —— أي زائر يشوف, المسجلين بس يرفعوا ===
    match /cars/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // === Denay أي مسار تاني ===
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
