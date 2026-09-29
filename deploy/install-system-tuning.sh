#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/install-system-tuning.sh" >&2
  exit 1
fi

cpu_count="$(nproc)"
memory_kib="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"

echo "Detected ${cpu_count} CPU(s), $((memory_kib / 1024)) MiB RAM."
if (( cpu_count < 2 || memory_kib < 3500000 )); then
  echo "Warning: this profile was designed for a 2 vCPU / 4 GiB web VM." >&2
fi

install -m 0644 deploy/99-tuosuan-web.conf /etc/sysctl.d/99-tuosuan-web.conf
install -d -m 0755 /etc/systemd/system/nginx.service.d
install -m 0644 deploy/nginx-systemd-override.conf \
  /etc/systemd/system/nginx.service.d/limits.conf

sysctl --system
systemctl daemon-reload

if systemctl is-active --quiet nginx; then
  nginx -t
  systemctl restart nginx
fi

echo "Tuning installed. Reboot is not required."
