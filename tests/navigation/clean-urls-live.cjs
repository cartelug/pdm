// Read-only deployment verification: no live pledge, staff or payment records are created.
const { verify } = require("./clean-url-checks.cjs");
(async () => {
  // LiteSpeed can briefly keep serving the previous .htaccess after an atomic update.
  // Recheck the complete contract; a persistent mismatch must still fail deployment.
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      await verify("https://pamodzici.com");
      return;
    } catch (error) {
      if (attempt === 12) throw error;
      console.log(`Production is still refreshing (${attempt}/12): ${error.message.split("\n")[0]}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
