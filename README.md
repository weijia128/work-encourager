# 上班鼓励器

一个挂在 macOS 菜单栏的小窗口：按秒算你今天已经赚了多少钱，顺便看看行情、敲敲木鱼。

> 成都牛马，上班中 · 距离下班 27 分钟
> 今日已赚 ¥356.0544

## 功能

- **按秒到账**：根据月薪、上下班和午休时间，实时显示今日已赚、时薪、每秒速度
- **工作进度**：今日进度和本月进度，按当月实际工作日计算（含法定节假日和调休，支持双休 / 单休 / 大小周）
- **恒纪元**：距离下一个假期还有几天
- **鼓励语**：盼头、烟火、清静（《道德经》）三类文案轮换
- **反者道之动 · 贪嗔**：关注的指数、ETF、股票的本日 / 本月 / 今年涨跌幅
- **功德木鱼**：敲一下，功德 +1，班味 -1
- **悬浮小窗**：232 × 96 小窗保留今日已赚和木鱼敲击，可拖动、置顶并随时展开
- **菜单栏**：显示今日已赚，可开机自启、窗口置顶；隐藏收入后，面板、迷你窗、菜单栏和悬浮提示会同步隐藏金额

## 安装

**[下载最新版](https://github.com/weijia128/work-encourager/releases/latest)** · [查看所有版本](https://github.com/weijia128/work-encourager/releases)

### macOS

目前仅支持 **Apple 芯片（M1 及以后）**，Intel Mac 暂不可用。

1. 打开[最新版下载页](https://github.com/weijia128/work-encourager/releases/latest)，下载 `.dmg`
2. 打开后把「上班鼓励器」拖进「应用程序」
3. **第一次打开**：应用没有 Apple 签名，系统会提示"无法验证开发者"
   - 在「应用程序」里**右键** App → 选「打开」→ 再点一次「打开」
   - 还是打不开：「系统设置 → 隐私与安全性」，在下方点「仍要打开」
   - 提示"已损坏"：在终端执行
     ```bash
     xattr -cr /Applications/上班鼓励器.app
     ```

之后就和普通 App 一样，双击就能打开。

### Windows

到 [Actions](https://github.com/weijia128/work-encourager/actions/workflows/build.yml) 下载构建产物中的 `.exe` / `.msi`。第一次运行如果弹出 SmartScreen，点「更多信息 → 仍要运行」。

## 隐私

- 月薪、作息、关注列表都只保存在本机，不上传任何地方
- 只会联网做三件事：从东方财富获取行情、从 jsDelivr 获取节假日数据、（可选）拉取远程文案库

## 开发

需要 Node 22、pnpm 10、Rust stable。

```bash
pnpm install
pnpm tauri dev     # 开发模式
pnpm test          # 单元测试
pnpm tauri build   # 打包
```

远程文案库的配置见 [docs/remote-copy-library.md](docs/remote-copy-library.md)。

## 发布

在 Apple 芯片 Mac 上，一条命令完成版本更新、测试、DMG 检查、SHA256 和 GitHub Release：

```bash
pnpm release -- --dry-run 0.2.0  # 只检查发布条件
pnpm release 0.2.0               # 正式发布
```

详见 [发布说明](docs/releasing.md)。

## 许可证

[MIT](LICENSE)
