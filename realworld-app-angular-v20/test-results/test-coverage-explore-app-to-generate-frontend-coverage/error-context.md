# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-coverage.spec.js >> explore app to generate frontend coverage
- Location: test-coverage.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
    - locator resolved to <button disabled type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    46 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e6]:
      - link "conduit" [ref=e8] [cursor=pointer]:
        - /url: /
        - generic [ref=e9]: conduit
      - generic [ref=e10]:
        - link "Home" [ref=e11] [cursor=pointer]:
          - /url: /
        - link "Sign in" [ref=e12] [cursor=pointer]:
          - /url: /login
        - link "Sign up" [ref=e13] [cursor=pointer]:
          - /url: /register
  - main [ref=e14]:
    - generic [ref=e17]:
      - generic [ref=e18]:
        - heading "Sign up" [level=1] [ref=e19]
        - paragraph
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: Username
            - textbox "Username" [ref=e25]: u1781884001202
          - generic [ref=e26]:
            - generic [ref=e27]: Email address
            - textbox "Email address" [ref=e29]: e1781884001234@t.com
          - generic [ref=e30]:
            - generic [ref=e31]: Password
            - textbox "Password" [active] [ref=e33]: password123
          - generic [ref=e34]:
            - generic [ref=e35]: Password confirmation
            - textbox "Password confirmation" [ref=e37]
        - button "Sign up" [disabled] [ref=e39]
  - contentinfo [ref=e40]:
    - generic [ref=e41]:
      - link "GitHub" [ref=e43] [cursor=pointer]:
        - /url: https://github.com/TomislavVinkovic/realworld-laravel-angular
        - generic [ref=e44]: GitHub
        - img [ref=e45]
      - paragraph [ref=e48]: © 2026 Conduit. Designed with Angular & Tailwind.
```

# Test source

```ts
  1  | const { test } = require('@playwright/test');
  2  | 
  3  | test('explore app to generate frontend coverage', async ({ page }) => {
  4  |   await page.goto('http://localhost:4200/');
  5  |   await page.waitForTimeout(1000);
  6  | 
  7  |   await page.click('a[href="/register"]');
  8  |   await page.waitForTimeout(500);
  9  |   await page.fill('input[formcontrolname="username"]', 'u' + Date.now());
  10 |   await page.fill('input[formcontrolname="email"]', 'e' + Date.now() + '@t.com');
  11 |   await page.fill('input[formcontrolname="password"]', 'password123');
> 12 |   await page.click('button[type="submit"]');
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  13 |   await page.waitForTimeout(2000);
  14 | 
  15 |   await page.click('a[href="/editor"]');
  16 |   await page.waitForTimeout(500);
  17 |   await page.fill('input[formcontrolname="title"]', 'Test Article');
  18 |   await page.fill('input[formcontrolname="description"]', 'Testing');
  19 |   await page.fill('textarea[formcontrolname="body"]', '# Hello');
  20 |   await page.fill('input[formcontrolname="tagList"]', 'test');
  21 |   await page.press('input[formcontrolname="tagList"]', 'Enter');
  22 |   await page.click('button[type="submit"]');
  23 |   await page.waitForTimeout(2000);
  24 | 
  25 |   await page.click('a[href="/settings"]');
  26 |   await page.waitForTimeout(500);
  27 | 
  28 |   await page.waitForTimeout(7000);
  29 |   console.log('Done!');
  30 | });
  31 | 
```