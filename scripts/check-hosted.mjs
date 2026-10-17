// Public, read-only release checks. Does not log in, send email or create records.
const base = new URL(
  process.env.CHECK_CLIENT_URL ?? "https://madhublood.vercel.app",
);
if (
  base.protocol !== "https:" ||
  base.username ||
  base.password ||
  base.pathname !== "/" ||
  base.search ||
  base.hash
)
  throw new Error("CHECK_CLIENT_URL must be an HTTPS origin");
const routes = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/dashboard",
  "/admin",
  "/requests",
  "/requests/new",
  "/donors",
];
for (const path of [...routes, "/api/ready", "/api/v1/platform"]) {
  try {
    const response = await fetch(new URL(path, base), {
      signal: AbortSignal.timeout(60000),
      redirect: "error",
    });
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get("content-type") ?? "";
    if (routes.includes(path)) {
      if (
        !type.includes("text/html") ||
        !(await response.text()).includes('id="root"')
      )
        throw new Error("Expected the React entry document");
    } else {
      if (!type.includes("application/json"))
        throw new Error("Expected JSON from the API proxy");
      const body = await response.json();
      if (
        path === "/api/ready" &&
        (body.ready !== true || body.database !== "connected")
      )
        throw new Error("API/database is not ready");
      if (
        path === "/api/v1/platform" &&
        (body.maintenance !== false || body.registrationOpen !== true)
      )
        throw new Error("Maintenance is enabled or registration is closed");
    }
    console.log(`[OK] ${path}`);
  } catch (error) {
    console.error(`[FAIL] ${path}: ${error.message}`);
    process.exitCode = 1;
  }
}
console.log(
  "[MANUAL] Browser login, inbox delivery and private workflows need separate acceptance tests.",
);
