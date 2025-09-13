const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function captureRemainingScreenshots() {
  console.log('📸 Capturing remaining User Guide screenshots...\n');

  const docsDir = path.join(__dirname, '../docs/userguide');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  let electronProcess;
  let browser;

  try {
    // Kill existing processes
    try {
      require('child_process').execSync('pkill -f "Electron.*mcp-config-manager"', { stdio: 'ignore' });
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {}

    // Start Electron app
    console.log('Starting Electron app...');
    electronProcess = spawn('npx', ['electron', 'dist/main/main.js', '--remote-debugging-port=9222'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
      stdio: 'pipe'
    });

    await new Promise(r => setTimeout(r, 5000));

    // Connect Puppeteer
    console.log('Connecting to Electron app...');
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });

    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Wait for app to load
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // Skip landing if present
    const hasLanding = await page.$eval('body', body =>
      body.textContent?.includes('Get Started')
    ).catch(() => false);

    if (hasLanding) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Get Started'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    // Select Claude Desktop for data
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 2000));

    // ===========================================
    // SETTINGS MODAL
    // ===========================================
    console.log('\n⚙️ Capturing Settings Modal...');

    // Open Settings
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const settingsBtn = buttons.find(btn => btn.textContent?.includes('Settings'));
      if (settingsBtn) settingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Client Management Tab (default)
    const settingsModal = await page.$('.modal-box');
    if (settingsModal) {
      const box = await settingsModal.boundingBox();

      // Full modal
      await page.screenshot({
        path: path.join(docsDir, '04-settings-client-management-full.png'),
        type: 'png',
        clip: box
      });
      console.log('✓ Settings - Client Management tab (full)');

      // Focus on clients list area
      await page.screenshot({
        path: path.join(docsDir, '04-settings-clients-focused.png'),
        type: 'png',
        clip: {
          x: box.x + 20,
          y: box.y + 100,
          width: box.width - 40,
          height: Math.min(400, box.height - 150)
        }
      });
      console.log('✓ Settings - Clients list (focused)');
    }

    // 2. General Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a.tab'));
      const generalTab = tabs.find(tab => tab.textContent?.includes('General'));
      if (generalTab) generalTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    if (settingsModal) {
      const box = await settingsModal.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '04-settings-general-tab.png'),
        type: 'png',
        clip: box
      });
      console.log('✓ Settings - General tab');

      // Focus on theme/preferences area
      await page.screenshot({
        path: path.join(docsDir, '04-settings-general-focused.png'),
        type: 'png',
        clip: {
          x: box.x + 20,
          y: box.y + 100,
          width: box.width - 40,
          height: Math.min(400, box.height - 150)
        }
      });
      console.log('✓ Settings - General preferences (focused)');
    }

    // 3. Advanced Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a.tab'));
      const advancedTab = tabs.find(tab => tab.textContent?.includes('Advanced'));
      if (advancedTab) advancedTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    if (settingsModal) {
      const box = await settingsModal.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '04-settings-advanced-tab.png'),
        type: 'png',
        clip: box
      });
      console.log('✓ Settings - Advanced tab');

      // Focus on developer options
      await page.screenshot({
        path: path.join(docsDir, '04-settings-advanced-focused.png'),
        type: 'png',
        clip: {
          x: box.x + 20,
          y: box.y + 100,
          width: box.width - 40,
          height: Math.min(400, box.height - 150)
        }
      });
      console.log('✓ Settings - Developer options (focused)');
    }

    // Close Settings
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));

    // ===========================================
    // ADD SERVER - DETAILED CAPTURES
    // ===========================================
    console.log('\n➕ Capturing Add Server details...');

    // Open Add Server modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Server'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Fill in details
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder*="name" i]');
      if (nameInput) {
        nameInput.value = 'GitHub MCP Server';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const commandInput = document.querySelector('input[placeholder*="command" i]');
      if (commandInput) {
        commandInput.value = 'npx';
        commandInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Add arguments
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addArgBtn = buttons.find(btn => btn.textContent?.includes('Add Argument'));
      if (addArgBtn) addArgBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const argInputs = document.querySelectorAll('input[placeholder*="argument" i]');
      if (argInputs[0]) {
        argInputs[0].value = '@modelcontextprotocol/server-github';
        argInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Focus on environment variables area
    const envInput = await page.$('textarea, input[placeholder*="JSON format" i]');
    if (envInput) {
      await page.evaluate(() => {
        const input = document.querySelector('textarea') || document.querySelector('input[placeholder*="JSON format" i]');
        if (input) {
          input.value = JSON.stringify({
            "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",
            "GITHUB_ORG": "my-organization",
            "DEBUG": "true",
            "API_URL": "https://api.github.com"
          }, null, 2);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await new Promise(r => setTimeout(r, 500));

      const box = await envInput.boundingBox();
      if (box) {
        // Capture environment variables field with context
        await page.screenshot({
          path: path.join(docsDir, '03-environment-variables-json.png'),
          type: 'png',
          clip: {
            x: Math.max(0, box.x - 50),
            y: Math.max(0, box.y - 100),
            width: Math.min(box.width + 100, 800),
            height: Math.min(box.height + 150, 400)
          }
        });
        console.log('✓ Environment Variables JSON input (focused)');
      }
    }

    // Full modal with filled data
    const addServerModal = await page.$('.modal-box');
    if (addServerModal) {
      const box = await addServerModal.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '03-add-server-complete.png'),
        type: 'png',
        clip: box
      });
      console.log('✓ Add Server modal (complete with data)');
    }

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));

    // ===========================================
    // PROFILES
    // ===========================================
    console.log('\n👤 Capturing Profile Management...');

    // Click Profiles button
    const profilesBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Profiles'));
      if (btn) {
        const rect = btn.getBoundingClientRect();
        btn.click();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }
      return null;
    });

    if (profilesBtn) {
      await new Promise(r => setTimeout(r, 1500));

      // Capture profiles dropdown/modal
      const profilesModal = await page.$('.modal-box');
      const profilesDropdown = await page.$('.dropdown-content');

      if (profilesModal) {
        const box = await profilesModal.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '05-profiles-modal.png'),
          type: 'png',
          clip: box
        });
        console.log('✓ Profiles modal');
      } else if (profilesDropdown) {
        const box = await profilesDropdown.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '05-profiles-dropdown.png'),
          type: 'png',
          clip: {
            x: box.x - 20,
            y: box.y - 20,
            width: box.width + 40,
            height: box.height + 40
          }
        });
        console.log('✓ Profiles dropdown menu');
      } else {
        // Capture area around profiles button
        await page.screenshot({
          path: path.join(docsDir, '05-profiles-area.png'),
          type: 'png',
          clip: {
            x: profilesBtn.x - 50,
            y: profilesBtn.y - 50,
            width: 400,
            height: 300
          }
        });
        console.log('✓ Profiles area');
      }

      // Close profiles
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 500));
    }

    // ===========================================
    // SCOPE VIEWS
    // ===========================================
    console.log('\n🔄 Capturing Scope views...');

    // Project scope
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
      const projectBtn = buttons.find(btn => btn.textContent?.trim() === 'Project');
      if (projectBtn) projectBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(docsDir, '06-project-scope.png'),
      type: 'png',
      clip: {
        x: 0,
        y: 40,
        width: 1920,
        height: 900
      }
    });
    console.log('✓ Project scope view');

    // System scope
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
      const systemBtn = buttons.find(btn => btn.textContent?.trim() === 'System');
      if (systemBtn) systemBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(docsDir, '06-system-scope.png'),
      type: 'png',
      clip: {
        x: 0,
        y: 40,
        width: 1920,
        height: 900
      }
    });
    console.log('✓ System scope view');

    // ===========================================
    // ACTION BUTTONS DETAIL
    // ===========================================
    console.log('\n🎯 Capturing UI details...');

    // Back to User scope
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
      const userBtn = buttons.find(btn => btn.textContent?.trim() === 'User');
      if (userBtn) userBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Top toolbar focused
    await page.screenshot({
      path: path.join(docsDir, '07-top-toolbar.png'),
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 100
      }
    });
    console.log('✓ Top toolbar');

    // Status bar focused
    await page.screenshot({
      path: path.join(docsDir, '07-status-bar.png'),
      type: 'png',
      clip: {
        x: 0,
        y: 1000,
        width: 1920,
        height: 80
      }
    });
    console.log('✓ Status bar');

    // ===========================================
    // SUMMARY
    // ===========================================
    console.log('\n✅ Screenshot capture completed!');

    const allScreenshots = fs.readdirSync(docsDir).filter(f => f.endsWith('.png'));
    console.log(`\n📁 Total screenshots in docs/userguide/: ${allScreenshots.length}`);

    // Group screenshots by category
    const categories = {
      'Landing': allScreenshots.filter(f => f.startsWith('00-')),
      'Main Interface': allScreenshots.filter(f => f.startsWith('01-')),
      'Server List': allScreenshots.filter(f => f.startsWith('02-')),
      'Add Server': allScreenshots.filter(f => f.startsWith('03-')),
      'Settings': allScreenshots.filter(f => f.startsWith('04-')),
      'Profiles': allScreenshots.filter(f => f.startsWith('05-')),
      'Scopes': allScreenshots.filter(f => f.startsWith('06-')),
      'UI Details': allScreenshots.filter(f => f.startsWith('07-'))
    };

    console.log('\n📊 Screenshots by category:');
    for (const [category, files] of Object.entries(categories)) {
      if (files.length > 0) {
        console.log(`  ${category}: ${files.length} screenshots`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) await browser.disconnect();
    if (electronProcess) {
      electronProcess.kill();
      console.log('\n🧹 Cleaned up Electron process');
    }
  }
}

captureRemainingScreenshots();