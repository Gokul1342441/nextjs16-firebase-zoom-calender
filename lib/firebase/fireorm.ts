// lib/fireorm.ts
import * as admin from "firebase-admin";
import { initialize } from "fireorm";

// Import all entities before init (must be imported before initialize() is called)
import "../../entities/User";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const firestore = admin.firestore();
initialize(firestore);

export { firestore };
