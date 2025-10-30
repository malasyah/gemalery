import { PrismaClient, ChannelKey } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const channels = [
    { key: ChannelKey.web, name: "Web" },
    { key: ChannelKey.tokopedia, name: "Tokopedia" },
    { key: ChannelKey.shopee, name: "Shopee" },
    { key: ChannelKey.tiktok, name: "TikTok" },
    { key: ChannelKey.offline, name: "Offline" }
  ];
  for (const ch of channels) {
    await prisma.channel.upsert({
      where: { key: ch.key },
      update: { name: ch.name },
      create: ch
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


