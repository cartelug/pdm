/* Starts the repository on a local PHP server for the quality checks. */
const cp = require("child_process");
const net = require("net");
const path = require("path");
const root = path.resolve(__dirname, "../..");

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
    probe.on("error", reject);
  });
}

async function start() {
  const port = await freePort();
  const server = cp.spawn(process.env.PCI_TEST_PHP || "php", ["-S", "127.0.0.1:" + port, "-t", root], {
    cwd: root,
    env: { ...process.env, PHP_CLI_SERVER_WORKERS: "8" },
    stdio: "ignore",
  });
  const base = "http://127.0.0.1:" + port;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(base + "/");
      if (response.ok) return { base, stop: () => server.kill() };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  server.kill();
  throw new Error("The local test server did not start.");
}

module.exports = { start, root };
