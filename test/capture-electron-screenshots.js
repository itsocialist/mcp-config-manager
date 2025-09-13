const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function captureElectronScreenshots() {
  console.log('📸 Starting Electron app screenshot capture...\n');
  
  // Ensure docs directory exists
  const docsDir = path.join(__dirname, '../docs');
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

    // Start Electron app with remote debugging (production mode)
    console.log('Starting Electron app with remote debugging...');
    electronProcess = spawn('npx', ['electron', 'dist/main/main.js', '--remote-debugging-port=9222'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' },
      stdio: 'inherit'  // Show output for debugging
    });

    // Wait for Electron to start and open debugging port
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
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1440, height: 900 });
    
    // Wait for app to fully load
    console.log('Waiting for app to load...');
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // 1. Landing page screenshot
    const hasLanding = await page.$eval('body', body => 
      body.textContent?.includes('My MCP Manager') && 
      body.textContent?.includes('Get Started')
    ).catch(() => false);
    
    if (hasLanding) {
      await page.screenshot({ 
        path: path.join(docsDir, 'screenshot-landing.png'),
        type: 'png'
      });
      console.log('✓ Captured landing page');
      
      // Click Get Started
      const getStartedClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const getStartedBtn = buttons.find(btn => btn.textContent?.includes('Get Started'));
        if (getStartedBtn) {
          getStartedBtn.click();
          return true;
        }
        return false;
      });
      if (getStartedClicked) {
        await new Promise(r => setTimeout(r, 2000));
        console.log('✓ Clicked Get Started');
      }
    }
    
    // 2. Main interface screenshot
    await page.waitForSelector('select', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-main-interface.png'),
      type: 'png'
    });
    console.log('✓ Captured main interface');
    
    // 3. Select Claude Desktop
    const hasClaudeDesktop = await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('select option'));
      return options.some(opt => opt.value === 'claude-desktop');
    });
    
    if (hasClaudeDesktop) {
      await page.select('select', 'claude-desktop');
      await new Promise(r => setTimeout(r, 2000));
      
      await page.screenshot({ 
        path: path.join(docsDir, 'screenshot-claude-desktop.png'),
        type: 'png'
      });
      console.log('✓ Captured Claude Desktop view');
    }
    
    // 4. Add Server modal
    const addButton = await page.$('button.btn-primary');
    if (addButton) {
      await addButton.click();
      await new Promise(r => setTimeout(r, 1500));
      
      // Fill in sample server details
      const nameInput = await page.$('input[placeholder*="Server name"]');
      if (nameInput) {
        await nameInput.type('GitHub MCP Server');
      }
      
      const commandInput = await page.$('input[placeholder*="Command"]');
      if (commandInput) {
        await commandInput.type('npx @modelcontextprotocol/server-github');
      }
      
      // Add an argument
      const addArgButton = await page.$('button.btn-sm.btn-primary');
      if (addArgButton) {
        await addArgButton.click();
        await new Promise(r => setTimeout(r, 500));
        
        const argInput = await page.$('input[placeholder*="Argument"]');
        if (argInput) {
          await argInput.type('--token YOUR_GITHUB_TOKEN');
        }
      }
      
      await page.screenshot({ 
        path: path.join(docsDir, 'screenshot-add-server-modal.png'),
        type: 'png'
      });
      console.log('✓ Captured Add Server modal');
      
      // Close modal
      const cancelButton = await page.$('button.btn-ghost');
      if (cancelButton) {
        await cancelButton.click();
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // 5. Settings modal
    const settingsClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const settingsBtn = buttons.find(btn => btn.textContent?.includes('Settings'));
      if (settingsBtn) {
        settingsBtn.click();
        return true;
      }
      return false;
    });
    
    if (settingsClicked) {
      await new Promise(r => setTimeout(r, 1500));
      
      // Client Management tab (default)
      await page.screenshot({ 
        path: path.join(docsDir, 'screenshot-settings-clients.png'),
        type: 'png'
      });
      console.log('✓ Captured Settings - Client Management');
      
      // General tab
      const generalClicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('a.tab'));
        const generalTab = tabs.find(tab => tab.textContent?.includes('General'));
        if (generalTab) {
          generalTab.click();
          return true;
        }
        return false;
      });
      if (generalClicked) {
        await new Promise(r => setTimeout(r, 1000));
        
        await page.screenshot({ 
          path: path.join(docsDir, 'screenshot-settings-general.png'),
          type: 'png'
        });
        console.log('✓ Captured Settings - General');
      }
      
      // Advanced tab
      const advancedClicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('a.tab'));
        const advancedTab = tabs.find(tab => tab.textContent?.includes('Advanced'));
        if (advancedTab) {
          advancedTab.click();
          return true;
        }
        return false;
      });
      if (advancedClicked) {
        await new Promise(r => setTimeout(r, 1000));
        
        await page.screenshot({ 
          path: path.join(docsDir, 'screenshot-settings-advanced.png'),
          type: 'png'
        });
        console.log('✓ Captured Settings - Advanced');
      }
      
      // Close Settings
      const closeButton = await page.$('button.btn-ghost');
      if (closeButton) {
        await closeButton.click();
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // 6. Select different clients to show variety
    const hasKiro = await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('select option'));
      return options.some(opt => opt.value === 'kiro');
    });
    
    if (hasKiro) {
      await page.select('select', 'kiro');
      await new Promise(r => setTimeout(r, 2000));
      
      // Switch to Project scope
      const projectClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
        const projectBtn = buttons.find(btn => btn.textContent?.trim() === 'Project');
        if (projectBtn) {
          projectBtn.click();
          return true;
        }
        return false;
      });
      
      if (projectClicked) {
        await new Promise(r => setTimeout(r, 1500));
        
        await page.screenshot({ 
          path: path.join(docsDir, 'screenshot-project-scope.png'),
          type: 'png'
        });
        console.log('✓ Captured Project scope view');
      }
    }
    
    // 7. Full page screenshot
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-full-page.png'),
      type: 'png',
      fullPage: true
    });
    console.log('✓ Captured full page view');
    
    // 8. Clean interface shot
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 1500));
    
    await page.screenshot({ 
      path: path.join(docsDir, 'app-interface-clean.png'),
      type: 'png'
    });
    console.log('✓ Captured clean interface');
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log('\n📁 Screenshots saved in docs/ directory:');
    
    const screenshots = [
      'screenshot-landing.png',
      'screenshot-main-interface.png',
      'screenshot-claude-desktop.png',
      'screenshot-add-server-modal.png',
      'screenshot-settings-clients.png',
      'screenshot-settings-general.png',
      'screenshot-settings-advanced.png',
      'screenshot-project-scope.png',
      'screenshot-full-page.png',
      'app-interface-clean.png'
    ];
    
    screenshots.forEach(file => {
      const filePath = path.join(docsDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✓ ${file} (${Math.round(stats.size / 1024)}KB)`);
      }
    });
    
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
captureElectronScreenshots();