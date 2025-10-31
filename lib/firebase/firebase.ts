import * as admin from "firebase-admin";
import { initialize } from "fireorm";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const firestore = admin.firestore();
initialize(firestore);

export { firestore };