// validate env

export function envCheck() {
  let isWarning = false;
  const requiredEnvVars = ["DISCORD_BOT_TOKEN", "DISCORD_CLIENT_ID"];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );
  if (missingEnvVars.length > 0) {
    console.error(
      "Missing required environment variables:",
      missingEnvVars.join(", ")
    );
    process.exit(1);
  }

  // reddit app oauth vars check, optional
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn(
      "REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET is not set, reddit sources may not work"
    );
    isWarning = true;
  }

  // optional env vars
  if (!process.env.RUN_MODE) {
    console.warn('RUN_MODE is not set, defaulting to "dual"');
    process.env.RUN_MODE = "dual";
    isWarning = true;
  }

  if (!process.env.EXPRESS_PORT) {
    console.warn("EXPRESS_PORT is not set, defaulting to 3000");
    process.env.EXPRESS_PORT = "3000";
    isWarning = true;
  }

  if (isWarning) {
    console.warn("⚙️⚠️  envCheck Passed with warnings");
  } else {
    console.log("⚙️  envCheck Passed");
  }
  return true;
}
