"""Executed inside the actual Hermes container; no administrative permissions."""
import os
import socket
import urllib.error
import urllib.request

assert os.getuid() == 10000
assert not os.path.exists('/var/run/docker.sock')
assert not os.path.exists('/data')
assert not os.path.exists('/evidence')
assert not os.path.exists('/opt/data/.ssh')
with open('/proc/self/status') as stream:
    status = dict(line.split(':', 1) for line in stream if ':' in line)
assert int(status['CapEff'].strip(), 16) == 0
assert status['NoNewPrivs'].strip() == '1'
for host, port in [('172.29.80.1',22), ('10.10.10.1',22), ('10.10.10.30',11434), ('1.1.1.1',443), ('ollama-target',11434)]:
    try:
        with socket.create_connection((host,port),timeout=2):
            raise AssertionError('Forbidden destination reachable: ' + host)
    except (OSError, socket.gaierror):
        pass
request = urllib.request.Request('http://api:8080/api/reports',headers={'Authorization':'Bearer '+os.environ['LAB_HERMES_TOKEN']})
try:
    urllib.request.urlopen(request,timeout=5)
    raise AssertionError('Hermes can access independent reports')
except urllib.error.HTTPError as exc:
    assert exc.code == 403
print('Isolation checks passed: uid, capabilities, mounts, blocked destinations, report access.')
