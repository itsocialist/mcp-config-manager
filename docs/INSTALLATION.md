# Installation Guide

## System Requirements

- **macOS**: 10.12 (Sierra) or later
- **Processor**: Intel or Apple Silicon (M1/M2/M3)
- **Memory**: 4GB RAM minimum
- **Storage**: 200MB available space

## Download

Download the latest release from the [GitHub Releases](https://github.com/itsocialist/mcp-config-manager/releases) page.

Choose the appropriate version for your Mac:
- **Apple Silicon (M1/M2/M3)**: Download the `-arm64.dmg` file
- **Intel Macs**: Download the standard `.dmg` file (without `-arm64`)

## Installation Steps

### 1. Download the DMG File
Download the appropriate DMG file for your system from the releases page.

### 2. Install the Application

1. Double-click the downloaded DMG file to mount it
2. Drag the "MCP Configuration Manager" app to your Applications folder
3. Eject the DMG by clicking the eject button in Finder

### 3. First Launch - macOS Gatekeeper

Since the app is not yet notarized with Apple, you'll need to bypass Gatekeeper on first launch:

#### Method 1: Right-Click to Open (Recommended)
1. Open your Applications folder
2. Find "MCP Configuration Manager"
3. **Right-click** (or Control-click) on the app
4. Select **"Open"** from the context menu
5. In the dialog that appears, click **"Open"** again
6. The app will now launch and be remembered as safe

#### Method 2: System Settings
1. Try to open the app normally (double-click)
2. When blocked, go to **System Settings > Privacy & Security**
3. Look for the message about "MCP Configuration Manager" being blocked
4. Click **"Open Anyway"**
5. Confirm by clicking **"Open"** in the dialog

#### Method 3: Terminal Command (Advanced)
If the above methods don't work, you can remove the quarantine attribute:
```bash
xattr -cr "/Applications/MCP Configuration Manager.app"
```

### 4. Grant Permissions

On first launch, the app may request:
- **File Access**: To read and write MCP configuration files
- **Folder Access**: To access configuration directories

Grant these permissions when prompted for the app to function properly.

## Troubleshooting

### "App is damaged and can't be opened"
This usually means the quarantine attribute needs to be removed:
```bash
xattr -cr "/Applications/MCP Configuration Manager.app"
```

### "Developer cannot be verified"
This is expected for apps not distributed through the App Store. Use the Right-Click to Open method described above.

### App Won't Start
1. Ensure you downloaded the correct version (ARM64 for Apple Silicon, standard for Intel)
2. Check that you have macOS 10.12 or later
3. Try removing and re-installing the app
4. Check Console.app for any error messages

### Permission Issues
If the app can't read or write configuration files:
1. Go to **System Settings > Privacy & Security > Files and Folders**
2. Ensure "MCP Configuration Manager" has access to necessary folders
3. You may need to grant Full Disk Access for some operations

## Updating

To update to a new version:
1. Quit the MCP Configuration Manager if it's running
2. Download the new version from GitHub Releases
3. Follow the installation steps above
4. Your settings and configurations will be preserved

## Uninstalling

To remove MCP Configuration Manager:
1. Quit the app if it's running
2. Drag the app from Applications to the Trash
3. Empty the Trash
4. Optionally, remove settings:
   ```bash
   rm -rf ~/Library/Application\ Support/MCP\ Configuration\ Manager
   rm -rf ~/Library/Preferences/com.mcp-config-manager.plist
   ```

## Support

If you encounter issues:
1. Check the [GitHub Issues](https://github.com/itsocialist/mcp-config-manager/issues) page
2. Create a new issue with:
   - Your macOS version
   - Processor type (Intel or Apple Silicon)
   - Steps to reproduce the problem
   - Any error messages from Console.app