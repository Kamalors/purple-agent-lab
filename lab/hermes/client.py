"""Small fixed-target client. Network/filesystem isolation is enforced by Docker."""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

BASE = "http://api:8080"

def call(path, payload=None):
    token = os.environ.get("LAB_HERMES_TOKEN") or Path('/opt/data/lab-token').read_text().strip()
    data = None if payload is None else json.dumps(payload).encode()
    request = urllib.request.Request(BASE + path, data=data, headers={
        "Authorization": "Bearer " + token, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=195) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        raise SystemExit(exc.read().decode()) from None

if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["list"]:
        result = call("/api/scenarios")
    elif len(args) == 2 and args[0] == "start" and re.fullmatch(r"S0[1-8]", args[1]):
        result = call("/api/sessions", {"scenario": args[1], "mode": "attack"})
    elif len(args) == 3 and args[0] == "say" and re.fullmatch(r"[a-f0-9]{32}", args[1]):
        result = call("/api/sessions/" + args[1] + "/messages", {"message": args[2]})
    else:
        raise SystemExit("Usage: client.py list | start S01 | say SESSION MESSAGE")
    print(json.dumps(result, ensure_ascii=False))
