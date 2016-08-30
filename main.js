const {app, BrowserWindow} = require('electron')
const {Menu} = require('electron')
const {ipcMain} = require('electron')

let win
let frameless = false;
let elements;

function createWindow() {
    Menu.setApplicationMenu(null);
    win = new BrowserWindow({ width:216, height:299, resizable: false });
    win.loadURL(`file://${__dirname}/index.html`);
    win.menu = null;
    win.toggleDevTools();
    win.on('closed', () => { 
        win = null;
    });
}

ipcMain.on('toggle-frame', (e,d) => {
    elements = d;
    let newWin;
    let x = win.getPosition()[0];
    let y = win.getPosition()[1];
    if(!frameless){
        newWin = new BrowserWindow({ width:216, height:120, x: x, y: y, transparent: true, resizable: false, alwaysOnTop: true, frame: false });
        newWin.loadURL(`file://${__dirname}/index.html`);
        newWin.menu = null;
        frameless = true;
    }
    else{
        newWin = new BrowserWindow({ width:216, height:299, x: x, y: y, resizable: false });
        newWin.loadURL(`file://${__dirname}/index.html`);
        newWin.menu = null;
        frameless = false;
    }
    newWin.show();
    win.close();
    win = newWin;
    win.toggleDevTools();
    newWin.on('closed', () => {
        win = null;
    });
    win.webContents.once('dom-ready', () => { win.webContents.send('elements', elements) });
});

app.on('ready', createWindow)
app.on('window-all-closed', () => { if(process.platform !== 'darwin') app.quit() })