# 远程文案库

安装包内置 `src/data/copyLibrary.json`，包含 `version`、`humor`（班味）和 `dao`（清静）三组文本。远程 JSON 使用相同格式。

## 发布配置

构建前在环境变量中设置远程 HTTPS 地址：

```bash
VITE_COPY_LIBRARY_URL=https://cdn.example.com/work-encourager/copy-library.json pnpm tauri build
```

可将 `src/data/copyLibrary.json` 上传到 OSS、对象存储 CDN 或其他静态 HTTPS 服务。Tauri HTTP capability 必须允许对应域名。

## 更新规则

- 应用启动时及每 6 小时拉取一次。
- 每次修改远程内容必须递增整数 `version`；旧版本不会覆盖较新的缓存。
- 单条文案最多 120 字，每组最多 200 条。
- 拉取或校验失败时使用旧缓存，没有缓存则使用安装包内置文案。
- 远程内容只作为文本处理，不作为代码执行。
