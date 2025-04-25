import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roleId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roleId?: string;
  }
}
