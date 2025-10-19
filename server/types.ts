import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export interface AuthRequest extends Request {
  session: {
    userId?: string;
  } & import("express-session").SessionData;
}
