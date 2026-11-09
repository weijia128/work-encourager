#!/usr/bin/env bash

set -Eeuo pipefail

REPO="weijia128/work-encourager"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
用法：
  pnpm release 0.2.0              构建并发布新版本
  pnpm release -- --dry-run 0.2.0 只检查发布条件，不修改或发布

目前支持在 Apple 芯片 Mac 上发布 macOS aarch64 DMG。
EOF
}

DRY_RUN=0
# 兼容 pnpm release -- --dry-run 0.2.0 传入的字面量 --。
if [[ "${1:-}" == "--" ]]; then
  shift
fi
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
  shift
fi
if [[ $# -ne 1 ]]; then
  usage >&2
  exit 2
fi

VERSION="${1#v}"
if [[ ! "$VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "错误：版本号必须是 x.y.z，例如 0.2.0。" >&2
  exit 2
fi
TAG="v$VERSION"

for command in git node pnpm gh shasum hdiutil; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "错误：找不到命令 $command。" >&2
    exit 1
  fi
done

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "错误：此脚本目前只能在 Apple 芯片 Mac 上运行。" >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "错误：请先切换到 main 分支。" >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "错误：工作区有未提交修改，请先提交或暂存到别处。" >&2
  exit 1
fi
gh auth status >/dev/null

CURRENT_VERSION="$(node -p "require('./package.json').version")"
if ! node - "$CURRENT_VERSION" "$VERSION" <<'NODE'
const [current, next] = process.argv.slice(2).map((version) => version.split('.').map(Number));
for (let i = 0; i < 3; i += 1) {
  if (next[i] > current[i]) process.exit(0);
  if (next[i] < current[i]) process.exit(1);
}
process.exit(1);
NODE
then
  echo "错误：新版本 $VERSION 必须高于当前版本 $CURRENT_VERSION。" >&2
  exit 1
fi

echo "==> 检查本地与远程状态"
git fetch origin main --tags
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  echo "错误：本地 main 与 origin/main 不一致，请先同步。" >&2
  exit 1
fi
if git rev-parse "$TAG" >/dev/null 2>&1 || git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "错误：标签 $TAG 已存在。" >&2
  exit 1
fi
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "错误：Release $TAG 已存在。" >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "检查通过：可以从 $CURRENT_VERSION 发布 $TAG。"
  echo " dry-run 未修改文件、未构建、未发布。"
  exit 0
fi

VERSION_FILES=(package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock)
VERSIONS_CHANGED=0
RELEASE_COMMITTED=0
WORK_DIR=""

cleanup() {
  status=$?
  trap - EXIT
  if [[ -n "$WORK_DIR" && -d "$WORK_DIR" ]]; then
    if hdiutil info | grep -Fq "$WORK_DIR/mounted"; then
      hdiutil detach "$WORK_DIR/mounted" >/dev/null 2>&1 || true
    fi
    rm -rf "$WORK_DIR"
  fi
  if [[ "$status" -ne 0 && "$VERSIONS_CHANGED" -eq 1 && "$RELEASE_COMMITTED" -eq 0 ]]; then
    git restore -- "${VERSION_FILES[@]}" >/dev/null 2>&1 || true
  fi
  exit "$status"
}
trap cleanup EXIT

echo "==> 更新版本号：$CURRENT_VERSION -> $VERSION"
VERSIONS_CHANGED=1
RELEASE_VERSION="$VERSION" node <<'NODE'
const fs = require('node:fs');
const version = process.env.RELEASE_VERSION;

for (const path of ['package.json', 'src-tauri/tauri.conf.json']) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.version = version;
  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

const path = 'src-tauri/Cargo.toml';
const cargo = fs.readFileSync(path, 'utf8');
const updated = cargo.replace(/^version = "[^"]+"/m, `version = "${version}"`);
if (updated === cargo) throw new Error(`无法更新 ${path}`);
fs.writeFileSync(path, updated);
NODE

echo "==> 安装依赖并运行测试"
pnpm install --frozen-lockfile
pnpm test

echo "==> 构建 macOS DMG"
pnpm tauri build

DMG_DIR="src-tauri/target/release/bundle/dmg"
DMG_NAME="work-encourager_${VERSION}_aarch64.dmg"
DMG_PATH="$DMG_DIR/$DMG_NAME"
if [[ ! -f "$DMG_PATH" ]]; then
  echo "错误：构建完成但找不到 $DMG_PATH。" >&2
  exit 1
fi

echo "==> 挂载并检查 DMG"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/work-encourager-release.XXXXXX")"
MOUNT_DIR="$WORK_DIR/mounted"
mkdir -p "$MOUNT_DIR"
hdiutil attach "$DMG_PATH" -nobrowse -readonly -mountpoint "$MOUNT_DIR" >/dev/null
APP_PATH="$MOUNT_DIR/work-encourager.app"
if [[ ! -d "$APP_PATH" || ! -e "$MOUNT_DIR/应用程序" ]]; then
  echo "错误：DMG 中缺少 App 或“应用程序”快捷方式。" >&2
  exit 1
fi
APP_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP_PATH/Contents/Info.plist")"
if [[ "$APP_VERSION" != "$VERSION" ]]; then
  echo "错误：App 版本为 $APP_VERSION，预期为 $VERSION。" >&2
  exit 1
fi
hdiutil detach "$MOUNT_DIR" >/dev/null

SHA256="$(shasum -a 256 "$DMG_PATH" | awk '{print $1}')"
CHECKSUM_PATH="$DMG_DIR/SHA256SUMS"
printf '%s  %s\n' "$SHA256" "$DMG_NAME" > "$CHECKSUM_PATH"

echo "==> 提交版本并推送标签"
PREVIOUS_TAG="$(git tag --list 'v*' --sort=-version:refname | head -n 1)"
git add "${VERSION_FILES[@]}"
git commit -m "chore: release $TAG"
RELEASE_COMMITTED=1
git tag -a "$TAG" -m "$TAG"
git push origin main
git push origin "$TAG"

NOTES_PATH="$WORK_DIR/release-notes.md"
{
  cat <<EOF
## 下载

- **macOS（Apple 芯片，M1 及以后）**：\`$DMG_NAME\`
- Intel Mac 和 Windows 版本请到项目页面查看是否已提供

## 第一次打开

应用没有 Apple 签名，第一次打开会提示“无法验证开发者”：

1. 在「应用程序」里**右键** App → 选「打开」→ 再点一次「打开」
2. 还是打不开：「系统设置 → 隐私与安全性」，在下方点「仍要打开」
3. 提示“已损坏”：在终端执行 \`xattr -cr /Applications/work-encourager.app\`

## 更新内容

EOF
  if [[ -n "$PREVIOUS_TAG" ]]; then
    git log --no-merges --pretty=format:'- %s' "$PREVIOUS_TAG..HEAD" | grep -v "^- chore: release $TAG$" || true
  else
    git log --no-merges --pretty=format:'- %s' -20
  fi
  cat <<EOF


## 校验

\`\`\`
SHA256  $SHA256  $DMG_NAME
\`\`\`
EOF
} > "$NOTES_PATH"

echo "==> 创建 GitHub Release"
gh release create "$TAG" "$DMG_PATH" "$CHECKSUM_PATH" \
  --repo "$REPO" \
  --title "上班鼓励器 $TAG" \
  --notes-file "$NOTES_PATH" \
  --verify-tag

RELEASE_URL="https://github.com/$REPO/releases/tag/$TAG"
LATEST_URL="https://github.com/$REPO/releases/latest"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$TAG/$DMG_NAME"

cat <<EOF

发布完成：$TAG
Release：   $RELEASE_URL
最新下载页：$LATEST_URL
DMG 直链：  $DOWNLOAD_URL
SHA256：    $SHA256
EOF
