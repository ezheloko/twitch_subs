import { NextAuthOptions } from "next-auth"
import TwitchProvider from "next-auth/providers/twitch"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "twitch") {
        try {
          const twitchLogin = (profile as any)?.preferred_username || (profile as any)?.login || user.name?.toLowerCase();
          
          if (!twitchLogin) return false;

          // Проверяем, есть ли уже главный администратор
          let adminCount = 0;
          try {
            adminCount = await prisma.user.count({
              where: { isMainAdmin: true },
            });
          } catch (error) {
            console.error("Error checking admin count:", error);
            // Если база данных не инициализирована, считаем что это первый пользователь
            adminCount = 0;
          }

          const isFirstUser = adminCount === 0;

          // Сначала ищем пользователя по twitchLogin (если был добавлен админом)
          const existingByTwitchLogin = await prisma.user.findUnique({
            where: { twitchLogin: twitchLogin.toLowerCase() },
          });

          // Если пользователь найден по twitchLogin, обновляем его данные
          if (existingByTwitchLogin) {
            await prisma.user.update({
              where: { id: existingByTwitchLogin.id },
              data: {
                email: user.email || existingByTwitchLogin.email,
                name: user.name || existingByTwitchLogin.name,
                image: user.image || existingByTwitchLogin.image,
                twitchLogin: twitchLogin.toLowerCase(),
                // Сохраняем статус админа, если он был установлен
                isMainAdmin: existingByTwitchLogin.isMainAdmin || isFirstUser,
              },
            });
            return true;
          }

          // Если пользователь не найден по twitchLogin, ищем по email
          const email = user.email || `${twitchLogin}@twitch.local`;
          const existingByEmail = await prisma.user.findUnique({
            where: { email },
          });

          if (existingByEmail) {
            // Обновляем существующего пользователя
            await prisma.user.update({
              where: { id: existingByEmail.id },
              data: {
                twitchLogin: twitchLogin.toLowerCase(),
                name: user.name || existingByEmail.name,
                image: user.image || existingByEmail.image,
                // Если это первый пользователь, делаем его главным админом
                ...(isFirstUser ? { isMainAdmin: true } : {}),
              },
            });
          } else {
            // Создаем нового пользователя
            await prisma.user.create({
              data: {
                email,
                name: user.name,
                image: user.image,
                twitchLogin: twitchLogin.toLowerCase(),
                isMainAdmin: isFirstUser,
              },
            });
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          // В случае ошибки все равно разрешаем вход, чтобы пользователь мог увидеть проблему
          return true;
        }
      }
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "twitch" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        if (dbUser) {
          token.id = dbUser.id;
          token.isMainAdmin = dbUser.isMainAdmin;
          token.twitchLogin = dbUser.twitchLogin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).isMainAdmin = token.isMainAdmin;
        (session.user as any).twitchLogin = token.twitchLogin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin",
  },
  session: {
    strategy: "jwt",
  },
}
