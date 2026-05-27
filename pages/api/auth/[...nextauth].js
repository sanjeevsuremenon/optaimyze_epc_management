import NextAuth from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "../../../lib/mongoconnect";
import bcrypt from "bcrypt";

const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  //configure auth providers
  providers: [
    CredentialsProvider({
      name: "JALMMWebAPP",
      // credentials:{},
      credentials: {
        email: {},
        // name: {},
        password: {},
        // role: {},
      },
      async authorize(credentials, req, session) {
        const { db } = await connectToDatabase();
        const normalizedEmail = String(credentials?.email || "").trim().toLowerCase();

        const user = await db
          .collection("users")
          .findOne({ email: normalizedEmail });

        if (!user) {
          console.log("no such user");
          return null;
        }

        // Support both plaintext (legacy) and bcrypt-hashed passwords
        const candidate = credentials?.password || "";
        const stored = user.password || "";

        let isValid = false;
        try {
          // If stored looks like a bcrypt hash, try compare; otherwise will likely return false fast
          isValid = await bcrypt.compare(candidate, stored);
        } catch (err) {
          isValid = false;
        }

        if (!isValid) {
          // Fallback for legacy plaintext passwords
          isValid = stored === candidate;
        }

        if (!isValid) {
          console.log("nor right credentials");
          return null;
        }

        return {
          id: user._id?.toString?.() || user.id || undefined,
          name: user.name || user.email,
          email: user.email,
          role: user.role || "user",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  callbacks: {
    async jwt({ token, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (user) {
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token from a provider.
      session.user = session.user || {};
      if (token) {
        session.user.role = token.role;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
 
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
};

export default NextAuth(authOptions);
export { authOptions };
