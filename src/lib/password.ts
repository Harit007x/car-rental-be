import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "../config/constants";

export const hashPassword = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (
  plain: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};
