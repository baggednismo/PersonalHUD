import * as functions from "firebase-functions";
import { createUserWithEmailAndPassword } from "../src/lib/firebaseAuthService";

export const createUser = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Missing email or password in request body");
  }

  try {
    const userRecord = await createUserWithEmailAndPassword(email, password);
    return res.status(200).json({ uid: userRecord.uid, message: "User created successfully" });
  } catch (error: any) {
    functions.logger.error("Error creating user:", error);
    return res.status(500).send(`Error creating user: ${error.message}`);
  }
});