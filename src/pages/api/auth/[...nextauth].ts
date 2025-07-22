
import NextAuth, { Session } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { JWT } from "next-auth/jwt"

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      const adminIds = process.env.ADMIN_GITHUB_IDS?.split(',').map(id => id.trim()) || [];
      if (token.sub && adminIds.includes(token.sub)) {
        session.user.isAdmin = true;
      } else {
        session.user.isAdmin = false;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
