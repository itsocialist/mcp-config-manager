const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureMarketingScreenshots() {
  console.log('📸 Starting marketing screenshot capture...\n');
  
  // Ensure docs directory exists
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  try {
    // Launch Chrome in headless mode for clean screenshots
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--window-size=1440,900'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1440, height: 900 });
    
    // Add some styling to make screenshots look better
    await page.evaluateOnNewDocument(() => {
      // Smooth out any animations
      const style = document.createElement('style');
      style.textContent = `
        * {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
    
    // Connect to the app
    await page.goto('http://localhost:5181', { 
      waitUntil: 'networkidle0', 
      timeout: 10000 
    });
    console.log('✓ Connected to app on port 5181');
    
    // Wait for app to fully load
    await page.waitForSelector('.min-h-screen', { timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000)); // Let everything settle
    
    // 1. Landing page screenshot
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-landing.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured landing page');
    
    // Click Get Started
    const getStartedButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Get Started'));
    });
    if (getStartedButton) {
      await getStartedButton.click();
    }
    await new Promise(r => setTimeout(r, 2000));
    
    // 2. Main interface - empty state
    await page.waitForSelector('select', { timeout: 5000 });
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-main-interface.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured main interface');
    
    // 3. Select Claude Desktop and capture
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 1500));
    
    // Check if there are servers and capture
    const serverCount = await page.$$eval('tbody tr', rows => rows.length);
    if (serverCount > 0) {
      await page.screenshot({ 
        path: path.join(docsDir, 'screenshot-claude-desktop.png'),
        type: 'png',
        fullPage: false
      });
      console.log(`✓ Captured Claude Desktop view with ${serverCount} servers`);
    }
    
    // 4. Add Server modal
    await page.click('button.btn-primary');
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill in example server details
    await page.type('input[placeholder*="name" i]', 'GitHub MCP Server');
    await page.type('input[placeholder*="command" i]', 'npx @modelcontextprotocol/server-github');
    
    // Add an argument
    const addArgButton = await page.$('button.btn-sm.btn-primary');
    if (addArgButton) {
      await addArgButton.click();
      await new Promise(r => setTimeout(r, 500));
      await page.type('input[placeholder*="argument" i]', '--token YOUR_GITHUB_TOKEN');
    }
    
    // Add environment variable
    const envSection = await page.$('text/Environment Variables');
    if (envSection) {
      const addEnvButton = await page.$('button.btn-sm.btn-primary:last-of-type');
      if (addEnvButton) {
        await addEnvButton.click();
        await new Promise(r => setTimeout(r, 500));
        await page.type('input[placeholder*="key" i]', 'GITHUB_TOKEN');
        await page.type('input[placeholder*="value" i]', 'ghp_xxxxxxxxxxxx');
      }
    }
    
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-add-server.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured Add Server modal');
    
    // Close modal
    await page.click('button.btn-ghost');
    await new Promise(r => setTimeout(r, 500));
    
    // 5. Settings screenshots
    const settingsButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('Settings'));
    });
    if (settingsButton) {
      await settingsButton.click();
      await new Promise(r => setTimeout(r, 1500));
    }
    
    // Client Management tab (default)
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-settings-clients.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured Settings - Client Management');
    
    // General tab
    const generalTab = await page.evaluateHandle(() => {
      const tabs = Array.from(document.querySelectorAll('a.tab'));
      return tabs.find(tab => tab.textContent?.includes('General'));
    });
    if (generalTab) {
      await generalTab.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-settings-general.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured Settings - General');
    
    // Advanced tab
    const advancedTab = await page.evaluateHandle(() => {
      const tabs = Array.from(document.querySelectorAll('a.tab'));
      return tabs.find(tab => tab.textContent?.includes('Advanced'));
    });
    if (advancedTab) {
      await advancedTab.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-settings-advanced.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured Settings - Advanced');
    
    // Close Settings
    await page.click('button.btn-ghost');
    await new Promise(r => setTimeout(r, 500));
    
    // 6. Project scope with Kiro
    const clients = await page.$$eval('select option', options => 
      options.map(opt => ({ value: opt.value, text: opt.textContent }))
    );
    
    if (clients.some(c => c.value === 'kiro')) {
      await page.select('select', 'kiro');
      await new Promise(r => setTimeout(r, 1500));
      
      // Click Project scope
      const projectButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
        return buttons.find(btn => btn.textContent?.trim() === 'Project');
      });
      if (projectButton) {
        await projectButton.click();
        await new Promise(r => setTimeout(r, 1500));
      }
      
      await page.screenshot({ 
        path: path.join(docsDir, 'screenshot-project-scope.png'),
        type: 'png',
        fullPage: false
      });
      console.log('✓ Captured Project scope view');
      
      // Switch back to User scope
      const userButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button.btn-sm'));
        return buttons.find(btn => btn.textContent?.trim() === 'User');
      });
      if (userButton) {
        await userButton.click();
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // 7. Full page screenshot
    await page.screenshot({ 
      path: path.join(docsDir, 'screenshot-full-screen.png'),
      type: 'png',
      fullPage: true
    });
    console.log('✓ Captured full screen view');
    
    // 8. Clean interface shot
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ 
      path: path.join(docsDir, 'app-interface-clean.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured clean interface');
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log('\n📁 Screenshots saved in docs/ directory:');
    const screenshots = [
      'screenshot-landing.png',
      'screenshot-main-interface.png', 
      'screenshot-claude-desktop.png',
      'screenshot-add-server.png',
      'screenshot-settings-clients.png',
      'screenshot-settings-general.png',
      'screenshot-settings-advanced.png',
      'screenshot-project-scope.png',
      'screenshot-full-screen.png',
      'app-interface-clean.png'
    ];
    
    screenshots.forEach(file => {
      const filePath = path.join(docsDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✓ ${file} (${Math.round(stats.size / 1024)}KB)`);
      }
    });
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
    console.error('\nMake sure the app is running on http://localhost:5181');
    console.error('Run: VITE_PORT=5181 npm run dev:main');
  }
}

captureMarketingScreenshots();