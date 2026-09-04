import { createServer } from "node:net";

const port = Number(process.argv[2]);
const service = process.argv[3] ?? "development server";
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  process.stderr.write("Usage: node scripts/check-port.mjs <port> <service>\n");
  process.exitCode = 1;
} else {
  const server = createServer();
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      process.stderr.write(
        `Cannot start ${service}: port ${port} is already in use. Check existing development processes and Docker containers.\n`,
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  });
  server.once("listening", () => server.close());
  server.listen(port);
}
