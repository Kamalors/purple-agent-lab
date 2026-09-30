#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
[[ $(id -u) = 0 && $(hostname) = PAR861454 ]] || { echo 'Expected Proxmox host and root required.' >&2; exit 1; }
vmid=101
address=10.10.10.40
# Clean-slate baseline: snapshot current host config now, verify unchanged at end.
# Only hash files that exist (globs may match nothing on a fresh host).
{ for f in /etc/network/interfaces /etc/pve/storage.cfg /etc/pve/lxc/*.conf /etc/pve/qemu-server/*.conf; do if [ -e "$f" ]; then sha256sum "$f"; fi; done; } | sort > host-before.sha256
iptables -S > host-filter-before.txt
iptables -t nat -S > host-nat-before.txt
[[ ! -e /etc/pve/qemu-server/$vmid.conf && ! -e /etc/pve/lxc/$vmid.conf ]] || { echo 'VMID occupied. No existing guest will be changed.' >&2; exit 1; }
[[ ! -e /var/lib/vz/images/$vmid && ! -e /var/lib/vz/snippets/llm-security-lab-101.yaml ]] || { echo 'Existing laboratory artifacts require inspection; no overwrite.' >&2; exit 1; }
[[ $(awk '/MemAvailable:/ {print $2}' /proc/meminfo) -gt 18874368 ]] || { echo 'Less than 18 GiB memory available.' >&2; exit 1; }
[[ $(df --output=avail -k /var/lib/vz | tail -1) -gt 67108864 ]] || { echo 'Less than 64 GiB disk space available.' >&2; exit 1; }
pvesm status --storage local
python3 - <<'PY'
import glob, json, re, subprocess
rows=json.loads(subprocess.check_output(['pvesh','get','/cluster/resources','--type','vm','--output-format','json']))
allocated=sum(int(x.get('maxmem',0)) for x in rows)
total=int(re.search(r'MemTotal:\s+(\d+)',open('/proc/meminfo').read())[1])*1024
if allocated + 16384*1024*1024 + 3*1024**3 > total:
    raise SystemExit('Insufficient RAM after existing guest limits and 3 GiB host reserve.')
for f in glob.glob('/etc/pve/nodes/*/qemu-server/*.conf') + glob.glob('/etc/pve/nodes/*/lxc/*.conf'):
    if re.search(r'(?<![\d.])10\.10\.10\.40(?![\d.])',open(f).read()):
        raise SystemExit('IP address already configured in '+f)
PY
# ARP duplicate-address check without installing anything on the Proxmox host.
python3 - <<'PY'
import socket, struct, time
mac=bytes.fromhex(open('/sys/class/net/vmbr0/address').read().strip().replace(':',''))
ip=socket.inet_aton('10.10.10.40')
packet=b'\xff'*6+mac+b'\x08\x06'+struct.pack('!HHBBH',1,0x0800,6,4,1)+mac+socket.inet_aton('10.10.10.1')+b'\x00'*6+ip
with socket.socket(socket.AF_PACKET,socket.SOCK_RAW,socket.htons(0x0806)) as s:
    s.bind(('vmbr0',0)); s.settimeout(.5)
    for _ in range(3):
        s.send(packet); until=time.monotonic()+1
        while time.monotonic()<until:
            try: reply=s.recv(2048)
            except TimeoutError: continue
            if len(reply)>=42 and reply[20:22]==b'\x00\x02' and reply[28:32]==ip:
                raise SystemExit('IP address responds to ARP; refusing to use it.')
print('No duplicate address detected by ARP.')
PY
sha256sum -c image.sha256
qemu-img info --output=json noble-server-cloudimg-amd64.img | python3 -c 'import json,sys; x=json.load(sys.stdin); assert x["format"]=="qcow2" and x["virtual-size"]<=48*1024**3'
install -d -m 755 /var/lib/vz/snippets
install -m 600 guest-cloud-config.patched.yaml /var/lib/vz/snippets/llm-security-lab-101.yaml
qm create "$vmid" --name llm-security-lab --description 'Dedicated LLM security lab deployed by Codex; provisional curriculum' \
  --memory 16384 --balloon 0 --cores 6 --sockets 1 --cpu host --cpulimit 6 --cpuunits 100 \
  --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci --ostype l26 --agent enabled=1 --onboot 1
qm set "$vmid" --scsi0 "local:0,import-from=$PWD/noble-server-cloudimg-amd64.img,format=qcow2"
qm resize "$vmid" scsi0 48G
qm set "$vmid" --ide2 local:cloudinit --boot order=scsi0 --serial0 socket --vga serial0 \
  --ipconfig0 "ip=$address/24,gw=10.10.10.1" --nameserver '1.1.1.1 9.9.9.9' \
  --cicustom user=local:snippets/llm-security-lab-101.yaml
qm start "$vmid"
sha256sum -c host-before.sha256
cmp host-filter-before.txt <(iptables -S)
cmp host-nat-before.txt <(iptables -t nat -S)
echo 'VM 101 created. Waiting for guest installation; this can take 15-30 minutes.'
ready=0
for ((i=0;i<180;i++)); do
  if qm guest exec "$vmid" --timeout 10 -- /usr/bin/test -f /opt/llm-security-lab/.ready > guest-status.json 2>/dev/null; then
    if python3 -c 'import json,sys; sys.exit(0 if json.load(open("guest-status.json")).get("exitcode")==0 else 1)'; then ready=1; break; fi
  fi
  if ((i%6==0)); then echo "Guest installation still in progress ($((i*10)) seconds)."; fi
  sleep 10
done
qm guest exec "$vmid" --timeout 10 -- /bin/cat /etc/ssh/ssh_host_ed25519_key.pub > guest-host-key.json || true
chmod 644 guest-host-key.json
sha256sum -c host-before.sha256
if [[ $ready != 1 ]]; then
  qm guest exec "$vmid" --timeout 10 -- /usr/bin/tail -n 60 /var/log/llm-lab-bootstrap.log || true
  echo 'Guest not ready within the wait period; no existing guest changed. Inspect logs before retrying.' >&2
  exit 1
fi
qm status "$vmid"
echo 'LLM_LAB_VM_READY 101 10.10.10.40'
