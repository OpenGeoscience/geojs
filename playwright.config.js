// @ts-check
var { defineConfig } = require('@playwright/test');

var serverPort = process.env.TEST_SERVER_PORT || '9876';
var serverUrl = 'http://localhost:' + serverPort;

/* Reduce the number of external connections Chrome makes. */
var ChromeFlags = [
  '--no-sandbox',
  '--no-pings',
  '--force-color-profile=srgb',
  '--disable-background-networking',
  '--disable-component-extensions-with-background-pages',
  '--translate-script-url=""',
  '--enable-unsafe-swiftshader',
  '--touch-events'
];

var ChromeHeadedFlags = ChromeFlags.concat([
  '--device-scale-factor=1',
  '--window-position=0,0',
  '--start-fullscreen',
  '--kiosk',
  '--incognito'
]);

/* Firefox preferences to limit external connections */
var FirefoxPrefs = {
  'browser.aboutHomeSnippets.updateUrl': '',
  'browser.casting.enabled': false,
  'browser.library.activity-stream.enabled': false,
  'browser.newtabpage.activity-stream.enabled': false,
  'browser.search.geoip.url': '',
  'browser.selfsupport.enabled': false,
  'browser.selfsupport.url': '',
  'browser.startup.homepage_override.mstone': 'ignore',
  'extensions.getAddons.cache.enabled': false,
  'extensions.pocket.enabled': false,
  'extensions.update.enabled': false,
  'network.captive-portal-service.enabled': false,
  'network.dns.disablePrefetch': true,
  'network.http.speculative-parallel-limit': 0,
  'network.prefetch-next': false,
  'browser.safebrowsing.provider.mozilla.gethashURL': '',
  'browser.safebrowsing.provider.mozilla.updateURL': '',
  'browser.safebrowsing.provider.google.gethashURL': '',
  'browser.safebrowsing.provider.google.updateURL': '',
  'browser.safebrowsing.provider.google4.dataSharingURL': '',
  'browser.safebrowsing.provider.google4.gethashURL': '',
  'browser.safebrowsing.provider.google4.updateURL': '',
  'datareporting.healthreport.uploadEnabled': false,
  'datareporting.policy.dataSubmissionEnabled': false,
  'media.gmp-gmpopenh264.autoupdate': false,
  'media.gmp-manager.url': '',
  'dom.w3c_touch_events.enabled': 1
};

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'playwright-runner.spec.js',
  timeout: 600000,
  expect: {
    timeout: 30000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list']
  ],
  use: {
    actionTimeout: 30000,
    trace: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        headless: true,
        launchOptions: {
          args: ChromeFlags
        },
        hasTouch: true
      }
    },
    {
      name: 'chromium-headed',
      use: {
        browserName: 'chromium',
        headless: false,
        launchOptions: {
          args: ChromeHeadedFlags.concat([
            '--proxy-pac-url=' + serverUrl + '/testdata/proxy-for-tests.pac'
          ])
        },
        hasTouch: true,
        viewport: null
      }
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: true,
        hasTouch: true,
        launchOptions: {
          firefoxUserPrefs: FirefoxPrefs
        }
      }
    },
    {
      name: 'firefox-headed',
      use: {
        browserName: 'firefox',
        headless: false,
        hasTouch: true,
        launchOptions: {
          firefoxUserPrefs: Object.assign({}, FirefoxPrefs, {
            'network.proxy.type': 2,
            'network.proxy.autoconfig_url': serverUrl + '/testdata/proxy-for-tests.pac'
          })
        }
      }
    }
  ]
});
