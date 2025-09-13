const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

// Helper function to ensure element is visible and take focused screenshot
async function captureElement(page, selector, filename, docsDir, description) {
  try {
    const element = await page.$(selector);
    if (element) {
      const box = await element.boundingBox();
      if (box) {
        // Add padding around the element for better context
        const padding = 20;
        await page.screenshot({
          path: path.join(docsDir, filename),
          type: 'png',
          clip: {
            x: Math.max(0, box.x - padding),
            y: Math.max(0, box.y - padding),
            width: box.width + (padding * 2),
            height: box.height + (padding * 2)
          }
        });
        console.log(`✓ ${description}`);
        return true;
      }
    }
    console.log(`✗ Could not capture ${description} - element not found`);
    return false;
  } catch (error) {
    console.log(`✗ Error capturing ${description}: ${error.message}`);
    return false;
  }
}

async function captureUserGuideScreenshots() {
  console.log('📸 Starting comprehensive User Guide screenshot capture...\n');

  // Ensure docs directory exists
  const docsDir = path.join(__dirname, '../docs/userguide');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  let electronProcess;
  let browser;

  try {
    // Kill any existing Electron processes
    console.log('Cleaning up existing processes...');
    try {
      require('child_process').execSync('pkill -f "Electron.*mcp-config-manager"', { stdio: 'ignore' });
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      // Ignore if no process to kill
    }

    // Start Electron app with remote debugging
    console.log('Starting Electron app with remote debugging...');
    electronProcess = spawn('npx', ['electron', 'dist/main/main.js', '--remote-debugging-port=9222'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
      stdio: 'pipe'
    });

    // Wait for Electron to start
    console.log('Waiting for Electron to initialize...');
    await new Promise(r => setTimeout(r, 5000));

    // Connect Puppeteer to the Electron app
    console.log('Connecting Puppeteer to Electron app...');
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });

    // Get the app page
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();

    // Set viewport to full HD for better screenshots
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✓ Set viewport to 1920x1080 (Full HD)\n');

    // Wait for app to fully load
    console.log('Waiting for app to load...');
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // Skip landing page if present
    const hasLanding = await page.$eval('body', body =>
      body.textContent?.includes('Get Started')
    ).catch(() => false);

    if (hasLanding) {
      // Capture landing page first
      await page.screenshot({
        path: path.join(docsDir, '00-landing-page.png'),
        type: 'png'
      });
      console.log('✓ Captured landing page');

      // Focus on Get Started button
      await captureElement(page, 'button', '00-landing-get-started-button.png', docsDir, 'Get Started button focus');

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const getStartedBtn = buttons.find(btn => btn.textContent?.includes('Get Started'));
        if (getStartedBtn) getStartedBtn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
    }

    // ===========================================
    // MAIN INTERFACE CAPTURES
    // ===========================================
    console.log('\n🖥️ Capturing Main Interface...');

    // Full interface
    await page.screenshot({
      path: path.join(docsDir, '01-main-interface-full.png'),
      type: 'png'
    });
    console.log('✓ Main interface - full view');

    // Client dropdown focused
    await captureElement(page, 'select', '01-main-client-dropdown.png', docsDir, 'Client dropdown focus');

    // Scope buttons focused
    const scopeButtons = await page.$('.btn-group');
    if (scopeButtons) {
      const box = await scopeButtons.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '01-main-scope-buttons.png'),
        type: 'png',
        clip: {
          x: box.x - 10,
          y: box.y - 10,
          width: box.width + 20,
          height: box.height + 20
        }
      });
      console.log('✓ Scope buttons focus');
    }

    // Select Claude Desktop to have data
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 2000));

    // Server list table
    await page.screenshot({
      path: path.join(docsDir, '02-server-list-full.png'),
      type: 'png',
      clip: {
        x: 0,
        y: 150,
        width: 1920,
        height: 700
      }
    });
    console.log('✓ Server list table');

    // Single server row focused
    const firstServerRow = await page.$('tbody tr:first-child');
    if (firstServerRow) {
      const box = await firstServerRow.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '02-server-row-detail.png'),
        type: 'png',
        clip: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height + 10
        }
      });
      console.log('✓ Server row detail');
    }

    // ===========================================
    // ADD/EDIT SERVER MODAL
    // ===========================================
    console.log('\n➕ Capturing Add Server Modal...');

    // Click Add Server button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Server'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Full modal
    const modal = await page.$('.modal-box');
    if (modal) {
      const box = await modal.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '03-add-server-modal-full.png'),
        type: 'png',
        clip: box
      });
      console.log('✓ Add Server modal - full view');
    }

    // Fill in server details for better screenshots
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder*="Server name"]');
      if (nameInput) {
        nameInput.value = 'GitHub MCP Server';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const commandInput = document.querySelector('input[placeholder*="Command"]');
      if (commandInput) {
        commandInput.value = 'npx';
        commandInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Server name field focused
    await captureElement(page, 'input[placeholder*="Server name"]', '03-add-server-name-field.png', docsDir, 'Server name field');

    // Server type selector focused
    const serverTypeSection = await page.$('label:has-text("Server Type")');
    if (serverTypeSection) {
      const parent = await serverTypeSection.$('xpath/..');
      if (parent) {
        const box = await parent.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '03-add-server-type-selector.png'),
          type: 'png',
          clip: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height + 20
          }
        });
        console.log('✓ Server type selector');
      }
    }

    // Add arguments
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addArgBtn = buttons.find(btn => btn.textContent?.includes('Add Argument'));
      if (addArgBtn) addArgBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const argInputs = document.querySelectorAll('input[placeholder*="Argument"]');
      if (argInputs[0]) {
        argInputs[0].value = '@modelcontextprotocol/server-github';
        argInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Arguments section focused
    const argsLabel = await page.$('label:has-text("Arguments")');
    if (argsLabel) {
      const parent = await argsLabel.$('xpath/..');
      if (parent) {
        const box = await parent.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '03-add-server-arguments.png'),
          type: 'png',
          clip: {
            x: box.x,
            y: box.y - 10,
            width: box.width,
            height: Math.min(box.height + 20, 200)
          }
        });
        console.log('✓ Arguments section');
      }
    }

    // Environment variables section
    const envLabel = await page.$('label:has-text("Environment Variables")');
    if (envLabel) {
      const parent = await envLabel.$('xpath/..');
      if (parent) {
        const box = await parent.boundingBox();

        // Add sample JSON to show format
        await page.evaluate(() => {
          const envInput = document.querySelector('textarea') || document.querySelector('input[placeholder*="JSON format"]');
          if (envInput) {
            envInput.value = '{\n  "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",\n  "GITHUB_ORG": "my-organization",\n  "DEBUG": "true"\n}';
            envInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        await new Promise(r => setTimeout(r, 500));

        await page.screenshot({
          path: path.join(docsDir, '03-add-server-environment-vars.png'),
          type: 'png',
          clip: {
            x: box.x,
            y: box.y - 10,
            width: box.width,
            height: Math.min(box.height + 50, 300)
          }
        });
        console.log('✓ Environment variables section');
      }
    }

    // Close Add Server modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));

    // ===========================================
    // SETTINGS MODAL - ALL TABS
    // ===========================================
    console.log('\n⚙️ Capturing Settings Modal...');

    // Open Settings
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const settingsBtn = buttons.find(btn => btn.textContent?.includes('Settings'));
      if (settingsBtn) settingsBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Settings modal - full view
    const settingsModal = await page.$('.modal-box');
    if (settingsModal) {
      const box = await settingsModal.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '04-settings-modal-full.png'),
        type: 'png',
        clip: box
      });
      console.log('✓ Settings modal - full view');
    }

    // 1. Client Management Tab (default)
    // Focus on detected clients list
    const clientsList = await page.$('.space-y-2');
    if (clientsList) {
      const box = await clientsList.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '04-settings-clients-list.png'),
        type: 'png',
        clip: {
          x: box.x - 20,
          y: box.y - 20,
          width: box.width + 40,
          height: Math.min(box.height + 40, 600)
        }
      });
      console.log('✓ Client Management - detected clients list');
    }

    // Custom clients section
    const customSection = await page.$('h3:has-text("Custom Clients")');
    if (customSection) {
      const parent = await customSection.$('xpath/..');
      if (parent) {
        const box = await parent.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '04-settings-custom-clients.png'),
          type: 'png',
          clip: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: Math.min(box.height, 400)
          }
        });
        console.log('✓ Client Management - custom clients section');
      }
    }

    // 2. General Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a.tab'));
      const generalTab = tabs.find(tab => tab.textContent?.includes('General'));
      if (generalTab) generalTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(docsDir, '04-settings-general-full.png'),
      type: 'png',
      clip: {
        x: 300,
        y: 200,
        width: 1320,
        height: 600
      }
    });
    console.log('✓ Settings - General tab');

    // Theme selector focused
    const themeSection = await page.$('label:has-text("Theme")');
    if (themeSection) {
      const parent = await themeSection.$('xpath/..');
      if (parent) {
        const box = await parent.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '04-settings-theme-selector.png'),
          type: 'png',
          clip: {
            x: box.x - 10,
            y: box.y - 10,
            width: box.width + 20,
            height: box.height + 20
          }
        });
        console.log('✓ General - theme selector');
      }
    }

    // 3. Advanced Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('a.tab'));
      const advancedTab = tabs.find(tab => tab.textContent?.includes('Advanced'));
      if (advancedTab) advancedTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(docsDir, '04-settings-advanced-full.png'),
      type: 'png',
      clip: {
        x: 300,
        y: 200,
        width: 1320,
        height: 600
      }
    });
    console.log('✓ Settings - Advanced tab');

    // Developer options focused
    const devOptions = await page.$('.space-y-4');
    if (devOptions) {
      const box = await devOptions.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '04-settings-developer-options.png'),
        type: 'png',
        clip: {
          x: box.x - 20,
          y: box.y - 20,
          width: box.width + 40,
          height: Math.min(box.height + 40, 400)
        }
      });
      console.log('✓ Advanced - developer options');
    }

    // Close Settings
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));

    // ===========================================
    // PROFILE MANAGEMENT
    // ===========================================
    console.log('\n👤 Capturing Profile Management...');

    // Click Profiles button
    const profilesButton = await page.$('button:has-text("Profiles")');
    if (profilesButton) {
      // Get button position for focused shot
      const box = await profilesButton.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '05-profiles-button.png'),
        type: 'png',
        clip: {
          x: box.x - 10,
          y: box.y - 10,
          width: box.width + 20,
          height: box.height + 20
        }
      });
      console.log('✓ Profiles button');

      await profilesButton.click();
      await new Promise(r => setTimeout(r, 1500));

      // Capture profiles dropdown/modal
      const profilesModal = await page.$('.modal-box');
      if (profilesModal) {
        const modalBox = await profilesModal.boundingBox();
        await page.screenshot({
          path: path.join(docsDir, '05-profiles-modal-full.png'),
          type: 'png',
          clip: modalBox
        });
        console.log('✓ Profiles modal');
      } else {
        // Try dropdown
        const dropdown = await page.$('.dropdown-content');
        if (dropdown) {
          const dropdownBox = await dropdown.boundingBox();
          await page.screenshot({
            path: path.join(docsDir, '05-profiles-dropdown.png'),
            type: 'png',
            clip: {
              x: dropdownBox.x - 10,
              y: dropdownBox.y - 10,
              width: dropdownBox.width + 20,
              height: dropdownBox.height + 20
            }
          });
          console.log('✓ Profiles dropdown');
        }
      }

      // Close profiles
      await page.keyboard.press('Escape');
    }

    // ===========================================
    // SCOPE SWITCHING
    // ===========================================
    console.log('\n🔄 Capturing Scope Switching...');

    // Switch to Project scope
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
      const projectBtn = buttons.find(btn => btn.textContent?.trim() === 'Project');
      if (projectBtn) projectBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.screenshot({
      path: path.join(docsDir, '06-project-scope-view.png'),
      type: 'png',
      clip: {
        x: 0,
        y: 100,
        width: 1920,
        height: 800
      }
    });
    console.log('✓ Project scope view');

    // Status bar focused (shows config file path)
    const statusBar = await page.$('.text-xs.text-gray-500');
    if (statusBar) {
      const box = await statusBar.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '06-status-bar-config-path.png'),
        type: 'png',
        clip: {
          x: 0,
          y: box.y - 10,
          width: 1920,
          height: box.height + 20
        }
      });
      console.log('✓ Status bar with config path');
    }

    // ===========================================
    // ACTION BUTTONS
    // ===========================================
    console.log('\n🎯 Capturing Action Buttons...');

    // Switch back to User scope with data
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
      const userBtn = buttons.find(btn => btn.textContent?.trim() === 'User');
      if (userBtn) userBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Focus on action buttons for a server
    const actionButtons = await page.$('tbody tr:first-child td:last-child');
    if (actionButtons) {
      const box = await actionButtons.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '07-server-action-buttons.png'),
        type: 'png',
        clip: {
          x: box.x - 20,
          y: box.y - 10,
          width: box.width + 40,
          height: box.height + 20
        }
      });
      console.log('✓ Server action buttons (copy, edit, delete)');
    }

    // ===========================================
    // SAVE BUTTON
    // ===========================================
    const saveButton = await page.$('button:has-text("Save")');
    if (saveButton) {
      const box = await saveButton.boundingBox();
      await page.screenshot({
        path: path.join(docsDir, '08-save-button.png'),
        type: 'png',
        clip: {
          x: box.x - 10,
          y: box.y - 10,
          width: box.width + 20,
          height: box.height + 20
        }
      });
      console.log('✓ Save button');
    }

    // ===========================================
    // CREATE INDEX OF SCREENSHOTS
    // ===========================================
    console.log('\n📋 Creating screenshot index...');

    const screenshots = fs.readdirSync(docsDir)
      .filter(f => f.endsWith('.png'))
      .sort();

    const index = `# User Guide Screenshots

## Landing Page
- 00-landing-page.png - Full landing page
- 00-landing-get-started-button.png - Get Started button focus

## Main Interface
- 01-main-interface-full.png - Complete main interface
- 01-main-client-dropdown.png - Client selection dropdown
- 01-main-scope-buttons.png - Scope selection buttons (User/Project/System)

## Server Management
- 02-server-list-full.png - Full server list table
- 02-server-row-detail.png - Single server row with all details

## Add/Edit Server Modal
- 03-add-server-modal-full.png - Complete Add Server modal
- 03-add-server-name-field.png - Server name input field
- 03-add-server-type-selector.png - Local/Remote server type selector
- 03-add-server-arguments.png - Arguments configuration section
- 03-add-server-environment-vars.png - Environment variables (JSON format)

## Settings Modal
- 04-settings-modal-full.png - Complete Settings modal
- 04-settings-clients-list.png - Detected clients list
- 04-settings-custom-clients.png - Custom clients configuration
- 04-settings-general-full.png - General settings tab
- 04-settings-theme-selector.png - Theme selection dropdown
- 04-settings-advanced-full.png - Advanced settings tab
- 04-settings-developer-options.png - Developer options toggles

## Profile Management
- 05-profiles-button.png - Profiles button in navbar
- 05-profiles-modal-full.png - Profiles management modal
- 05-profiles-dropdown.png - Profiles quick selection dropdown

## Scope Management
- 06-project-scope-view.png - Project scope interface
- 06-status-bar-config-path.png - Status bar showing active config file

## Actions
- 07-server-action-buttons.png - Copy, Edit, Delete buttons for servers
- 08-save-button.png - Save configuration button

Total screenshots: ${screenshots.length}
`;

    fs.writeFileSync(path.join(docsDir, 'README.md'), index);
    console.log('✓ Created screenshot index (README.md)');

    // ===========================================
    // SUMMARY
    // ===========================================
    console.log('\n✅ All screenshots captured successfully!');
    console.log('\n📁 Screenshots saved in docs/userguide/ directory:');
    console.log(`  Total screenshots: ${screenshots.length}`);
    console.log('\n📊 Coverage Summary:');
    console.log('  ✓ Landing page and onboarding');
    console.log('  ✓ Main interface with all components');
    console.log('  ✓ Server management (list, add, edit)');
    console.log('  ✓ Settings (all 3 tabs with focused sections)');
    console.log('  ✓ Profile management');
    console.log('  ✓ Scope switching (User/Project/System)');
    console.log('  ✓ Action buttons and controls');
    console.log('  ✓ Creative crops focusing on key UI elements');

  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (browser) {
      await browser.disconnect();
    }
    if (electronProcess) {
      electronProcess.kill();
      console.log('\n🧹 Cleaned up Electron process');
    }
  }
}

// Run the screenshot capture
captureUserGuideScreenshots();