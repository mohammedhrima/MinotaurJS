const fs = require("fs");
const path = require("path");
const swc = require("@swc/core");
const http = require("http");
const WebSocket = require("ws");

// Webserving
const PORT = process.env.PORT || 5000;
const serveStaticFile = (filePath, contentType, res) => {
  console.log("serve", filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("file not found", filePath);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
};

const server = http.createServer((req, res) => {
  console.log("send ", req.url);
  if (req.method === "GET" && req.url === "/") {
    const indexPath = path.resolve(__dirname, "./dist/pages/index.html");
    serveStaticFile(indexPath, "text/html", res);
  } else if (req.method === "GET") {
    let filePath;
    if (req.url == "Mini")
      filePath = path.resolve(__dirname, "./Mini/lib.js");
    else filePath = path.resolve(__dirname, "." + "/dist/" + req.url);
    const ext = path.extname(filePath);
    let contentType = "text/plain";
    switch (ext) {
      case ".js":
        contentType = "application/javascript";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".html":
        contentType = "text/html";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
    }
    serveStaticFile(filePath, contentType, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

const wss = new WebSocket.Server({ server });

function refresh() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("refresh");
    }
  });
}
// Transpilation
function removeComments(code) {
  return code.replace(/\/\*\*?[\s\S]*?\*\/|\/\/.*/g, "");
}

function transpileFile(filePath) {
  console.log("transpile: ", filePath);
  const content = fs.readFileSync(filePath, "utf8");
  swc
    .transform(content, {
      filename: path.basename(filePath),
      jsc: {
        parser: {
          syntax: "ecmascript",
          jsx: true,
          dynamicImport: true,
        },
        transform: {
          react: {
            pragma: "Mini.createElement",
            pragmaFrag: "Mini.Fragment",
          },
        },
        target: "es2015",
      },
    })
    .then((result) => {
      let transpiledCode = result.code;
      transpiledCode = removeComments(transpiledCode);
      const distPath = filePath.replace(/src/, "dist");
      const distDir = path.dirname(distPath);
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
      fs.writeFileSync(distPath, transpiledCode);
      console.log(`Transpiled ${filePath} to ${distPath}`);
      refresh();
    })
    .catch((err) => {
      console.error(`Error transpiling ${filePath}:`, err);
    });
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
  refresh();
}

function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted ${filePath}`);
    refresh();
  }
}

function deleteDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.rmdirSync(directoryPath, { recursive: true });
    console.log(`Deleted directory ${directoryPath}`);
    refresh();
  }
}

function watchFile(filePath) {
  console.log("watch file", filePath);
  let timeout;
  fs.watch(filePath, (eventType, filename) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log(filePath, "has been modified.");
      if (!fs.existsSync(filePath)) {
        deleteFile(filePath.replace(/src/, "dist"));
      } else {
        const ext = path.extname(filePath);
        switch (ext) {
          case ".js":
            transpileFile(filePath);
            break;
          default:
            copyFile(filePath, filePath.replace(/src/, "dist"));
            break;
        }
      }
    }, process.env.TIMING || 10);
  });
}

function watchDirectory(directoryPath) {
  console.log("watch directory", directoryPath);
  let timeout;
  fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log(directoryPath, "directory modified");
      if (filename) {
        const fullPath = path.join(directoryPath, filename);
        if (!fs.existsSync(fullPath)) {
          if (fs.lstatSync(fullPath).isDirectory()) {
            deleteDirectory(fullPath.replace(/src/, "dist"));
          } else {
            deleteFile(fullPath.replace(/src/, "dist"));
          }
        } else {
          if (fs.lstatSync(fullPath).isDirectory()) {
            watchDirectory(fullPath);
          } else {
            watchFile(fullPath);
            const ext = path.extname(fullPath);
            switch (ext) {
              case ".js":
                transpileFile(fullPath);
                break;
              default:
                copyFile(fullPath, fullPath.replace(/src/, "dist"));
                break;
            }
          }
        }
      }
    }, process.env.TIMING || 10);
  });
}

function syncDirectories(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.readdir(srcDir, { withFileTypes: true }, (err, items) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    items.forEach((item) => {
      const srcPath = path.join(srcDir, item.name);
      const destPath = path.join(destDir, item.name);

      if (item.isDirectory()) {
        syncDirectories(srcPath, destPath);
      } else {
        if (!fs.existsSync(destPath)) {
          const ext = path.extname(srcPath);
          switch (ext) {
            case ".js":
              transpileFile(srcPath);
              break;
            default:
              copyFile(srcPath, destPath);
              break;
          }
        } else {
          const srcStats = fs.statSync(srcPath);
          const destStats = fs.statSync(destPath);
          if (srcStats.mtime > destStats.mtime) {
            const ext = path.extname(srcPath);
            switch (ext) {
              case ".js":
                transpileFile(srcPath);
                break;
              default:
                copyFile(srcPath, destPath);
                break;
            }
          }
        }
      }
    });
  });
}
const srcDirectory = path.resolve(__dirname, "./src");
const destDirectory = path.resolve(__dirname, "./dist");
syncDirectories(srcDirectory, destDirectory);
watchDirectory(srcDirectory);

wss.on("connection", (ws) => {
  console.log("Client connected");
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
