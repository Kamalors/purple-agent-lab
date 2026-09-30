#!/bin/sh
set -eu
# Runs ONLY inside the dedicated VM. Host Proxmox rules are never changed.
iptables -N LLMLAB-IN 2>/dev/null || true
iptables -C LLMLAB-IN -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || iptables -A LLMLAB-IN -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
for bridge in br-llmlab-front br-llmlab-tgt; do
  iptables -C LLMLAB-IN -i "$bridge" -j DROP 2>/dev/null || iptables -A LLMLAB-IN -i "$bridge" -j DROP
done
iptables -C INPUT -j LLMLAB-IN 2>/dev/null || iptables -I INPUT 1 -j LLMLAB-IN
# Docker IPv6 is disabled on these networks; block it here as well if enabled later.
if ip6tables -L INPUT -n >/dev/null 2>&1; then
  for bridge in br-llmlab-front br-llmlab-tgt; do
    ip6tables -C INPUT -i "$bridge" -j DROP 2>/dev/null || ip6tables -I INPUT 1 -i "$bridge" -j DROP
  done
fi
