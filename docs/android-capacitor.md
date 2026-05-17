# Android 打包说明

本项目使用 Capacitor 将现有 Vite + React 应用打包为 Android App。

## 工程信息

- App 名称：摄影助手
- Android 包名：`com.cameraman.swissknife`
- Web 构建目录：`dist`
- Android 工程目录：`android/`
- Capacitor 配置：`capacitor.config.ts`

## 常用命令

```bash
npm run build
npm run android:sync
npm run android:open
```

也可以直接运行到已连接的 Android 设备或模拟器：

```bash
npm run android:run
```

`android:sync` 会先执行 Web 生产构建，再把 `dist/` 同步到 Android 工程。

## 当前原生能力

- Android 返回键：
  - 色温全屏预览打开时，返回键先关闭全屏预览。
  - 在曝光、景深、色温页面时，返回键回到主页。
  - 在主页时，返回键退出应用。

## 本地构建 APK

本机建议使用 Android Studio 自带 JDK，并指向已安装的 Android SDK：

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME="C:\DevelopEnv\Android\Sdk"
$env:ANDROID_SDK_ROOT="C:\DevelopEnv\Android\Sdk"
$env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"
```

首次构建需要 Android Studio 或本机 Gradle 能访问网络下载依赖：

```bash
cd android
./gradlew assembleDebug
```

Windows PowerShell 可使用：

```powershell
cd android
.\gradlew.bat assembleDebug
```

构建成功后，Debug APK 通常位于：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

当前工程的 Gradle Wrapper 使用腾讯云 Gradle 镜像，Android/Maven 依赖优先使用阿里云 Maven 镜像，以减少国内网络环境下访问 GitHub 或 Google Maven 失败的问题。

## USB 调试

连接 Android 手机后执行：

```powershell
adb devices -l
```

如果设备状态是 `unauthorized`，需要在手机屏幕上确认“允许 USB 调试”。授权后可以安装 Debug APK：

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## 发布前清单

- 替换默认 App 图标和启动图。
- 配置 release keystore，不要提交 keystore 文件。
- 生成 Release AAB：

```powershell
cd android
.\gradlew.bat bundleRelease
```

- 在真机上验证曝光计算、景深计算、色温预览和 Android 返回键。
- 准备隐私政策、商店截图、应用简介和版本说明。
