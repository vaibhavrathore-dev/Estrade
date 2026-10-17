import { test, expect } from "@playwright/test";
const widths = [390, 768, 1024, 1280, 1440];
const user = {
  id: "test-user",
  full_name: "Browser Test Organizer",
  email: "browser@example.invalid",
  user_type: "faculty",
};
async function fixture(
  page,
  { events = [], manage = true, failure = false } = {},
) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body;
    if (path.endsWith("/auth/me")) body = user;
    else if (path.endsWith("/auth/login"))
      body = { access_token: "isolated-browser-fixture" };
    else if (path.endsWith("/auth/register")) body = { id: "test-user" };
    else if (path.endsWith("/dashboard"))
      body = {
        upcoming: events.length,
        ongoing: 0,
        participants: 0,
        coordinators: 0,
        pending_withdrawals: 0,
        event_metrics: {},
      };
    else if (path.endsWith("/committees"))
      body = [
        { id: "committee", name: "Browser test committee", can_manage: manage },
      ];
    else if (path.endsWith("/venues"))
      body = [{ id: "venue", name: "Test venue", capacity: 100 }];
    else if (path.endsWith("/events") && route.request().method() === "POST")
      body = { ...route.request().postDataJSON(), id: "created-event" };
    else if (path.endsWith("/events")) body = events;
    else body = [];
    if (failure && path.endsWith("/dashboard"))
      return route.fulfill({
        status: 503,
        json: { detail: "Test service unavailable" },
      });
    await route.fulfill({ json: body });
  });
}
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test("curtain opening, keyboard replay, session persistence and mobile navigation", async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', {name:'Replay opening'}).waitFor();
  await page.getByRole('button', {name:'Replay opening'}).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', {name:'Skip intro'}).click();
  await expect(page.locator('.estrade-opening')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', {name:'Replay opening'})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button', {name:'Open navigation'}).click();
  await page.getByRole('navigation').getByRole('link', {name:'Login',exact:true}).click();
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
for (const width of widths) {
  test(`responsive pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    for (const path of ["/", "/login", "/signup"]) {
      await page.goto(path);
      if (path === "/")
        await expect(page.getByRole("button", {name:"Replay opening"})).toBeVisible();
      await noOverflow(page);
      if (width === 390 || width === 1440) await page.waitForTimeout(1400);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `/tmp/estrade-recovery/${path === "/" ? "landing-dark" : path.slice(1)}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
    }
    await fixture(page);
    await page.goto("/dashboard");
    await expect(page.getByText("The stage is ready.")).toBeVisible();
    await noOverflow(page);
    if (width === 390)
      await expect(
        page
          .getByRole("button", { name: "Overview", exact: true })
          .locator("span"),
      ).toBeVisible();
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `/tmp/estrade-recovery/dashboard-empty-${width}.png`,
        fullPage: true,
          animations: "disabled",
      });
    await page
      .getByRole("button", { name: "Create Event", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await noOverflow(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
}
test("auth submission, validation, logout, and protected routing (isolated API fixture)", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/signup");
  await page.getByLabel("Full Name", { exact: true }).fill("Browser Test");
  await page.getByLabel("Email Address").fill("browser@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("different-password");
  await page
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await expect(page.locator(".login-message")).toHaveText(
    "Passwords do not match.",
  );
  await page
    .getByLabel("Confirm Password", { exact: true })
    .fill("test-only-password");
  await page
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  await expect(page).toHaveURL(/verify-email/);
  await page.getByLabel("Six-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email Address").fill("browser@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByText("The stage is ready.")).toBeVisible();
  await page.getByRole("button", { name: "Log Out" }).click();
  await expect(page).toHaveURL(/login/);
  await page.unrouteAll();
  await page.route("**/api/v1/auth/me", (r) =>
    r.fulfill({ status: 401, json: { detail: "Not authenticated" } }),
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});
test("featured event, create submission, permissions, API retry", async ({
  page,
}) => {
  const event = {
    id: "event",
    title: "Isolated browser fixture",
    committee_id: "committee",
    venue_id: "venue",
    starts_at: "2099-10-16T10:00:00Z",
    ends_at: "2099-10-16T12:00:00Z",
    status: "confirmed",
    is_published: true,
  };
  await fixture(page, { events: [event] });
  await page.goto("/dashboard");
  await expect(page.locator(".command-feature")).toContainText(
    "Isolated browser fixture",
  );
  await page.screenshot({
    path: "/tmp/estrade-recovery/dashboard-featured.png",
    fullPage: true,
          animations: "disabled",
  });
  await page.getByRole("button", { name: "Open event workspace" }).click();
  await expect(
    page.getByText("Registration → QR attendance → Participation → Certificate"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create Event", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Event name").fill("Browser test submission");
  await dialog.locator("select[name=committee_id]").selectOption("committee");
  await dialog.locator("select[name=venue_id]").selectOption("venue");
  await dialog.getByLabel("Starts (your local time)").fill("2099-10-18T10:00");
  await dialog.getByLabel("Ends (your local time)").fill("2099-10-18T12:00");
  await dialog
    .getByRole("button", { name: "Create Event", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("created successfully");
  await page.unrouteAll();
  await fixture(page, { manage: false });
  await page.goto("/dashboard");
  await expect(page.getByText("The stage is ready.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create Event", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Discover available events" }).click();
  await expect(page.getByRole("heading", { name: "All Events" })).toBeVisible();
  await page.unrouteAll();
  await fixture(page, { failure: true });
  await page.goto("/dashboard");
  await expect(page.getByRole("alert")).toContainText(
    "Test service unavailable",
  );
  await page.unrouteAll();
  await fixture(page);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("The stage is ready.")).toBeVisible();
});
test("reduced motion curtain and navigation without WebGL", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () {
      return null;
    };
  });
  await page.goto("/");
  await expect(page.getByRole("button", {name:"Replay opening"})).toBeVisible();
  await expect(page.locator(".estrade-opening")).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Login", exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
});

test("illuminated theme responsive layouts and theme controls", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("estrade-light", "on"));
  await fixture(page);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    for (const path of ["/", "/login", "/signup", "/dashboard"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-light", "on");
      if (path === "/")
        await expect(page.getByRole("button", {name:"Replay opening"})).toBeVisible();
      if (path === "/dashboard")
        await expect(page.getByText("The stage is ready.")).toBeVisible();
      await noOverflow(page);
      if (width === 390 || width === 1440) await page.waitForTimeout(1400);
      if (width === 390 || width === 1440)
        await page.screenshot({
          path: `/tmp/estrade-recovery/${path === "/" ? "landing" : path.slice(1)}-light-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
    }
  }
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-light", "off");
});

test("login API failure and inaccessible storage remain usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
    Storage.prototype.getItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("button", {name:"Replay opening"})).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Login", exact: true })
    .click();
  await page.route("**/api/v1/auth/login", (r) =>
    r.fulfill({ status: 401, json: { detail: "Invalid email or password" } }),
  );
  await page.getByLabel("Email Address").fill("browser@example.invalid");
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".login-message")).toHaveText(
    "Invalid email or password",
  );
  await expect(
    page.getByRole("button", { name: "Sign In", exact: true }),
  ).toBeEnabled();
});
