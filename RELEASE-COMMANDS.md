# VS Code PowerShell release commands

Run these from the updated source folder. The repository currently uses branch
`main` and remote `origin` at `https://github.com/coopik/MDC-Client-GTA-W.git`.
The app does not push or publish anything automatically.

Push the source:

```powershell
Set-Location 'C:\Users\demev\Downloads\mdc-client'
npm run smoke
git status --short
git add -- .gitignore package.json package-lock.json main.js preload.js webview-preload.js forum-preload.js renderer tools build installer/mdc-client.iss README.md CHANGELOG.md RELEASE-COMMANDS.md
git diff --cached --stat
git commit -m 'Release PatrolOne Mobile Client v1.0.26'
git push origin main
```

Rebuild the application and compile the Inno Setup installer:

```powershell
Set-Location 'C:\Users\demev\Downloads\mdc-client'
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Build-Inno.ps1
```

The helper locates Inno Setup 6 or 7, runs `npm ci`, the smoke and Electron UI
checks, builds the Windows x64 application into `dist\win-unpacked`, then compiles
`installer\mdc-client.iss`. It stops on a failure. The installer is written to
`installer\Output\PatrolOne-Mobile-Client-Setup-1.0.26.exe`.

If Inno Setup is installed elsewhere, supply its compiler path:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Build-Inno.ps1 -Compiler 'D:\Applications\Inno Setup 6\ISCC.exe'
```

To build only the application folder, then open the existing installer script
in the Inno Setup IDE:

```powershell
npm ci
npm run smoke
npm run pack -- --win --x64
Invoke-Item .\installer\mdc-client.iss
```

In the IDE, choose Build > Compile. The installer script reads the rebuilt
`dist\win-unpacked` folder. The source ZIP, `node_modules`, `dist` and installer
outputs are not included in the explicit Git staging command above.
