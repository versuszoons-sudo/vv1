const mineflayer = require("mineflayer");

const formatter = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function timeStamp() {
  return `[${formatter.format(new Date())}]`;
}

function createLogger(method, type) {
  return (...args) => {
    console[method](timeStamp(), `[${type}]`, ...args);
  };
}
//
const log = {
  info: createLogger("log", "INFO"),
  warn: createLogger("warn", "WARN"),
  error: createLogger("error", "ERROR"),
};

function sleep(min, max) {
  const randomDelay = max !== undefined ? min + Math.random() * (max - min) : min;
  return new Promise((resolve) => setTimeout(resolve, randomDelay));
}

// ▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣▣

const COMMAND = process.env.COMMAND;
const SLOT = process.env.SLOT;

let bot = null;

function createBot() {

  if (bot){
    log.warn("Already connected");
    return;
  }
  
  log.info("Starting instance...");

  bot = mineflayer.createBot({
    host: process.env.HOST,
    port: 25565,
    username: process.env.USERNAME,
    version: "1.18",
    chat: "commandsOnly",
    viewDistance: "tiny",
    physicsEnabled: false,
    hideErrors: false,
  });

  bot.spawnCount = 0;

  bot.once("login", async () => {
    log.info("Connected");
  });

  bot.once("spawn", async () => {
    await sleep(3_000, 4_000);
    bot.chat(COMMAND);
    await sleep(3_000, 4_000);

    try {
      if (bot.heldItem) {
        log.info("Activating");
        await bot.activateItem();
      } else {
        log.warn("No item");
      }
    } catch (err) {
      log.error(err);
    }
  });

  bot.once("windowOpen", async (window) => {
    await sleep(3_000, 4_000);

    try {
      log.info("Clicking");
      await bot.clickWindow(SLOT, 0, 0);
    } catch (err) {
      log.error(err);
    }
  });

  bot.on("spawn", () => {
    bot.spawnCount++;
    log.info(`Spawn [${bot.spawnCount}] [${bot.game.dimension}]`);
  });

  bot.on("error", (err) => {
    log.error(err.message);
  });

  bot.on("kicked", (r) => {
    log.warn(r);
  });

  bot.on("end", async (r) => {
    log.warn(r + " Reconnecting...");
    bot = null;
    await sleep(30_000, 60_000);
    createBot();
  });
}

createBot();
