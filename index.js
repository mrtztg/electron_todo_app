const electron = require('electron');
const path = require("path");

const {app, BrowserWindow, ipcMain} = electron;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Make sure this is enabled for security
            nodeIntegration: false,  // Ensure node integration is disabled in the renderer process
            sandbox: true
        }
    });
    mainWindow.loadFile("main.html")
}

app.on("ready", createWindow);


// ipcMain.on('videoLength', (event, path) => {
// })