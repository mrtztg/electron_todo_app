const electron = require('electron');
const path = require("path");

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let addWindow; // We're initiating window here to be able to use if out of create function as well.

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Make sure this is enabled for security
            nodeIntegration: false,  // Ensure node integration is disabled in the renderer process
            sandbox: true
        }
    });
    mainWindow.loadFile("main.html");
    // If we don't do this, additional windows (like addTODO won't be closed)
    //     when we close main window.
    mainWindow.on('closed', app.quit)

    // buildFromTemplate() and setApplicationMenu() are in different lines.
    // This is helpful when we want to change menu list based on pages or
    //    scenarios. We can create menus in advance, and just use
    //    setApplicationMenu() whenever want to switch.
    const mainManu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(mainManu);

    // When we set our own created menu, the default menus will
    //      disappear and their shortcut keys won't work anymore.
    //      E.g Ctrl+Q won't work anymore
}

app.on("ready", createWindow);

let createAddWindow = () => {
    addWindow = new BrowserWindow({
        title: 'Add todo',
        width: 600,
        height: 300,
        webPreferences: {
            preload : path.join(__dirname, 'preload.js')
        }
    })
    addWindow.loadFile('add_todo.html');
    addWindow.on('closed', () => {
        addWindow = null;
    });
}

const isDarwin = () => {
    return process.platform === 'darwin'
}

let menuTemplate = [
    { // Each one of these objects represents one main menu (like File, Edit). Each object should have 'label' property
        label: 'File',
        submenu: [
            {
                label: 'New Todo',
                accelerator: isDarwin() ? 'Command+N' : 'Ctrl+N' , // This is one way of setting binding key
                click() {
                    createAddWindow();
                }
            },
            {
                label: 'Clear TODOs',
                accelerator: isDarwin() ? 'Command+K' : 'Ctrl+K',
                click() {
                    // It's okay to not define 2nd parameter here in send(). Then it'll just
                    //     call the front-end side, without passing data
                    mainWindow.webContents.send('todo:clear')
                }
            },
            {
                label: 'Quit',
                accelerator: (() => { // This is another one way
                    return isDarwin() ? 'Command+Q' : 'Ctrl+Q'
                })(), // This is instant function in JS (like anonymous in Golang)
                click() {
                    app.quit();
                }
            }
        ]
    }
];

// It adds an item to the first position. Because in MacOS, if we don't this, mac will put our first menu inside app name menu.
if (isDarwin()) {
    menuTemplate.unshift({
        label: 'electron'
    });
}

// NODE_ENV is strictly hard coded inside electron app and we can use it so differentiate environments
if (process.env.NODE_ENV !== 'production') {
    menuTemplate.push({
        label : "View",
        submenu: [
            {
                label: 'Toggle Developer Tools',
                accelerator: isDarwin() ? 'Command+Option+I' : 'Ctrl+Alt+I',
                // if we define params of click(), we'll have access to the following ones.
                //    focusedWindows is very useful when we want to behave based on focused window
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                // This is Electron built-in helper. Electron will know we
                //    want to add a page reload option. Find others here:
                //    https://www.electronjs.org/docs/latest/api/menu-item#roles
                role: 'reload'
            }
        ]
    })
}

ipcMain.on('todo:add', (event, todo) => {
    console.log('inElectron->', todo)
    mainWindow.webContents.send('todo:add', todo);
    addWindow.close();
    addWindow = null;
})