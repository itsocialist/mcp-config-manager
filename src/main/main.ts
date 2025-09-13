import { app, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { format } from 'url'
import { isDev } from './utils/environment'
import { setupIpcHandlers } from './ipc/handlers'
import { registerSimplifiedHandlers } from './ipc/simplifiedHandlers'

let mainWindow: BrowserWindow | null = null

const createWindow = (): void => {
  console.log('[Main] Creating window...')
  console.log('[Main] __dirname:', __dirname)
  console.log('[Main] isDev():', isDev())
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      zoomFactor: 1.0
    },
    titleBarStyle: 'default',
    show: false,
    title: 'My MCP Manager'
  })

  // Add error handling for renderer loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[Main] Failed to load renderer:', errorCode, errorDescription, validatedURL)
  })

  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('[Main] Renderer crashed:', killed)
  })

  // Load the renderer
  if (isDev()) {
    // Try to use the VITE_PORT environment variable, or scan for running dev server
    const vitePort = process.env.VITE_PORT || '5175'
    const devUrl = `http://localhost:${vitePort}`
    console.log(`[Main] Loading development URL: ${devUrl}`)
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools()
  } else {
    // In production, files should be loaded from within the ASAR archive
    console.log('[Main] __dirname:', __dirname)
    console.log('[Main] process.resourcesPath:', process.resourcesPath)
    console.log('[Main] App path:', app.getAppPath())
    
    // Load the renderer HTML file
    // In production, __dirname is dist/main, so renderer is at ../renderer
    const indexPath = join(__dirname, '../renderer/index.html')
    mainWindow.loadFile(indexPath).catch(async error => {
      console.error('[Main] Primary path failed:', error)
      
      // Fallback paths if the primary doesn't work
      const fallbackPaths = [
        'dist/renderer/index.html', // For packaged app
        join(process.resourcesPath, 'app.asar/dist/renderer/index.html'), // Direct ASAR path
        join(__dirname, '../../dist/renderer/index.html'), // Alternative path
      ]
      
      let loaded = false
      for (const fallbackPath of fallbackPaths) {
        if (!loaded) {
          console.log('[Main] Trying fallback path:', fallbackPath)
          try {
            await mainWindow?.loadFile(fallbackPath)
            console.log('[Main] Successfully loaded from:', fallbackPath)
            loaded = true
            break
          } catch (fallbackError) {
            console.error('[Main] Fallback path failed:', fallbackPath, (fallbackError as Error).message)
          }
        }
      }
      
      if (!loaded) {
        console.error('[Main] All paths failed. App structure may be incorrect.')
        // As a last resort, try to load a simple HTML page to show we can load files
        const simpleHtml = `
          <html>
            <head><title>MCP Configuration Manager - Loading Error</title></head>
            <body>
              <h1>Loading Error</h1>
              <p>Could not load the application interface.</p>
              <p>App path: ${app.getAppPath()}</p>
              <p>Resource path: ${process.resourcesPath}</p>
              <p>__dirname: ${__dirname}</p>
            </body>
          </html>
        `
        mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(simpleHtml)}`)
      }
    })
  }

  mainWindow.once('ready-to-show', () => {
    console.log('[Main] Window ready to show')
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    console.log('[Main] Window closed')
    mainWindow = null
  })
}

// App event handlers
app.whenReady().then(() => {
  createWindow()
  
  // Setup IPC handlers
  setupIpcHandlers()
  
  // Register simplified handlers
  registerSimplifiedHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers are now handled in setupIpcHandlers()
