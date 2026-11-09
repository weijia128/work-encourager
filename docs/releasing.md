# 发布 macOS 版本

目前发布脚本只支持 **Apple 芯片 Mac**，产物为 aarch64 DMG。Windows 构建仍使用 `.github/workflows/build.yml`。

## 准备

- 安装 Node、pnpm 10、Rust stable 和 [GitHub CLI](https://cli.github.com/)
- 执行 `gh auth login`，账号需要仓库写权限
- 当前位于 `main` 分支，工作区干净，并与 `origin/main` 同步

## 发布

把 `0.2.0` 换成要发布的新版本号：

```bash
pnpm release -- --dry-run 0.2.0
pnpm release 0.2.0
```

第一条命令只检查环境、版本和远程状态，不修改文件。第二条命令会自动：

1. 更新 `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 的版本号
2. 安装依赖、运行测试并构建 DMG
3. 挂载 DMG，检查 App、“应用程序”快捷方式和 App 版本
4. 生成并上传 `SHA256SUMS`
5. 创建 `chore: release v…` 提交和标签，推送到 GitHub
6. 创建包含首次打开教程、更新内容和校验值的 Release
7. 输出 Release 地址、固定最新版下载页和当前 DMG 直链

版本号必须高于 `package.json` 中的当前版本，且标签和 Release 不能已经存在。

## 宣传链接

固定链接，始终指向最新正式版：

```text
https://github.com/weijia128/work-encourager/releases/latest
```

DMG 直链包含版本号，每次发版都会变化：

```text
https://github.com/weijia128/work-encourager/releases/download/v0.2.0/work-encourager_0.2.0_aarch64.dmg
```

宣传时优先使用固定链接，并注明“支持 Apple 芯片（M1 及以后）”。

## 失败处理

- 构建或测试失败：脚本会还原尚未提交的版本文件，修复后重新运行即可。
- 推送成功后创建 Release 失败：提交和标签可能已存在，不要直接修改或重用标签。先确认 DMG 和校验值，再用 `gh release create v… <DMG路径> <SHA256SUMS路径> --verify-tag` 补建 Release。
