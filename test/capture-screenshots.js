const puppeteer = require('puppeteer-core');
const path = require('path');

async function captureScreenshots() {
  console.log('Starting screenshot capture...\n');
  
  try {
    // Connect to Chrome
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to a good size for screenshots
    await page.setViewport({ width: 1440, height: 900 });
    
    // Connect to the app
    await page.goto('http://localhost:5181', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✓ Connected to app');
    
    // Wait for app to load
    await page.waitForSelector('.min-h-screen', { timeout: 5000 });
    console.log('✓ App loaded');
    
    // Capture landing page
    await page.screenshot({ 
      path: path.join(__dirname, '../docs/screenshot-landing.png'), 
      fullPage: false 
    });
    console.log('✓ Captured landing page');
    
    // Click Get Started button
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Get Started')) {
        await button.click();
        console.log('✓ Clicked Get Started');
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }
    
    // Wait for main interface
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Capture main interface (default state)
    await page.screenshot({ 
      path: path.join(__dirname, '../docs/screenshot-main-interface.png'), 
      fullPage: false 
    });
    console.log('✓ Captured main interface');
    
    // Select Claude Desktop
    const clients = await page.$$eval('select option', options => 
      options.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    
    const hasClaude = clients.some(c => c.value === 'claude-desktop');
    if (hasClaude) {
      await page.select('select', 'claude-desktop');
      console.log('✓ Selected Claude Desktop');
      await new Promise(r => setTimeout(r, 1500));
      
      // Capture with Claude Desktop selected
      await page.screenshot({ 
        path: path.join(__dirname, '../docs/screenshot-claude-desktop.png'), 
        fullPage: false 
      });
      console.log('✓ Captured Claude Desktop view');
    }
    
    // Try to add a server to show the interface with data
    const addButton = await page.$('button.btn-primary');
    if (addButton) {
      await addButton.click();
      console.log('✓ Clicked Add Server');
      await new Promise(r => setTimeout(r, 1000));
      
      // Fill in sample server data
      const nameInput = await page.$('input[placeholder*="name"]');
      if (nameInput) {
        await nameInput.type('GitHub MCP Server');
      }
      
      const commandInput = await page.$('input[placeholder*="command"]');
      if (commandInput) {
        await commandInput.type('npx @modelcontextprotocol/server-github');
      }
      
      // Add an argument
      const addArgButton = await page.$('button.btn-sm.btn-primary');
      if (addArgButton) {
        await addArgButton.click();
        await new Promise(r => setTimeout(r, 500));
        
        const argInput = await page.$('input[placeholder*="argument"]');
        if (argInput) {
          await argInput.type('--token YOUR_GITHUB_TOKEN');
        }
      }
      
      // Capture the add server modal
      await page.screenshot({ 
        path: path.join(__dirname, '../docs/screenshot-add-server.png'), 
        fullPage: false 
      });
      console.log('✓ Captured Add Server modal');
      
      // Close the modal
      const cancelButton = await page.$('button.btn-ghost');
      if (cancelButton) {
        await cancelButton.click();
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // Open Settings
    const settingsButtons = await page.$$('button');
    for (const button of settingsButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Settings')) {
        await button.click();
        console.log('✓ Opened Settings');
        await new Promise(r => setTimeout(r, 1500));
        
        // Capture Settings - Client Management tab
        await page.screenshot({ 
          path: path.join(__dirname, '../docs/screenshot-settings-clients.png'), 
          fullPage: false 
        });
        console.log('✓ Captured Settings - Client Management');
        
        // Click General tab
        const tabs = await page.$$('a.tab');
        for (const tab of tabs) {
          const text = await page.evaluate(el => el.textContent, tab);
          if (text && text.includes('General')) {
            await tab.click();
            await new Promise(r => setTimeout(r, 1000));
            
            // Capture General tab
            await page.screenshot({ 
              path: path.join(__dirname, '../docs/screenshot-settings-general.png'), 
              fullPage: false 
            });
            console.log('✓ Captured Settings - General');
            break;
          }
        }
        
        // Click Advanced tab
        for (const tab of tabs) {
          const text = await page.evaluate(el => el.textContent, tab);
          if (text && text.includes('Advanced')) {
            await tab.click();
            await new Promise(r => setTimeout(r, 1000));
            
            // Capture Advanced tab
            await page.screenshot({ 
              path: path.join(__dirname, '../docs/screenshot-settings-advanced.png'), 
              fullPage: false 
            });
            console.log('✓ Captured Settings - Advanced');
            break;
          }
        }
        
        // Close Settings
        const closeButton = await page.$('button.btn-ghost');
        if (closeButton) {
          await closeButton.click();
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
    
    // Select different clients to show variety
    const hasKiro = clients.some(c => c.value === 'kiro');
    if (hasKiro) {
      await page.select('select', 'kiro');
      console.log('✓ Selected Kiro');
      await new Promise(r => setTimeout(r, 1500));
      
      // Switch to Project scope
      const scopeButtons = await page.$$('button.btn-sm');
      for (const button of scopeButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text === 'Project') {
          await button.click();
          console.log('✓ Switched to Project scope');
          await new Promise(r => setTimeout(r, 1500));
          
          // Capture Project scope view
          await page.screenshot({ 
            path: path.join(__dirname, '../docs/screenshot-project-scope.png'), 
            fullPage: false 
          });
          console.log('✓ Captured Project scope view');
          break;
        }
      }
    }
    
    // Capture a full-screen view
    await page.screenshot({ 
      path: path.join(__dirname, '../docs/screenshot-full-screen.png'), 
      fullPage: true 
    });
    console.log('✓ Captured full screen view');
    
    // Create a clean interface shot with good data
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 1500));
    
    await page.screenshot({ 
      path: path.join(__dirname, '../docs/app-interface-clean.png'), 
      fullPage: false 
    });
    console.log('✓ Captured clean interface');
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log('\nScreenshots saved in docs/ directory:');
    console.log('  - screenshot-landing.png');
    console.log('  - screenshot-main-interface.png');
    console.log('  - screenshot-claude-desktop.png');
    console.log('  - screenshot-add-server.png');
    console.log('  - screenshot-settings-clients.png');
    console.log('  - screenshot-settings-general.png');
    console.log('  - screenshot-settings-advanced.png');
    console.log('  - screenshot-project-scope.png');
    console.log('  - screenshot-full-screen.png');
    console.log('  - app-interface-clean.png');
    
    await browser.close();
    
  } catch (error) {
    console.error('Screenshot capture failed:', error);
  }
}

captureScreenshots();