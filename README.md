# 王逸凡galgame

通过 GitHub 下载 `67days-2.2.0-release.apk`，无需 npm 账号。需要 Node.js 18+、npm 和 Git。

```bash
npm install sunxiaochuan078/wangyifan-galgame --foreground-scripts
```

APK 下载到执行命令的文件夹（约 125 MB），校验大小和 SHA-256。不会自动安装或运行 APK，不覆盖不同内容的同名文件。下载器不使用第三方依赖，不创建命令快捷链接，兼容 Android 共享存储目录。

## Termux

如果 GitHub 的 SSH 22 端口被网络拦截，先执行一次：

```bash
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
```

再运行上述安装命令。若安装脚本被禁用，或安装后需要重新下载：

```bash
npm --prefix node_modules/wangyifan-galgame run download
```

`--ignore-scripts` 会跳过自动下载。再次运行安装命令可能显示 already up to date，此时用 `run download` 重新下载。下载失败后可以重试；不同内容的同名 APK 需要先手动移走。

本项目未发布到 npm registry。`npm install` 使用的是 GitHub 仓库，不需要密码、令牌或 SSH 密钥。

SHA-256：`4e0ae8ea7a321e24d70244792cd76c07bb41554de88b14a0d42e7b16d3d10683`
