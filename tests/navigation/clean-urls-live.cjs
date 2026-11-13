// Read-only deployment verification: no live pledge, staff or payment records are created.
const { verify } = require("./clean-url-checks.cjs");
verify("https://pamodzici.com").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
