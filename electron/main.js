const {
  app,
  BrowserWindow,
  protocol,
  net,
} = require("electron");

const path = require("path");
const { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("app://zootomia/");
}

app.whenReady().then(() => {
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    const routes = {
      "/": "/index.html",
      "/about": "/about.html",
      "/annotate": "/annotate.html",
      "/gallery": "/gallery.html",
      "/game": "/game.html",
    };

    if (routes[pathname]) {
      pathname = routes[pathname];
    }

const basePath = app.isPackaged
  ? path.join(app.getAppPath(), "out")
  : path.join(app.getAppPath(), "..", "out");

const filePath = path.join(basePath, pathname);

    console.log("Electron tentando carregar:", filePath);

    return net.fetch(pathToFileURL(filePath).toString());
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});