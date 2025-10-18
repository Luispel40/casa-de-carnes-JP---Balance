import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"; // defina isso na Vercel depois

export async function registerUser(username: string, password: string) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { username, password: hashed },
  });
  return user;
}

export async function authenticateUser(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { token, user };
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
