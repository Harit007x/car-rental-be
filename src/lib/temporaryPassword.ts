import { randomInt } from "crypto";

export const generateTemporaryPassword = (length = 12) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const allChars = uppercase + lowercase + digits + symbols;

  const requiredChars = [
    uppercase[randomInt(uppercase.length)],
    lowercase[randomInt(lowercase.length)],
    digits[randomInt(digits.length)],
    symbols[randomInt(symbols.length)],
  ];

  const remainingChars = Array.from(
    { length: Math.max(length - requiredChars.length, 0) },
    () => allChars[randomInt(allChars.length)],
  );

  const passwordChars = [...requiredChars, ...remainingChars];

  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
};
