# 拓算智云官网部署说明

本项目是纯静态 HTML/CSS/JavaScript 网站，不需要 Node.js、数据库或应用进程。推荐使用 Ubuntu 26.04 LTS + Nginx 部署。

## 一、初始化 Ubuntu

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y nginx tar curl unzip
sudo timedatectl set-timezone Asia/Shanghai
```

关闭 UFW：

```bash
command -v ufw >/dev/null && sudo ufw disable || true
sudo systemctl disable --now ufw 2>/dev/null || true
command -v ufw >/dev/null && sudo ufw status || echo 'UFW is not installed'
```

关闭 UFW 后，请在云厂商安全组中放行 TCP 22、80、443 端口；不要依赖服务器本机防火墙做端口控制。

## 二、上传并安装网站

将 `tuosuan-cloud-website-20260921.tar.gz` 上传到服务器，例如 `/tmp`，然后执行：

```bash
sudo mkdir -p /var/www/tuosuan-cloud
sudo tar -xzf /tmp/tuosuan-cloud-website-20260921.tar.gz -C /var/www/tuosuan-cloud
sudo chown -R www-data:www-data /var/www/tuosuan-cloud
sudo find /var/www/tuosuan-cloud -type d -exec chmod 755 {} \;
sudo find /var/www/tuosuan-cloud -type f -exec chmod 644 {} \;
```

如果压缩包解压后多了一层目录，请把 Nginx 的 `root` 指向包含 `index.html` 的实际目录。

## 三、2 核 4 GB Web 服务器优化

本包提供一套面向静态 Nginx 网站的保守配置。它会调整连接队列、TCP keepalive、孤儿连接超时、换页倾向和文件句柄上限，不修改拥塞控制算法，也不启用有兼容风险的 TCP 参数。

在网站目录中执行：

```bash
cd /var/www/tuosuan-cloud
sudo bash deploy/install-system-tuning.sh
```

检查生效值：

```bash
sysctl net.core.somaxconn net.ipv4.tcp_max_syn_backlog
sysctl net.ipv4.tcp_syncookies net.ipv4.tcp_fin_timeout
sysctl vm.swappiness vm.vfs_cache_pressure fs.file-max
systemctl show nginx -p LimitNOFILE
```

4 GB 内存建议保留 2 GB swap，避免系统在突发内存压力下直接终止 Nginx 或 SSH。若 `swapon --show` 没有输出，再创建 swap：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
swapon --show
```

回滚优化配置：

```bash
sudo rm -f /etc/sysctl.d/99-tuosuan-web.conf
sudo rm -f /etc/systemd/system/nginx.service.d/limits.conf
sudo systemctl daemon-reload
sudo reboot
```

## 四、配置 Nginx

复制包内的示例配置：

```bash
sudo cp /var/www/tuosuan-cloud/nginx/tuosuan-cloud.conf /etc/nginx/sites-available/tuosuan-cloud.conf
sudo nano /etc/nginx/sites-available/tuosuan-cloud.conf
```

把 `server_name` 改成你的域名；没有域名时可暂时使用服务器公网 IP。

```bash
sudo ln -s /etc/nginx/sites-available/tuosuan-cloud.conf /etc/nginx/sites-enabled/tuosuan-cloud.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
```

## 五、配置 HTTPS（推荐）

先将域名 DNS 的 A/AAAA 记录指向云主机，并确认 80 端口可访问，然后执行：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
sudo certbot renew --dry-run
```

## 六、检查

```bash
curl -I http://your-domain.example.com
sudo systemctl status nginx --no-pager
sudo journalctl -u nginx -n 50 --no-pager
```

本项目的联系我们表单目前仅做浏览器端校验和成功提示，不会向服务器发送邮件；如需真正收集线索，需要另接 API 或第三方表单服务。
