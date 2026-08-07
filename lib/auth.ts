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

          const normalizedTwitchLogin = twitchLogin.toLowerCase().trim();
          const email = user.email || `${normalizedTwitchLogin}@twitch.local`;

          // Проверяем, есть ли уже главный администратор
          let adminCount = 0;
          try {
            adminCount = await prisma.user.count({
              where: { isMainAdmin: true },
            });
          } catch (error) {
            console.error("Error checking admin count:", error);
            adminCount = 0;
          }

          const isFirstUser = adminCount === 0;

          // СНАЧАЛА ищем пользователя по twitchLogin (основной идентификатор для Twitch)
          let existingUser = await prisma.user.findUnique({
            where: { twitchLogin: normalizedTwitchLogin },
          });

          // Если не найден по twitchLogin, ищем по email
          if (!existingUser && email) {
            existingUser = await prisma.user.findUnique({
              where: { email },
            });
          }

          if (existingUser) {
            // Если найден по email, но twitchLogin отличается - это другой Twitch аккаунт с той же почтой
            // Создаем нового пользователя с уникальным email
            if (existingUser.twitchLogin && existingUser.twitchLogin.toLowerCase() !== normalizedTwitchLogin) {
              console.log(`[Auth] Different Twitch account with same email. Creating new user for ${normalizedTwitchLogin}`);
              // Создаем нового пользователя с уникальным email
              await prisma.user.create({
                data: {
                  email: `${normalizedTwitchLogin}@twitch.local`, // Уникальный email для этого Twitch аккаунта
                  name: user.name,
                  image: user.image,
                  twitchLogin: normalizedTwitchLogin,
                  isMainAdmin: false, // Новый пользователь не становится главным админом автоматически
                },
              });
            } else {
              // Обновляем существующего пользователя, НО НЕ ТРОГАЕМ isMainAdmin НИКОГДА
              // Статус главного админа устанавливается только вручную через базу данных
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  twitchLogin: normalizedTwitchLogin,
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  // isMainAdmin НЕ обновляем - сохраняем существующее значение ВСЕГДА
                },
              });
            }
          } else {
            // Создаем нового пользователя
            await prisma.user.create({
              data: {
                email: email,
                name: user.name,
                image: user.image,
                twitchLogin: normalizedTwitchLogin,
                // Только первый пользователь становится главным админом
                isMainAdmin: isFirstUser,
              },
            });
          }

          return true;
        } catch (error) {
          // Если создать/обновить пользователя в БД не удалось, нельзя пускать
          // его дальше - иначе появится "залогиненная" сессия без записи в БД,
          // и все проверки прав ниже по цепочке будут молча падать в null.
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "twitch") {
        // Сначала пытаемся найти по twitchLogin из профиля
        const twitchLogin = (profile as any)?.preferred_username || (profile as any)?.login || user.name?.toLowerCase();
        const normalizedTwitchLogin = twitchLogin ? twitchLogin.toLowerCase().trim() : null;
        
        let dbUser = null;
        
        // Ищем сначала по twitchLogin (основной идентификатор для Twitch)
        if (normalizedTwitchLogin) {
          dbUser = await prisma.user.findUnique({
            where: { twitchLogin: normalizedTwitchLogin },
          });
        }
        
        // Если не найден по twitchLogin, ищем по email
        if (!dbUser && user?.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
        }
        
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
