#!/usr/bin/env python

# NOTE: If this doesn't work, it may be related to a policy in
#   /etc/ImageMagick-6/policy.xml
# Specifically, disable
#   <policy domain="coder" rights="none" pattern="PS" />
# by removing it or commenting it out.

import json
import os
import psutil
import signal
import six
import subprocess
import sys
import time

OriginalSize = (1200, 900)
ExtraSpace = 1  # 1, otherwise we get a black border on the bottom and right
NavbarHeight = 60
FinalSize = (800, 600)
InitialDelay = 15  # in seconds
MaxDelay = 30  # in seconds
Quality = 90
OutputFile = 'thumb.jpg'
InputList = ["examples", "tutorials"]
BrowserCommand = [
    'xvfb-run', '-s', '-ac -screen 0 %dx%dx24' % (
        OriginalSize[0] + ExtraSpace, OriginalSize[1] + ExtraSpace + NavbarHeight),
    'google-chrome', '--kiosk', '--no-pings', '--device-scale-factor=1',
    '--incognito', '--start-fullscreen', '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_geojs_thumbnails', '--no-first-run',
    '--disable-default-apps', '--disable-popup-blocking',
    '--disable-translate', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-device-discovery-notifications',
    '--window-position=0,0',
]
BrowserCommandSize = [
    '--window-size=%d,%d' % (OriginalSize[0] + ExtraSpace, OriginalSize[1] + ExtraSpace),
]
BrowserCommandSizeIgnoreNavbar = [
    '--window-size=%d,%d' % (
        OriginalSize[0] + ExtraSpace, OriginalSize[1] + ExtraSpace + NavbarHeight),
]
BrowserUrl = 'http://127.0.0.1:30100/%s'
ImageCommand = (
    'DISPLAY=:99.0 import -window root -crop %dx%d+0+0 +repage - | '
    'convert - -resize %dx%d -quality %d ' % (
        OriginalSize[0], OriginalSize[1], FinalSize[0], FinalSize[1], Quality))
ImageCommandIgnoreNavbar = (
    'DISPLAY=:99.0 import -window root -crop %dx%d+0+%d +repage - | '
    'convert - -resize %dx%d -quality %d ' % (
        OriginalSize[0], OriginalSize[1], NavbarHeight, FinalSize[0], FinalSize[1], Quality))


def process_item(path, opts):
    output = (open('/tmp/thumbnail.out', 'a')
              if opts.get('verbose', 0) >= 1 else open(os.devnull, 'w'))
    data = json.load(open(path))
    if data.get('disabled') and not opts.get('all'):
        return
    dest = os.path.join(os.path.dirname(path), OutputFile)
    if os.path.exists(dest) and not opts.get('force'):
        return
    originalSize = 0
    if os.path.exists(dest):
        originalSize = os.path.getsize(dest)
    sys.stdout.write('\r%s %d' % (path, originalSize))
    sys.stdout.flush()
    if opts.get('simulate'):
        dest = os.path.join('/tmp', os.path.basename(os.path.dirname(
            os.path.dirname(path))) + '_' + os.path.basename(os.path.dirname(
                path)) + '_' + OutputFile)
        if os.path.exists(dest):
            os.unlink(dest)
    cmd = list(BrowserCommand)
    imgcmd = ImageCommand
    if 'example.json' in path and not data.get('hideNavbar'):
        cmd.extend(BrowserCommandSizeIgnoreNavbar)
        imgcmd = ImageCommandIgnoreNavbar
    else:
        cmd.extend(BrowserCommandSize)
    url = BrowserUrl % os.path.dirname(path)
    if data.get('thumbquery'):
        url += '?' + data['thumbquery']
    cmd.append(url)
    output.write('--> %r\n' % (cmd, ))
    output.write('    %s\n' % (' '.join([six.moves.shlex_quote(arg) for arg in cmd])))
    proc = subprocess.Popen(cmd, shell=False, stdout=output, stderr=output)
    delay = opts.get('delay', InitialDelay)
    startTime = time.time()
    time.sleep(delay)
    lastSize = 0
    while True:
        output.write('--> %r\n' % (imgcmd + six.moves.shlex_quote(dest), ))
        subprocess.Popen(
            imgcmd + six.moves.shlex_quote(dest), shell=True,
            stdout=output, stderr=output).wait()
        newSize = os.path.getsize(dest)
        if newSize and newSize == lastSize:
            break
        if time.time() - startTime > opts.get('maxdelay', MaxDelay):
            break
        lastSize = newSize
        sys.stdout.write('\r%s %d %d ' % (path, originalSize, newSize))
        sys.stdout.flush()
        time.sleep(0.5)
    for child in psutil.Process(proc.pid).children(recursive=True):
        try:
            child.send_signal(signal.SIGINT)
        except psutil.NoSuchProcess:
            pass
    os.kill(proc.pid, signal.SIGINT)
    proc.wait()
    sys.stdout.write('\n')


if __name__ == '__main__':  # noqa
    opts = {'force': False, 'verbose': 0}
    for arg in sys.argv[1:]:
        if arg in ('-a', '--all'):
            opts['all'] = True
        elif arg.startswith('--delay='):
            opts['delay'] = float(arg.split('=', 1)[1])
        elif arg == '--force':
            opts['force'] = True
        elif arg.startswith('--maxdelay='):
            opts['maxdelay'] = float(arg.split('=', 1)[1])
        elif arg.startswith('--only='):
            opts['only'] = arg.split('=', 1)[1]
        elif arg in ('-s', '--simulate'):
            opts['simulate'] = True
        elif arg in ('-v', '--verbose'):
            opts['verbose'] += 1
        else:
            opts['help'] = True
    if opts.get('help'):
        print("""
Regenerate thumbnails for examples and tutorials.

Syntax: make_thumbnails.py --force --simulate --only=(substr) --all
                           --delay=(seconds) --maxdelay=(seconds)

Run in the root geojs directory.
--all or -a generates thumbnails for disabled examples, too.
--delay is the duration after the web browser is started before a thumbnail
 snapshot might be taken.  The thumbnail is only taken after the webpage hasn't
 changed for a short duration.
--force regenerates all thumbnails.  Otherwise, only missing thumbnails are
 created.
--maxdelay is the longest to wait before taking the snapshot.  This will happen
 even if the webpage is still changing.
--only will only process examples or tutorials whose name contains the
 specified substring.
--simulate or -s determines the size of thumbnails that would be created but
 doesn't make them.
""")
        sys.exit(0)
    for inputdir in InputList:
        for root, dirs, files in os.walk(inputdir):
            dirs.sort()
            for dir in dirs:
                for name in ['example.json', 'tutorial.json']:
                    path = os.path.join(root, dir, name)
                    if opts.get('only') and not opts['only'] in path:
                        continue
                    if os.path.exists(path):
                        process_item(path, opts)
