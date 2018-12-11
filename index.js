const {app, BrowserWindow, session, ipcMain, Menu} = require('electron')
const path = require('path')
const url = require('url')
const os = require('os')
const childProcess = require('child_process')
const package = require('./package.json')
const swca = require('windows-swca')

let mainWindow

const createWindow = () => {

	mainWindow = new BrowserWindow({
		width: 294,
		height: 436,
		resizable: false,

		frame: false,
		thickFrame: true,
		transparent: false,
		backgroundColor: '#00000000',

		title: package.name
	})

	if(process.platform === 'win32') swca.SetWindowCompositionAttribute(mainWindow, swca.AccentState.ACCENT_ENABLE_FLUENT, 0x01000000)

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}))

	mainWindow.webContents.setUserAgent(
		mainWindow.webContents.getUserAgent().split(' ').filter(
			fragment => [package.name, 'Electron'].every(sensitive => !fragment.startsWith(sensitive))
		).join(' ')
	)

	session.defaultSession.webRequest.onBeforeSendHeaders(
		{urls: ['*://music.163.com/*']}, 
		(details, callback) => {
			details.requestHeaders['Referer'] = 'http://music.163.com/'
			details.requestHeaders['Origin'] = 'http://music.163.com/'
			callback({cancel: false, requestHeaders: details.requestHeaders})
		}
	)

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	})


	mainWindow.on('closed', () => {
		mainWindow = null
	})
	
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})