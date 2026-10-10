// Run with Playwright available on NODE_PATH: node tests/simple-settings.browser.cjs
// Uses a fresh browser context and only fictional scenarios; no server required.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { window.showSaveFilePicker = undefined; });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const output = path.resolve('output/simple-settings');
  await fs.mkdir(output, { recursive: true });
  const key = 'family-retirement-simulator:v1.12:scenario';
  const url = pathToFileURL(path.resolve('retirement-simulator.html')).href;
  const settle = () => page.waitForTimeout(650);
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  const dashboard = () => page.locator('#kpis').innerText();
  const edit = async (id, value) => {
    await page.locator(id).fill(String(value));
    await page.locator(id).press('Tab');
    await settle();
  };
  try {
    await page.goto(url);
    await settle();
    assert.equal(await page.locator('#simpleSettings').isVisible(), true);
    assert.equal(await page.locator('#advancedSettings').isVisible(), false);
    assert.equal(await page.locator('#simpleSettings section').count(), 3);
    assert.equal(await page.locator('#simpleSettings input:visible').count(), 11);
    assert.match(await page.locator('#simpleSettings').innerText(), /Fictional example amounts/);
    await page.screenshot({ path: path.join(output, 'simple-desktop.png'), fullPage: true });

    await edit('#simple-people-0-super', 333000);
    let scenario = await saved();
    assert.equal(scenario.people[0].super, 333000);
    assert.deepEqual(scenario.lumpSumWithdrawals, []);
    const initialJson = JSON.stringify(scenario);
    const initialDashboard = await dashboard();
    await page.locator('#advancedMode').click();
    await settle();
    assert.equal(await page.locator('#advancedSettings').isVisible(), true);
    assert.equal(JSON.stringify(await saved()), initialJson);
    assert.equal(await dashboard(), initialDashboard);
    assert.equal(await page.locator('[data-path="people.0.super"]').inputValue(), '$333,000');
    await page.reload();
    await settle();
    assert.equal(await page.locator('#advancedSettings').isVisible(), true);
    await page.locator('#simpleMode').click();
    await settle();

    // Merely changing the display period must not round the saved annual amount.
    await page.locator('#simpleSpendingPeriod').selectOption('month');
    await settle();
    assert.equal((await saved()).household.targetAfterTax, 80000);
    await edit('#simple-spending', 6000);
    assert.equal((await saved()).household.targetAfterTax, 72000);
    assert.equal((await saved()).household.annualBudget, 72000);
    await page.locator('#simpleSpendingPeriod').selectOption('week');
    await settle();
    assert.equal((await saved()).household.targetAfterTax, 72000);
    await edit('#simple-spending', 1500);
    assert.equal((await saved()).household.targetAfterTax, 78000);
    await page.locator('#simpleSpendingPeriod').selectOption('year');
    await settle();
    assert.equal(await page.locator('#simple-spending').inputValue(), '78000');

    await edit('#simple-people-0-age', 65);
    assert.equal(await page.locator('#simple-people-0-salary').count(), 0);
    assert.equal((await saved()).people[0].salary, 85000);
    await edit('#simple-people-0-age', 63);
    assert.equal(await page.locator('#simple-people-0-salary').isVisible(), true);
    await page.locator('#simple-household-type').selectOption('single');
    await settle();
    assert.equal(await page.locator('#simple-people-1-age').count(), 0);
    assert.match(await page.locator('#simpleSettings').innerText(), /50% share/);
    await page.locator('#simple-household-type').selectOption('couple');
    await settle();
    assert.equal((await saved()).people[1].super, 165000);

    // Invalid Simple input stays editable and cannot disappear behind a mode switch.
    await page.locator('#simple-people-0-age').fill('-1');
    await settle();
    assert.equal(await page.locator('#projectionError').isVisible(), true);
    await page.locator('#themeToggle').click();
    assert.equal(await page.locator('#projectionError').isVisible(), true);
    await page.locator('#themeToggle').click();
    await page.locator('#advancedMode').click();
    assert.equal(await page.locator('#simpleSettings').isVisible(), true);
    await edit('#simple-people-0-age', 63);
    assert.equal(await page.locator('#projectionError').isVisible(), false);

    // Related-field errors retain the draft until the other field is corrected.
    await edit('#simple-people-0-age', 70);
    assert.equal(await page.locator('#projectionError').isVisible(), true);
    await edit('#simple-people-0-retireAge', 70);
    assert.equal((await saved()).people[0].age, 70);
    assert.equal((await saved()).people[0].retireAge, 70);
    assert.equal(await page.locator('#projectionError').isVisible(), false);

    // Import a rich scenario; Simple must not drop hidden records or distinct budgets.
    scenario = await page.evaluate(() => RetirementSimulatorCore.makeSampleScenario());
    scenario.scenarioName = 'Browser test household';
    scenario.assumptions.inflationMode = 'manual';
    scenario.assumptions.manualInflationPct = 3.7;
    const importJson = JSON.stringify(scenario);
    await page.locator('#scenarioFile').setInputFiles({ name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(importJson) });
    await settle();
    assert.match(await page.locator('#simpleSettings').innerText(), /Additional settings are active/);
    assert.match(await page.locator('#simpleSettings').innerText(), /separate essential budget/);
    const importedDashboard = await dashboard();
    await page.locator('#advancedMode').click();
    await settle();
    assert.equal(await dashboard(), importedDashboard);
    await page.screenshot({ path: path.join(output, 'advanced-desktop.png'), fullPage: true });
    await page.locator('#simpleMode').click();
    await settle();
    await edit('#simple-spending', 90000);
    scenario = await saved();
    assert.equal(scenario.household.annualBudget, 70000);
    assert.equal(scenario.lumpSumWithdrawals.length, 2);
    assert.equal(scenario.assumptions.manualInflationPct, 3.7);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#exportScenario').click();
    const download = await downloadEvent;
    const exported = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
    assert.deepEqual(exported, scenario);
    await page.reload();
    await settle();
    assert.equal(await page.locator('#simpleSettings').isVisible(), true);
    assert.equal(await page.locator('#simple-spending').inputValue(), '90000');

    // Hidden validation points back to its Advanced field.
    await page.locator('#advancedMode').click();
    await settle();
    await page.locator('[data-path="people.0.superAccessAge"]').fill('59');
    await settle();
    await page.locator('#simpleMode').click();
    await settle();
    assert.equal(await page.locator('#projectionError').isVisible(), true);
    await page.locator('[data-validation-path="people.0.superAccessAge"]').click();
    await settle();
    assert.equal(await page.locator('#advancedSettings').isVisible(), true);
    assert.equal(await page.locator('[data-path="people.0.superAccessAge"]').evaluate(el => el === document.activeElement), true);
    await edit('[data-path="people.0.superAccessAge"]', 65);
    await page.locator('#simpleMode').click();
    await settle();
    await page.locator('#themeToggle').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(output, 'simple-mobile-light.png'), fullPage: true });
    await page.locator('#advancedMode').click();
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('Simple settings browser checks passed: editing, parity, periods, validation, import/export, persistence and responsive layout.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
