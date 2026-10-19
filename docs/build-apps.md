# Building the apps: Linux, Windows, macOS, Android and iOS

A step-by-step guide to building every SelfRun app on your own computer and testing each one.

- **Desktop apps** (Linux, Windows, macOS) are built with Electron, from the `desktop/` folder.
- **Mobile apps** (Android, iOS) are built with Capacitor, from the `mobile/` folder.
- One script, `scripts/build-apps.mjs`, runs them all and checks what each build needs first. You use it through `npm run …`
  commands in the project's root `package.json`.

> The website itself (`npm run build`) is a separate thing. It is what you deploy to Vercel (see `deploy-vercel.md`). This guide is
> only about the installable apps.

---

## Quick start: the commands, in order

Run these from the project folder. Each line says where it must run.

```bash
# 0. Once: Node 22+ and the project
node -v                      # must be v22 or higher
npm install

# 1. See what this computer can build
npm run apps:check

# 2. Build (pick the ones this computer can do)
npm run build:linux          # on Linux    -> desktop/dist/*.AppImage, *.deb
npm run build:windows        # on Windows  -> desktop\dist\*.exe
npm run build:macos          # on a Mac    -> desktop/dist/*.dmg, *.zip
npm run build:android        # JDK 21 + Android SDK -> mobile/dist-mobile/*.apk
npm run build:ios            # on a Mac    -> mobile/dist-mobile/*-ios-xcode-project.zip

# 3. Install and test what you built (section 12 has every platform)
sudo apt install ./desktop/dist/selfrun-desktop_1.0.0_amd64.deb     # Linux .deb
adb install -r mobile/dist-mobile/<Name>-<version>-android.apk      # Android
```

Every app opens straight on its workspace sign-in (default `https://app.selfrunbusiness.com`). For one company's own app add
`--origin <its app address>`, for example `--origin http://app.localhost:3000` while developing. Details are below.

---

## 1. What each platform needs

An app can only be built on the right kind of computer. This is a limit of the operating systems, not of this project.

| Platform | Build it on | Needs | You get |
| --- | --- | --- | --- |
| **Linux** | Linux | Node 22+ | `.AppImage` and `.deb` |
| **Windows** | Windows | Node 22+ | `.exe` installer (NSIS) |
| **macOS** | A Mac | Node 22+ | `.dmg` and `.zip` |
| **Android** | Linux, Windows or macOS | Node 22+, **JDK 21+**, Android SDK | `.apk` and an Android Studio project `.zip` |
| **iOS** | A Mac | Node 22+, Xcode, CocoaPods | An Xcode project `.zip` |

**Every build opens straight on its workspace.** There is no "Connect your workspace" screen. Each company has its own app address, and
the app is built for it:

| Where the app opens | How you build it |
| --- | --- |
| The platform's own app, `https://app.selfrunbusiness.com` | No option. This is the default. Change it with `SELFRUN_APP_ORIGIN` |
| A company's app, such as `https://acme-app.selfrunbusiness.com` or `https://app.acme.com` | Add `--origin <address>` (or `--address acme`). The app takes that company's name and icon |
| Your local dev app, `http://app.localhost:3000` | Add `--origin http://app.localhost:3000` (the dev server must be running) |

Add `--generic` (desktop only) for the one app that asks "Connect your workspace" on first start.

Android and iOS work the same way: with no `--origin` they use the platform's own app address.

---

## 2. One-time setup

### 2.1 Install Node 22 or newer

```bash
node -v        # must print v22 or higher
```

Install it from <https://nodejs.org> or with a version manager (`nvm install 22`).

### 2.2 Install the project

From the project folder (the one that holds the root `package.json`):

```bash
npm install
```

### 2.3 Check what this computer can build

```bash
npm run apps:check
```

It prints a line for each platform:

```
✓ Linux     ready
✗ Windows   build this on Windows (…)
✗ macOS     build this on a Mac (…)
✓ Android   ready
✗ iOS       needs a Mac with Xcode (…)
```

Fix anything marked ✗ that you want to build, using the sections below, then run the check again.

### 2.4 (Optional) Install the app dependencies in advance

```bash
npm run apps:install
```

This installs the packages in `desktop/` and `mobile/`. You can skip it: every build does it for you the first time.

---

## 3. Linux

**Build on a Linux computer.**

```bash
npm run build:linux
```

What happens: the script installs Electron and electron-builder (a large download the first time), then builds the app.

Result in `desktop/dist/`:

- `SelfRun Business-1.0.0.AppImage`
- `selfrun-desktop_1.0.0_amd64.deb`

**Test it**

```bash
chmod +x "desktop/dist/SelfRun Business-1.0.0.AppImage"
"desktop/dist/SelfRun Business-1.0.0.AppImage"          # runs without installing
# or install the .deb:
sudo apt install ./desktop/dist/selfrun-desktop_1.0.0_amd64.deb
```

The app opens straight on the workspace sign-in. (Built with `--generic`, it opens on "Connect your workspace" instead.)

If the AppImage does not start on a very new Ubuntu, run it with `--no-sandbox` or install FUSE (`sudo apt install libfuse2`).

---

## 4. Windows

**Build on a Windows computer.** (On Linux or macOS it needs Wine, so the script refuses and asks you to use Windows or the GitHub
workflow in section 9.)

In PowerShell, from the project folder:

```powershell
npm run build:windows
```

Result in `desktop\dist\`: `SelfRun Business Setup 1.0.0.exe`.

**Test it**

1. Double-click the installer and install.
2. Windows may show "Windows protected your PC", because the installer is not code-signed. Click **More info → Run anyway**.
3. Open **SelfRun Business** from the Start menu and sign in.

---

## 5. macOS

**Build on a Mac.** (macOS apps cannot be built anywhere else.)

```bash
npm run build:macos
```

Result in `desktop/dist/`: a `.dmg` and a `.zip`.

**Test it**

1. Open the `.dmg` and drag the app to Applications.
2. macOS may say the app "cannot be opened because the developer cannot be verified" (it is not signed or notarized). Right-click
   the app, choose **Open**, then **Open** again. Or run `xattr -cr "/Applications/SelfRun Business.app"`.
3. Sign in.

---

## 6. Android

Android is one app for one workspace. With no `--origin` it opens `https://app.selfrunbusiness.com`; add `--origin` for a company's app,
for example `https://acme-app.selfrunbusiness.com`. The workspace must be online: the script reads its name, icon and colours from it.

### 6.1 Install what Android needs (once)

1. **JDK 21 or newer** (the Android project is built with Java 21; JDK 17 fails with `invalid source release: 21`). Check with `java -version`.
   Ubuntu/Debian: `sudo apt install openjdk-21-jdk`. macOS: `brew install openjdk@21`. Windows: install Temurin 21 from <https://adoptium.net>.
   You do not have to switch your default Java: if a JDK 21 is installed next to it the build finds it and uses it by itself.
2. **Android Studio** (it installs the Android SDK): <https://developer.android.com/studio>. Open it once and accept the licences
   (SDK Manager → install the latest "Android SDK Platform" and "Build-Tools").
3. Tell the build where the SDK is. The script finds `~/Android/Sdk` by itself; otherwise set `ANDROID_HOME`:

   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk        # macOS / Linux
   setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"   # Windows (then open a new terminal)
   ```

4. Run `npm run apps:check` and confirm Android shows ✓.

### 6.2 Build

```bash
npm run build:android -- --origin https://acme-app.selfrunbusiness.com
npm run build:android -- --origin https://acme-app.selfrunbusiness.com --version 1.0.3
```

No Android SDK yet? Make only the project ZIP:

```bash
npm run build:android -- --origin https://acme-app.selfrunbusiness.com --no-build
```

Result in `mobile/dist-mobile/`:

- `<Name>-<version>-android.apk`: debug-signed. It installs on a phone that allows "unknown apps".
- `<Name>-<version>-android-studio-project.zip`: open in Android Studio, sign with your own key and publish to Google Play.

### 6.3 Test it

```bash
adb install -r mobile/dist-mobile/<Name>-<version>-android.apk
```

Or copy the `.apk` to the phone and open it (allow "Install unknown apps" for your file manager). The app opens the company's live
workspace.

---

## 7. iOS

**Build on a Mac with Xcode.** Like Android, it opens the platform's app by default; add `--origin` for a company's app.

```bash
npm run build:ios -- --origin https://acme-app.selfrunbusiness.com --version 1.0.3
```

Result in `mobile/dist-mobile/`: `<Name>-<version>-ios-xcode-project.zip`.

iPhone apps cannot be installed without Apple signing, so **the Xcode project is the deliverable**:

1. Unzip it and open the project in Xcode.
2. Select the app target → **Signing & Capabilities** → choose your Apple Developer **Team**.
3. Pick a simulator or a connected iPhone and press **Run** to test.
4. For the App Store: **Product → Archive → Distribute App**.

Apple may question apps that only wrap a website. Add some native value before submitting.

---

## 8. Build everything this computer can

```bash
npm run build:apps -- --origin https://acme-app.selfrunbusiness.com
```

It builds the desktop app for this computer's operating system, then Android (if the JDK and SDK are found) and iOS (on a Mac).
Anything it cannot build, it skips and tells you why. Without `--origin` all of them open on the platform's own app.

---

## 9. A company's own app, or all three desktop systems at once

**One company's desktop app** (its name, icon and address built in). Add `--address` or `--origin` to a desktop command:

```bash
npm run build:linux   -- --address acme              # a workspace on the platform domain
npm run build:windows -- --address acme.com          # a company's own domain (app.acme.com)
npm run build:macos   -- --origin https://acme-app.selfrunbusiness.com --version 1.0.3
```

Result in `desktop/dist-company/<name>/`.

**Windows, macOS and iOS without owning those computers: the GitHub workflow.** GitHub builds on its own Windows and Mac machines.
The workflow file is `.github/workflows/desktop.yml`. It builds the code that is on GitHub, so push your changes first.

1. Commit and push the project to GitHub (`git push`). The workflow always uses the pushed code, not what is only on your computer.
2. On GitHub open the repository → **Actions** → **Apps (desktop and mobile)** → **Run workflow**.
3. Fill the form:
   - **platforms**: `win,mac,ios` for exactly those three (the full list is `win,mac,linux,android,ios`; empty builds all five).
   - **origin**: leave empty for the platform's own app (`https://app.selfrunbusiness.com`), or type a company's app address.
   - **version**: optional, such as `1.0.1`.
   - **generic**: leave unticked. Tick it only for the desktop app that asks "Connect your workspace".
4. Press **Run workflow** and wait (Windows and macOS take roughly 5 to 15 minutes, iOS a few minutes).
5. Open the finished run. At the bottom, under **Artifacts**, download `app-win`, `app-mac` and `app-ios` (each is a ZIP with the files).

| Artifact | Inside | How to test it |
| --- | --- | --- |
| `app-win` | `…Setup….exe` | Windows: section 12, Windows |
| `app-mac` | `.dmg`, `.zip` | macOS: section 12, macOS |
| `app-ios` | `…-ios-xcode-project.zip` | Open it in Xcode on a Mac: section 12, iOS |

The platform's builds for companies (started by the **Generate … App** buttons, step 15 of `deploy-vercel.md`) use this same workflow with the secrets and the releases
repository set; a manual run needs neither. To open the apps on a different default address, set the repository variable
`SELFRUN_APP_ORIGIN` (Settings → Secrets and variables → Actions → Variables).

---

## 10. Quick reference

| I want to… | Command |
| --- | --- |
| See what this computer can build | `npm run apps:check` |
| Install the apps' dependencies | `npm run apps:install` |
| Linux app | `npm run build:linux` |
| Windows app | `npm run build:windows` |
| macOS app | `npm run build:macos` |
| Android app | `npm run build:android` (add `--origin <app address>` for a company) |
| iOS project | `npm run build:ios` (add `--origin <app address>` for a company) |
| Everything possible here | `npm run build:apps` |
| An app that asks "Connect your workspace" | add `--generic` to a desktop command |
| A company's desktop app | add `--address <name or domain>` to a desktop command |
| Set the version | add `--version 1.2.0` |
| Only the unpacked desktop app (a quick check) | add `--dir` |
| Android project ZIP only (no SDK needed) | add `--no-build` |

You can also set `SELFRUN_ORIGIN` (a company) or `SELFRUN_APP_ORIGIN` (the platform's own app) once instead of typing `--origin`.

Where the files go:

| Build | Folder |
| --- | --- |
| Generic desktop app | `desktop/dist/` |
| A company's desktop app | `desktop/dist-company/<name>/` |
| Android, iOS | `mobile/dist-mobile/` |

These folders are ignored by git, so built files are never committed.

---

## 11. Troubleshooting

| You see | Cause and fix |
| --- | --- |
| `Node … is too old` | Install Node 22 or newer (`nvm install 22 && nvm use 22`). |
| `Windows installers are built on Windows` / `macOS apps can only be built on a Mac` | Run the command on that operating system, or use the GitHub workflow (section 9). |
| `Couldn't read the workspace` | The address is wrong or the workspace is offline. Open `<address>/api/desktop/branding` in a browser: it must return JSON. |
| `The workspace has no icon yet` | In that workspace set an icon: **Workspace → Settings → Mobile app** (or Branding), then build again. |
| The workflow run does not show up, or builds old code | Push first (`git push`); the workflow runs on the branch you pick in **Run workflow**, using what is on GitHub. |
| `Android builds need JDK 21 or newer` | Install JDK 21+ (`sudo apt install openjdk-21-jdk`), or add `--no-build`. |
| Gradle: `error: invalid source release: 21` | The JDK used is older than 21. Install JDK 21 and run the build again (the build picks it up by itself). |
| `The Android SDK was not found` | Install Android Studio and set `ANDROID_HOME`, or add `--no-build`. |
| Gradle: `SDK location not found` or licence errors | Open Android Studio → SDK Manager and accept the licences, or run `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses`. |
| The first build is slow | Electron, electron-builder and Gradle download a lot the first time. Later builds are fast. |
| macOS or Windows warns the app is from an unknown developer | The installers are not code-signed. Add an Apple Developer ID and notarization (macOS) and a code-signing certificate (Windows) to remove the warning. |
| Android or iOS app: the header or top buttons are hidden under the status bar and cannot be tapped | Two things must both be current: (1) deploy the website, because it stops drawing pages under the system bars when the app's user agent says `WorkspaceNative`; (2) rebuild and reinstall the app (`npm run build:android`), because the user agent and the system-bar setting are written into the app when it is built. An app built before this change keeps the old behaviour. |
| `Couldn't read the workspace` on a default build | The default build only writes the address into the app and does not contact it, so this only happens with `--origin` or `--address`. |

More about each app: `desktop/README.md` and `mobile/README.md`.

---

## 12. Installing the built apps

Where each file is, how to install it, and how to remove it.

### Linux

| File | Install | Run | Remove |
| --- | --- | --- | --- |
| `desktop/dist/selfrun-desktop_1.0.0_amd64.deb` | `sudo apt install ./desktop/dist/selfrun-desktop_1.0.0_amd64.deb` | Menu: **SelfRun Business**, or `selfrun-desktop` | `sudo apt remove selfrun-desktop` |
| `desktop/dist/SelfRun Business-1.0.0.AppImage` | `chmod +x "desktop/dist/SelfRun Business-1.0.0.AppImage"` (no install needed) | `"desktop/dist/SelfRun Business-1.0.0.AppImage"` | Delete the file |

Upgrading to a new build: run the same `apt install` again over the old one, then close and reopen the app. If the menu icon looks old,
log out and in, or run `sudo gtk-update-icon-cache /usr/share/icons/hicolor`. If the window does not open, start it with `--no-sandbox`
(and for the AppImage on a new Ubuntu: `sudo apt install libfuse2`).

The app is installed in `/opt/SelfRun Business/` (about 300 MB).

### Windows

1. Copy `desktop\dist\SelfRun Business Setup <version>.exe` to the computer.
2. Double-click it. If Windows says "Windows protected your PC", click **More info → Run anyway** (the installer is not code-signed).
3. Choose the install folder and finish. Open **SelfRun Business** from the Start menu.
4. Remove it in **Settings → Apps → Installed apps → SelfRun Business → Uninstall**.

### macOS

1. Open `desktop/dist/<name>-<version>.dmg` and drag the app to **Applications**.
2. First start: right-click the app → **Open** → **Open** (it is not signed or notarized), or run
   `xattr -cr "/Applications/SelfRun Business.app"`.
3. Remove it by dragging it from Applications to the Bin.

### Android

1. Make the file reach the phone, or install over USB: `adb install -r mobile/dist-mobile/<Name>-<version>-android.apk`.
2. On the phone allow **Install unknown apps** for the app you opened the file with (Files, Chrome, WhatsApp …).
3. Open the `.apk` and tap **Install**.
4. Remove it like any app: long-press the icon → **Uninstall**.

For Google Play, do not use this `.apk`: open `…-android-studio-project.zip` in Android Studio, sign it with your own key and upload it.

### iOS

iPhone apps cannot be installed from a file. Unzip `…-ios-xcode-project.zip`, open it in Xcode on a Mac, choose your Apple team under
**Signing & Capabilities**, connect an iPhone (or pick a simulator) and press **Run**. For the App Store use **Product → Archive**.

### What happens after you install

Each app opens on its workspace sign-in. Colours, name and shortcuts come from the workspace and update by themselves, so you do not
rebuild an app when a company changes its branding. You only rebuild to change the installer's own file name or icon, to move the app to a
different address, or to release a new version of the app itself.

---

## 13. How a company gets its own apps (the Generate buttons)

Everything above builds apps on your own computer. A company on the platform gets its apps from **Workspace → Settings → Apps**, with no one running commands:

- The **PWA** needs no build. It installs from the browser, and its name, icon and colours are the company's own.
- **Mobile** and **Desktop** tabs have one button per app: **Generate Android App**, **Generate iOS App**, **Generate Windows App**,
  **Generate macOS App**, **Generate Linux App**. A Super Admin presses the ones needed; once an app exists the button reads **Regenerate …**.
- **Nothing is built automatically.** Not when onboarding finishes, not after the company renames itself or changes its icon (the page then
  suggests **Regenerate**), not by a daily job. Only a button press starts a build, and only for that one app.
- A press starts the GitHub workflow in `.github/workflows/desktop.yml` for that platform with the company's address. It builds, publishes the
  file to the releases repository and the download link appears on the same page, which updates itself while it waits (about 10 to 20 minutes).
- Different apps can build at the same time; the same app cannot be started twice.
- If the platform's build service is not connected (`GITHUB_REPOSITORY`, `GITHUB_DISPATCH_TOKEN`, `DESKTOP_BUILD_SECRET`; see `deploy-vercel.md`
  step 15), the buttons say so and the asset packs can still be downloaded.

**Nothing of the platform's brand is in a company's app.** The name, short name, icon, splash, colours, start page and shortcuts come from
the company. The installer file names, the app id (`app.<company>.desktop`, `app.<company>.mobile`), the Windows publisher, the Linux maintainer
and vendor, the copyright line, the window titles, notifications and the tray all use the company's own name. The only places the platform's
name appears are the platform's own app (`https://app.selfrunbusiness.com`) and the installers you build with no `--origin` for the platform itself.

### Settings the Generate buttons need (Vercel and GitHub)

Where each value comes from, in order. You make three secrets once and put them in two places.

**A. Make the values**

| Name | Where the value comes from |
| --- | --- |
| `DESKTOP_BUILD_SECRET` | Make it yourself: run `openssl rand -base64 32` (or any 32+ character random text). Use the **same** value in Vercel and in GitHub |
| `GITHUB_REPOSITORY` | Your code repository as `owner/name`, for example `yashorbittech/selfrun` (the part of the GitHub address after `github.com/`) |
| `DESKTOP_RELEASES_REPO` | A second, **public** repository for the finished installers, for example `yashorbittech/selfrun-app-releases` (GitHub → New repository → Public → tick "Add a README") |
| `RELEASES_TOKEN` | GitHub → your avatar → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Repository access: only the releases repository. Permission: **Contents: Read and write**. Copy the token once, it is shown only once |
| `GITHUB_DISPATCH_TOKEN` | Same page, a second token. Repository access: only the code repository. Permission: **Actions: Read and write** |

**B. Put them in Vercel** (Project → **Settings → Environment Variables**, environment **Production**, then **Redeploy**)

| Key | Value |
| --- | --- |
| `GITHUB_REPOSITORY` | `owner/code-repo` |
| `GITHUB_DISPATCH_TOKEN` | the Actions token |
| `DESKTOP_BUILD_SECRET` | the random secret |
| `DESKTOP_RELEASES_REPO` | `owner/releases-repo` (optional, but then only downloads from that repository are accepted) |
| `GITHUB_WORKFLOW_FILE` | optional, default `desktop.yml` |
| `GITHUB_WORKFLOW_REF` | optional, default `main` (the branch the workflow runs from) |

**C. Put them in GitHub** (code repository → **Settings → Secrets and variables → Actions**)

| Tab | Name | Value |
| --- | --- | --- |
| Secrets | `DESKTOP_BUILD_SECRET` | the same random secret |
| Secrets | `RELEASES_TOKEN` | the Contents token |
| Variables | `DESKTOP_RELEASES_REPO` | `owner/releases-repo` |
| Variables | `SELFRUN_APP_ORIGIN` | optional: only if the platform's own app is not `https://app.selfrunbusiness.com` |

Then press a Generate button on a test company's Settings → Apps page. If it says the build service is not connected, one of the three Vercel keys
`GITHUB_REPOSITORY`, `GITHUB_DISPATCH_TOKEN` or `DESKTOP_BUILD_SECRET` is missing or the site was not redeployed after adding them.

---

## 14. Keeping this guide current

When the build scripts, commands, options, output folders or install steps change, this file changes in the same commit. If you add a
new `npm run build:…` command, add it to the Quick start, the quick reference (section 10) and the install section (section 12).
