import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const seleniumUrl = process.env.SELENIUM_URL || 'http://127.0.0.1:4444/wd/hub';
const appUrl = process.env.APP_URL || 'http://webapp.test:3000';
const username = `ui-user-${Date.now()}`;
const password = 'SIT UI passphrase 2026!';
const options = new chrome.Options().addArguments(
  '--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable'
);

const driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .usingServer(seleniumUrl)
  .build();

try {
  await driver.get(`${appUrl}/create`);
  await driver.findElement(By.name('username')).sendKeys(username);
  await driver.findElement(By.name('password')).sendKeys(password);
  await driver.findElement(By.css('button[type="submit"]')).click();

  const displayedPassword = await driver.wait(
    until.elementLocated(By.id('submitted-password')),
    10000
  );
  assert.equal(await displayedPassword.getText(), password);

  await driver.findElement(By.css('form[action="/logout"] button')).click();
  const heading = await driver.wait(until.elementLocated(By.css('h1')), 10000);
  assert.equal(await heading.getText(), 'Login');
  console.log(`ui-test=passed username=${username}`);
} catch (error) {
  fs.writeFileSync('ui-failure.png', await driver.takeScreenshot(), 'base64');
  throw error;
} finally {
  await driver.quit();
}
