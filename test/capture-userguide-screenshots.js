const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function captureUserGuideScreenshots() {
  console.log('📸 Starting User Guide screenshot capture...\n');
  
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
    console.log('✓ Set viewport to 1920x1080 (Full HD)');
    
    // Wait for app to fully load
    console.log('Waiting for app to load...');
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Skip landing page if present
    const hasLanding = await page.$eval('body', body => 
      body.textContent?.includes('Get Started')
    ).catch(() => false);
    
    if (hasLanding) {
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const getStartedBtn = buttons.find(btn => btn.textContent?.includes('Get Started'));
        if (getStartedBtn) getStartedBtn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      console.log('✓ Clicked Get Started');
    }
    
    // Select Claude Desktop to have some data
    await page.waitForSelector('select', { timeout: 5000 });
    await page.select('select', 'claude-desktop');
    await new Promise(r => setTimeout(r, 2000));
    console.log('✓ Selected Claude Desktop');
    
    // ===========================================
    // SETTINGS MODAL - ALL TABS
    // ===========================================
    
    console.log('\n📋 Capturing Settings Modal screens...');
    
    // Open Settings
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
      await new Promise(r => setTimeout(r, 2000));
      
      // 1. Client Management Tab (default)
      await page.screenshot({ 
        path: path.join(docsDir, 'settings-client-management.png'),
        type: 'png',
        clip: {
          x: 200,
          y: 100,
          width: 1520,
          height: 800
        }
      });
      console.log('✓ Captured Settings - Client Management');
      
      // Verify the screenshot
      const clientMgmtExists = fs.existsSync(path.join(docsDir, 'settings-client-management.png'));
      console.log(`  Verification: ${clientMgmtExists ? '✓ File created' : '✗ Failed'}`);
      
      // 2. General Tab
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
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ 
          path: path.join(docsDir, 'settings-general.png'),
          type: 'png',
          clip: {
            x: 200,
            y: 100,
            width: 1520,
            height: 800
          }
        });
        console.log('✓ Captured Settings - General');
        
        const generalExists = fs.existsSync(path.join(docsDir, 'settings-general.png'));
        console.log(`  Verification: ${generalExists ? '✓ File created' : '✗ Failed'}`);
      }
      
      // 3. Advanced Tab
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
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ 
          path: path.join(docsDir, 'settings-advanced.png'),
          type: 'png',
          clip: {
            x: 200,
            y: 100,
            width: 1520,
            height: 800
          }
        });
        console.log('✓ Captured Settings - Advanced');
        
        const advancedExists = fs.existsSync(path.join(docsDir, 'settings-advanced.png'));
        console.log(`  Verification: ${advancedExists ? '✓ File created' : '✗ Failed'}`);
      }
      
      // Close Settings modal
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 1000));
      console.log('✓ Closed Settings modal');
    }
    
    // ===========================================
    // ADD/EDIT SERVER - ENVIRONMENT VARIABLES
    // ===========================================
    
    console.log('\n🔧 Capturing Server Configuration screens...');
    
    // Click Add Server button
    const addServerClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent?.includes('Add Server'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addServerClicked) {
      await new Promise(r => setTimeout(r, 1500));
      
      // Fill in server details
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
      
      // Add arguments
      await page.evaluate(() => {
        const addArgButtons = Array.from(document.querySelectorAll('button'));
        const addArgBtn = addArgButtons.find(btn => btn.textContent?.includes('Add Argument'));
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
      
      // Add environment variables
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addEnvBtn = buttons.find(btn => btn.textContent?.includes('Add Variable'));
        if (addEnvBtn) addEnvBtn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      
      await page.evaluate(() => {
        const keyInputs = document.querySelectorAll('input[placeholder*="Key"]');
        const valueInputs = document.querySelectorAll('input[placeholder*="Value"]');
        
        if (keyInputs[0] && valueInputs[0]) {
          keyInputs[0].value = 'GITHUB_TOKEN';
          keyInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          valueInputs[0].value = 'ghp_xxxxxxxxxxxxxxxxxxxx';
          valueInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      // Add another environment variable
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addEnvBtn = buttons.find(btn => btn.textContent?.includes('Add Variable'));
        if (addEnvBtn) addEnvBtn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      
      await page.evaluate(() => {
        const keyInputs = document.querySelectorAll('input[placeholder*="Key"]');
        const valueInputs = document.querySelectorAll('input[placeholder*="Value"]');
        
        if (keyInputs[1] && valueInputs[1]) {
          keyInputs[1].value = 'GITHUB_ORG';
          keyInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          valueInputs[1].value = 'my-organization';
          valueInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      await new Promise(r => setTimeout(r, 1000));
      
      // Capture the server configuration with environment variables
      await page.screenshot({ 
        path: path.join(docsDir, 'server-environment-variables.png'),
        type: 'png',
        clip: {
          x: 200,
          y: 100,
          width: 1520,
          height: 800
        }
      });
      console.log('✓ Captured Server Configuration with Environment Variables');
      
      const envVarsExists = fs.existsSync(path.join(docsDir, 'server-environment-variables.png'));
      console.log(`  Verification: ${envVarsExists ? '✓ File created' : '✗ Failed'}`);
      
      // Close modal
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // ===========================================
    // PROFILE CREATION
    // ===========================================
    
    console.log('\n👤 Capturing Profile Creation screen...');
    
    // Click Profiles button
    const profilesClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const profileBtn = buttons.find(btn => btn.textContent?.includes('Profiles'));
      if (profileBtn) {
        profileBtn.click();
        return true;
      }
      return false;
    });
    
    if (profilesClicked) {
      await new Promise(r => setTimeout(r, 1500));
      
      // Look for Create Profile or New Profile button
      const createProfileClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find(btn => 
          btn.textContent?.includes('Create Profile') || 
          btn.textContent?.includes('New Profile') ||
          btn.textContent?.includes('Add Profile')
        );
        if (createBtn) {
          createBtn.click();
          return true;
        }
        return false;
      });
      
      if (createProfileClicked) {
        await new Promise(r => setTimeout(r, 1500));
        
        // Fill in profile details
        await page.evaluate(() => {
          const nameInput = document.querySelector('input[placeholder*="Profile name"]') || 
                           document.querySelector('input[placeholder*="Name"]');
          if (nameInput) {
            nameInput.value = 'Development Environment';
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          
          const descInput = document.querySelector('input[placeholder*="Description"]') || 
                           document.querySelector('textarea[placeholder*="Description"]');
          if (descInput) {
            descInput.value = 'Profile for development with GitHub, filesystem, and database access';
            descInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        await page.screenshot({ 
          path: path.join(docsDir, 'profile-creation.png'),
          type: 'png',
          clip: {
            x: 200,
            y: 100,
            width: 1520,
            height: 800
          }
        });
        console.log('✓ Captured Profile Creation');
        
        const profileExists = fs.existsSync(path.join(docsDir, 'profile-creation.png'));
        console.log(`  Verification: ${profileExists ? '✓ File created' : '✗ Failed'}`);
        
        // Close modal
        await page.keyboard.press('Escape');
        await new Promise(r => setTimeout(r, 1000));
      } else {
        // If no create button, just capture the profiles view
        await page.screenshot({ 
          path: path.join(docsDir, 'profiles-view.png'),
          type: 'png',
          clip: {
            x: 200,
            y: 100,
            width: 1520,
            height: 800
          }
        });
        console.log('✓ Captured Profiles View');
        
        const profilesViewExists = fs.existsSync(path.join(docsDir, 'profiles-view.png'));
        console.log(`  Verification: ${profilesViewExists ? '✓ File created' : '✗ Failed'}`);
      }
      
      // Close profiles modal/dropdown
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // ===========================================
    // FULL SCREEN MAIN INTERFACE
    // ===========================================
    
    console.log('\n🖥️ Capturing Full Screen views...');
    
    // Capture main interface in full screen
    await page.screenshot({ 
      path: path.join(docsDir, 'main-interface-fullscreen.png'),
      type: 'png',
      fullPage: false
    });
    console.log('✓ Captured Main Interface (Full Screen)');
    
    const mainFullExists = fs.existsSync(path.join(docsDir, 'main-interface-fullscreen.png'));
    console.log(`  Verification: ${mainFullExists ? '✓ File created' : '✗ Failed'}`);
    
    // Switch to different clients for variety
    const hasKiro = await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('select option'));
      return options.some(opt => opt.value === 'kiro');
    });
    
    if (hasKiro) {
      await page.select('select', 'kiro');
      await new Promise(r => setTimeout(r, 2000));
      
      await page.screenshot({ 
        path: path.join(docsDir, 'kiro-interface-fullscreen.png'),
        type: 'png',
        fullPage: false
      });
      console.log('✓ Captured Kiro Interface (Full Screen)');
      
      const kiroFullExists = fs.existsSync(path.join(docsDir, 'kiro-interface-fullscreen.png'));
      console.log(`  Verification: ${kiroFullExists ? '✓ File created' : '✗ Failed'}`);
    }
    
    // ===========================================
    // SUMMARY
    // ===========================================
    
    console.log('\n✅ All screenshots captured successfully!');
    console.log('\n📁 Screenshots saved in docs/userguide/ directory:');
    
    const screenshots = fs.readdirSync(docsDir).filter(f => f.endsWith('.png'));
    screenshots.forEach(file => {
      const filePath = path.join(docsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  ✓ ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
    
    console.log('\n📊 Screenshot Summary:');
    console.log(`  Total screenshots: ${screenshots.length}`);
    console.log('  Categories captured:');
    console.log('    • Settings (3 tabs)');
    console.log('    • Server configuration with environment variables');
    console.log('    • Profile creation/management');
    console.log('    • Full screen views');
    
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