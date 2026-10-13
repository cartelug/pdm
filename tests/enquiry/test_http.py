"""Isolated enquiry delivery fixtures; the sendmail stub never contacts an external mailbox."""
import http.cookiejar
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

root = Path(__file__).resolve().parents[2]
php = os.environ.get('PCI_TEST_PHP', 'php')
ini = os.environ.get('PCI_TEST_PHP_INI')
command = [php] + (['-c', ini] if ini else [])

with tempfile.TemporaryDirectory(prefix='pci-enquiry-fixture-') as temporary:
    private = Path(temporary)
    sendmail = private / 'sendmail'
    sendmail.write_text('#!/bin/sh\ncat > "'+str(private / 'accepted-message.txt')+'"\nexit 0\n')
    sendmail.chmod(0o700)
    sock = socket.socket(); sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]; sock.close()
    env = os.environ.copy()
    env.update(PCI_ENQUIRY_ENABLED='1', PCI_ENQUIRY_TO='receiver@example.invalid', PCI_ENQUIRY_FROM='sender@example.invalid', TMPDIR=temporary)
    log = tempfile.TemporaryFile()
    server = subprocess.Popen(command+['-d', 'sendmail_path='+str(sendmail), '-S', '127.0.0.1:'+str(port), '-t', str(root)], env=env, stdout=log, stderr=log)
    jar = http.cookiejar.CookieJar()
    client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    endpoint = 'http://127.0.0.1:'+str(port)+'/api/enquiry.php'

    def request(data=None, origin='https://pamodzici.com'):
        req = urllib.request.Request(endpoint, None if data is None else urllib.parse.urlencode(data).encode(), headers={'Origin': origin, 'Accept': 'application/json'})
        try:
            with client.open(req, timeout=5) as response:
                return response.status, json.loads(response.read())
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())

    try:
        for _ in range(100):
            try:
                code, status = request(); break
            except OSError:
                time.sleep(.05)
        assert code == 200 and status['available'] is True
        payload = {'name': 'Fixture Person', 'email': 'person@example.invalid', 'organisation': '', 'phone': '', 'topic': 'General enquiry', 'message': 'This is a local-only fixture message.', 'website': '', 'csrf': status['csrf']}
        assert request(dict(payload, csrf='invalid'))[0] == 403
        assert request(payload, 'https://unrelated.invalid')[0] == 403
        time.sleep(2.1)
        assert request(dict(payload, email='invalid'))[0] == 422
        assert request(dict(payload, website='spam'))[0] == 400
        assert request(dict(payload, topic='Unapproved topic'))[0] == 422
        assert request(dict(payload, email='person@example.invalid\r\nBcc: someone@example.invalid'))[0] == 422
        for _ in range(3):
            code, result = request(payload); assert code == 200 and result['ok'] is True
        assert (private / 'accepted-message.txt').is_file()
        assert request(payload)[0] == 429
        print('PASS enquiry: session/CSRF, origin, validation, honeypot, fixed routing, isolated mail acceptance and rate limit')
    finally:
        server.terminate(); server.wait(timeout=5); log.close()
