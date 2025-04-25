import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import prisma from "@/lib/prisma";

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials?.email as string | undefined,
            },
          });

          if (!user) {
            return null;
          }

          const userPassword = user.hashedPassword;
          const loginPassword = credentials?.password;

          if (userPassword !== loginPassword) {
            return null;
          }

          return user;
        } catch (e: any) {
          const errorMessage = e?.response.data.message;
          throw new Error(errorMessage);
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
