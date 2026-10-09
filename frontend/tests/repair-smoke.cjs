// Real PostgreSQL fixture API on a separate port; only error/empty responses are simulated.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const fixture = JSON.parse(fs.readFileSync('/tmp/estrade-browser-fixture.json'));
const origin = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:8002';
const base = 'http://localhost:5173';
const evidence = process.env.REPAIR_EVIDENCE_DIR || '/tmp/estrade-repair-evidence';
fs.mkdirSync(evidence, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1389,height:785}});
  const runtimeErrors = [], requests = [];
  let failure = null, empty = null, delayCount = 0;
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    requests.push({method:request.method(), path});
    if (request.method() === 'GET' && empty && path === `/api/v1/${empty}`) {
      return route.fulfill({json:[]});
    }
    if (request.method() === 'POST' && path === '/api/v1/events' && failure !== null) {
      const current = failure;
      if (current === 'network') return route.abort('failed');
      if (current === 'timeout') {
        delayCount++;
        await new Promise(resolve => setTimeout(resolve, 17000));
        return route.abort('timedout').catch(() => {});
      }
      if (current === 422) return route.fulfill({status:422,json:{detail:[{loc:['body','title'],msg:'Invalid event title'}]}});
      return route.fulfill({status:current,contentType:'application/json',body:JSON.stringify({detail:`Simulated ${current} response`})});
    }
    const response = await route.fetch({url:request.url().replace(/^http:\/\/[^/]+/,origin)});
    await route.fulfill({response});
  });
  async function login(role) {
    await page.goto(base+'/login');
    await page.getByLabel('Email Address').fill(fixture[role]);
    await page.getByLabel('Password',{exact:true}).fill('test-password-123');
    await page.getByRole('button',{name:'Sign In',exact:true}).click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('heading',{name:/Welcome back, Test/}).waitFor();
  }
  const dialog = () => page.getByRole('dialog');
  const open = async () => { await page.locator('.dashboard-topbar .create-event-button').click(); await dialog().waitFor(); };
  const submit = () => dialog().getByRole('button',{name:'Create Event',exact:true});
  async function fields(title, venue=fixture.venue) {
    await dialog().getByLabel('Event name').fill(title);
    await dialog().locator('[name=committee_id]').selectOption({label:fixture.committee});
    await dialog().locator('[name=venue_id]').selectOption({label:venue+' · capacity 100'});
    await dialog().getByLabel('Starts (your local time)').fill('2027-01-20T10:00');
    await dialog().getByLabel('Ends (your local time)').fill('2027-01-20T12:00');
    await dialog().getByLabel('Participant capacity').fill('50');
    await dialog().locator('[name=status]').selectOption('confirmed');
  }
  async function noOverflow() {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Horizontal page overflow');
    if (await dialog().count()) assert(await dialog().evaluate(e=>e.scrollWidth<=e.clientWidth), 'Dialog horizontal overflow');
  }
  async function fonts(selectors) {
    return page.evaluate(selectors => Object.fromEntries(selectors.map(selector=>[selector,getComputedStyle(document.querySelector(selector)).fontFamily])),selectors);
  }
  await page.goto(base); await page.locator('.landing-logo').waitFor();
  await page.goto(base+'/signup'); await page.getByRole('button',{name:'Create Account',exact:true}).waitFor();
  assert((await fonts(['input','button']))['input'].startsWith('"Times New Roman"'));
  await login('student');
  assert.equal(await page.locator('.dashboard-topbar .create-event-button').isDisabled(), false);
  const before = requests.filter(r=>r.method==='POST'&&r.path==='/api/v1/events').length;
  await open(); await dialog().getByText(/Event creation requires an administrator/).waitFor();
  assert.equal(await dialog().locator('form').count(),0);
  assert.notEqual(await page.locator('.dashboard-topbar .create-event-button').evaluate(e=>getComputedStyle(e).cursor),'wait');
  assert.equal(requests.filter(r=>r.method==='POST'&&r.path==='/api/v1/events').length,before);
  await page.screenshot({path:evidence+'/student-permission.png',fullPage:true});
  await page.keyboard.press('Escape'); await dialog().waitFor({state:'detached'});
  await page.getByRole('button',{name:'Certificates',exact:true}).click(); await page.getByRole('heading',{name:'My certificates'}).waitFor();
  console.log('PASS student: immediate permission feedback, no unauthorized submission, usable navigation');

  await login('admin'); await open();
  await fields('Repair Event A');
  await dialog().getByLabel('Ends (your local time)').fill('2027-01-20T09:00');
  await submit().click(); await dialog().getByRole('alert').filter({hasText:/end time after/}).waitFor(); assert(!await submit().isDisabled());
  await dialog().getByLabel('Ends (your local time)').fill('2027-01-20T12:00');
  await dialog().getByLabel('Participant capacity').fill('101');
  await submit().click(); await dialog().getByRole('alert').filter({hasText:/between 1 and 100/}).waitFor();
  await dialog().getByLabel('Participant capacity').fill('50');
  let created;
  const refreshedList = page.waitForResponse(r=>r.url().endsWith('/api/v1/events')&&r.request().method()==='GET');
  const response = page.waitForResponse(r=>r.url().endsWith('/api/v1/events')&&r.request().method()==='POST');
  await submit().click(); const saved = await response; assert.equal(saved.status(),201); created = await saved.json();
  await dialog().waitFor({state:'detached'}); await page.getByRole('heading',{name:'Repair Event A',level:2,exact:true}).waitFor();
  // The dashboard re-queries PostgreSQL after the create endpoint commits.
  const persisted = (await (await refreshedList).json()).find(event => event.id === created.id);
  assert.equal(persisted.title,'Repair Event A'); assert.equal(persisted.status,'confirmed');
  await open(); await fields('Repair Event B'); await submit().click();
  await dialog().getByRole('alert').filter({hasText:'Venue is already booked for this time'}).waitFor(); assert(!await submit().isDisabled());
  await dialog().locator('[name=venue_id]').selectOption({label:fixture.other+' · capacity 100'});
  await submit().click(); await dialog().waitFor({state:'detached'});
  await page.getByRole('heading',{name:'Repair Event B',level:2,exact:true}).waitFor();
  console.log('PASS organizer: real PostgreSQL save/read, actual 409, other-venue recovery and refreshed dashboard');

  await page.getByRole('button',{name:'Overview',exact:true}).click();
  await page.evaluate(()=>document.fonts.ready);
  const computed = await fonts(['.dashboard-content h1','.sidebar-link','.stat-item p','.dashboard-topbar .create-event-button','.dashboard-search input','.event-information h4']);
  for(const [selector,family] of Object.entries(computed)) assert(family.startsWith('"Times New Roman"'),`${selector}: ${family}`);
  const session=await page.context().newCDPSession(page); await session.send('DOM.enable'); await session.send('CSS.enable');
  const {root}=await session.send('DOM.getDocument');
  const rendered={};
  for(const selector of Object.keys(computed)) {
    const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector});
    rendered[selector]=await session.send('CSS.getPlatformFontsForNode',{nodeId});
  }
  await page.screenshot({path:evidence+'/dashboard-desktop.png',fullPage:true}); await noOverflow();
  await open(); const formFonts=await fonts(['.operations-dialog h2','.operations-form input','.operations-form select','.operations-form textarea','.operations-form button']);
  for(const family of Object.values(formFonts)) assert(family.startsWith('"Times New Roman"'));
  await page.screenshot({path:evidence+'/event-dialog-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844}); await noOverflow(); await page.screenshot({path:evidence+'/event-dialog-mobile.png',fullPage:false});
  await submit().scrollIntoViewIfNeeded();
  assert(await submit().isVisible(), 'Mobile submit must be reachable by scrolling');
  await page.screenshot({path:evidence+'/event-dialog-mobile-submit.png',fullPage:false});
  await dialog().getByRole('button',{name:'Close',exact:true}).click();
  await page.screenshot({path:evidence+'/dashboard-mobile.png',fullPage:true}); await noOverflow();
  await page.setViewportSize({width:1389,height:785});
  fs.writeFileSync(evidence+'/fonts.json',JSON.stringify({computed,formFonts,rendered},null,2));
  console.log('PASS typography: Times New Roman stack for all representatives; actual platform font evidence saved');

  await open(); await fields('Failure recovery');
  for(const status of [403,404,409,422,500,'network']) {
    failure = status;
    await submit().click();
    await dialog().getByRole('alert').filter({hasText:status==='network' ? /Cannot reach Estrade/ : status===422 ? /Invalid event title/ : new RegExp(`Simulated ${status}`)}).waitFor();
    assert(!await submit().isDisabled());
  }
  failure = 'timeout';
  await submit().click();
  // A second synthetic submit must not send another request while busy.
  await dialog().locator('form').dispatchEvent('submit');
  await dialog().getByRole('alert').filter({hasText:/Request timed out/}).waitFor({timeout:20000});
  assert(!await submit().isDisabled()); assert.equal(delayCount,1);
  // Closing must remain usable while a request is pending.
  await submit().click(); await dialog().getByRole('button',{name:'Close',exact:true}).click();
  await dialog().waitFor({state:'detached'}); await page.getByRole('status').filter({hasText:/cancelled locally/}).waitFor();
  failure = null;
  await open(); await fields('Recovered draft'); await dialog().locator('[name=status]').selectOption('draft');
  await submit().click(); await dialog().waitFor({state:'detached'});
  await page.getByRole('heading',{name:'Recovered draft',level:2,exact:true}).waitFor();
  console.log('PASS recovery: 403/404/409/422/500, network, real timeout, duplicate-submit guard, close while pending, successful retry');

  for(const resource of ['committees','venues']) {
    empty=resource; await login('admin'); await open();
    await dialog().getByText(resource==='committees' ? /No eligible committees/ : /No active venues/).waitFor();
    assert.equal(await dialog().locator('form').count(),0);
    await dialog().getByRole('button',{name:'Close',exact:true}).click();
  }
  empty=null; await login('admin'); await open(); await fields('Expired session'); failure=401;
  await submit().click(); await page.waitForURL('**/login');
  await page.getByText(/session may have expired/).waitFor();
  failure=null; await login('admin'); await open(); await dialog().getByLabel('Event name').waitFor();
  console.log('PASS empty prerequisites and 401 re-authentication recovery');
  assert.deepEqual(runtimeErrors,[]);
  fs.writeFileSync(evidence+'/result.json',JSON.stringify({passed:true,runtimeErrors,viewport:{width:1389,height:785},reference:'design-references/dashboard_reference.png'},null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
