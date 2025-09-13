const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const path = require('path');

async function captureAppScreenshots() {
  console.log('Starting Electron app screenshot capture...\n');
  
  try {
    // Initialize puppeteer-in-electron
    await pie.initialize(puppeteer);
    
    // Connect to the running Electron app
    const browser = await pie.connect({
      puppeteer,
      // Connect to the app running on port 9222 (Electron's default debug port)
      args: ['--remote-debugging-port=9222']
    });
    
    // Get the app window
    const window = await pie.getPage(browser, 'about:blank');
    
    // Wait for app to be ready
    await window.waitForSelector('.min-h-screen', { timeout: 10000 });
    console.log('✓ Connected to Electron app');
    
    // Set viewport for consistent screenshots
    await window.setViewport({ width: 1440, height: 900 });
    
    // Check if we're on landing page or main interface
    const hasGetStarted = await window.$('button:has-text("Get Started")');
    
    if (hasGetStarted) {
      // Capture landing page
      await window.screenshot({ 
        path: path.join(__dirname, '../docs/screenshot-landing.png'),
        fullPage: false 
      });
      console.log('✓ Captured landing page');
      
      // Click Get Started
      await hasGetStarted.click();
      console.log('✓ Clicked Get Started');
      await window.waitForTimeout(2000);
    }
    
    // Wait for main interface
    await window.waitForSelector('select', { timeout: 5000 });
    
    // Capture main interface
    await window.screenshot({ 
      path: path.join(__dirname, '../docs/screenshot-main-interface.png'),
      fullPage: false 
    });
    console.log('✓ Captured main interface');
    
    // Get available clients
    const clients = await window.$$eval('select option', options => 
      options.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    console.log('Available clients:', clients.map(c => c.text).filter(t => t).join(', '));
    
    // Select Claude Desktop if available
    if (clients.some(c => c.value === 'claude-desktop')) {
      await window.select('select', 'claude-desktop');
      console.log('✓ Selected Claude Desktop');
      await window.waitForTimeout(1500);
      
      await window.screenshot({ 
        path: path.join(__dirname, '../docs/screenshot-claude-desktop.png'),
        fullPage: false 
      });
      console.log('✓ Captured Claude Desktop view');
    }
    
    // Try to capture Add Server modal
    const addButton = await window.$('button.btn-primary');
    if (addButton) {
      await addButton.click();
      console.log('✓ Opened Add Server modal');
      await window.waitForTimeout(1000);
      
      // Fill sample data
      const nameInput = await window.$('input[placeholder*="name" i]');
      if (nameInput) {
        await nameInput.type('GitHub MCP Server');
      }
      
      const commandInput = await window.$('input[placeholder*="command" i]');
      if (commandInput) {
        await commandInput.type('npx @modelcontextprotocol/server-github');
      }
      
      await window.screenshot({ 
        path: path.join(__dirname, '../docs/screenshot-add-server.png'),
        fullPage: false 
      });
      console.log('✓ Captured Add Server modal');
      
      // Close modal
      const cancelButton = await window.$('button.btn-ghost');
      if (cancelButton) {
        await cancelButton.click();
        await window.waitForTimeout(500);
      }
    }
    
    // Open Settings
    const settingsButton = await window.$('button:has-text("Settings")');
    if (settingsButton) {
      await settingsButton.click();
      console.log('✓ Opened Settings');
      await window.waitForTimeout(1500);
      
      // Capture Client Management tab
      await window.screenshot({ 
        path: path.join(__dirname, '../docs/screenshot-settings-clients.png'),
        fullPage: false 
      });
      console.log('✓ Captured Settings - Client Management');
      
      // Click General tab
      const generalTab = await window.$('a.tab:has-text("General")');
      if (generalTab) {
        await generalTab.click();
        await window.waitForTimeout(1000);
        
        await window.screenshot({ 
          path: path.join(__dirname, '../docs/screenshot-settings-general.png'),
          fullPage: false 
        });
        console.log('✓ Captured Settings - General');
      }
      
      // Click Advanced tab
      const advancedTab = await window.$('a.tab:has-text("Advanced")');
      if (advancedTab) {
        await advancedTab.click();
        await window.waitForTimeout(1000);
        
        await window.screenshot({ 
          path: path.join(__dirname, '../docs/screenshot-settings-advanced.png'),
          fullPage: false 
        });
        console.log('✓ Captured Settings - Advanced');
      }
      
      // Close Settings
      const closeButton = await window.$('button.btn-ghost');
      if (closeButton) {
        await closeButton.click();
        await window.waitForTimeout(500);
      }
    }
    
    // Select Kiro and show Project scope
    if (clients.some(c => c.value === 'kiro')) {
      await window.select('select', 'kiro');
      console.log('✓ Selected Kiro');
      await window.waitForTimeout(1500);
      
      // Click Project scope button
      const projectButton = await window.$('button.btn-sm:has-text("Project")');
      if (projectButton) {
        await projectButton.click();
        console.log('✓ Switched to Project scope');
        await window.waitForTimeout(1500);
        
        await window.screenshot({ 
          path: path.join(__dirname, '../docs/screenshot-project-scope.png'),
          fullPage: false 
        });
        console.log('✓ Captured Project scope view');
      }
    }
    
    // Full screen capture
    await window.screenshot({ 
      path: path.join(__dirname, '../docs/screenshot-full-screen.png'),
      fullPage: true 
    });
    console.log('✓ Captured full screen view');
    
    // Clean interface shot with Claude Desktop
    await window.select('select', 'claude-desktop');
    await window.waitForTimeout(1500);
    
    await window.screenshot({ 
      path: path.join(__dirname, '../docs/app-interface-clean.png'),
      fullPage: false 
    });
    console.log('✓ Captured clean interface');
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log('\nScreenshots saved in docs/ directory');
    
    await browser.close();
    
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    console.error('\nMake sure the Electron app is running with remote debugging enabled.');
    console.error('You may need to restart the app with: ELECTRON_ENABLE_LOGGING=1 npm run electron:dev');
  }
}

captureAppScreenshots();