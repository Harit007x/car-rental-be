export type AuthRole =
  | "SUPER_ADMIN"
  | "GOVERNMENT_ADMIN"
  | "RENTAL_ADMIN"
  | "DELIVERY_PARTNER";

export interface JwtPayload {
  userId: string;
  role: AuthRole;
  tenantSubdomain: string | null;
  tokenId?: string;
}
