#!/usr/bin/env python

import argparse
import girder_client
import os
import shutil
import subprocess
import time


def generate_baselines(args):
    """
    Generate baseline image tarball.

    :param args: a dictionary of arguments, including:
        xvfb: if True, run ci-xvfb instead of ci.
        make: if "existing", use existing images to create the tarball rather
            than running ci or ci-xvfb.
        build: the build directory; created if it does not exist.
        verbose: the verbosity level.
    """
    cwd = os.path.abspath(os.path.expanduser(os.getcwd()))
    buildPath = os.path.abspath(os.path.expanduser(args.get('build')))
    if args['verbose'] >= 1:
        print('Build path: %s' % buildPath)
    if not os.path.exists(buildPath):
        os.makedirs(buildPath)
    if not os.path.isdir(buildPath):
        raise Exception('build path is not a directory')
    tarName = 'base-images.tgz'
    tarPath = os.path.join(buildPath, tarName)
    if os.path.exists(tarPath):
        os.unlink(tarPath)
    if args['make'] != 'existing':
        cmd = ['npm', 'run', 'ci-xvfb' if args.get('xvfb') else 'ci']
        if args['verbose'] >= 1:
            print('Generating baselines: %s' % subprocess.list2cmdline(cmd))
        subprocess.check_call(cmd)
    os.chdir(buildPath)
    cmd = ['bash', '-c',
           "find images -name '*.png' -a -not -name '*-test.png' -a -not "
           "-name '*-diff.png' -a -not -name '*-base.png' -a -not "
           "-name '*-screen.png' -print0 | xargs -0 -n 1 -P 8 optipng || true"]
    if args['verbose'] >= 1:
        print('Optimizing output: %s' % subprocess.list2cmdline(cmd))
    subprocess.check_call(cmd)
    cmd = ['tar', '-zcvf', tarPath, '--exclude=*-test.png',
           '--exclude=*-diff.png', '--exclude=*-base.png',
           '--exclude=*-screen.png', '-C', 'images', '.']
    if args['verbose'] >= 1:
        print('Making tar file: %s' % subprocess.list2cmdline(cmd))
    subprocess.check_call(cmd)
    tarSize = os.path.getsize(tarPath)
    if args['verbose'] >= 1:
        print('Created baseline image tgz file, %d bytes' % tarSize)
    os.chdir(cwd)
    if args.get('copy'):
        name = 'Baseline Images %s.tgz' % time.strftime(
            '%Y-%m-%d %H-%M-%S', time.localtime(os.path.getmtime(tarPath)))
        copiedTarPath = os.path.join(buildPath, name)
        shutil.copy2(tarPath, copiedTarPath)
        if args['verbose'] >= 1:
            print('Copied baseline image tgz file to %s' % copiedTarPath)


def upload_baselines(args):
    """
    Upload the baseline image tarball to a girder instance.

    :param args: a dictionary of arguments, including:
        build: the build directory where the tarball is located.
        dest: the root url of the Girder instance.
        folder: the Girder folder ID to upload to.
        apikey: a Girder authentication token.  Optional.
        username: a Girder username.  Optional.
        password: a Girder username.  Optional.
        verbose: the verbosity level.
    """
    buildPath = os.path.abspath(os.path.expanduser(args.get('build')))
    tarPath = os.path.join(buildPath, 'base-images.tgz')
    tarSize = os.path.getsize(tarPath)
    # Get the folder we want to upload to to ensure it exists
    apiRoot = args['dest'].rstrip('/') + '/api/v1/'
    gc = girder_client.GirderClient(apiUrl=apiRoot)
    if args.get('apikey'):
        gc.authenticate(apiKey=args.get('apikey'))
    elif args.get('username') and args.get('password'):
        gc.authenticate(username=args.get('username'),
                        password=args.get('password'))
    else:
        gc.authenticate(username=args.get('username'), interactive=True)
    name = 'Baseline Images %s.tgz' % time.strftime(
        '%Y-%m-%d %H:%M:%S', time.localtime(os.path.getmtime(tarPath)))
    uploadedFile = gc.uploadFile(
        parentId=args['folder'], parentType='folder', name=name,
        stream=open(tarPath, 'rb'), size=tarSize, mimeType='application/tar+gzip')
    if args['verbose'] >= 1:
        print('Upload to file %s' % uploadedFile['_id'])
    testDataPath = os.path.abspath('scripts/datastore.js')
    if not os.path.isfile(testDataPath):
        raise Exception('Cannot update test-data information.')
    sha512 = gc.getFile(uploadedFile['_id'])['sha512']
    ds = open(testDataPath).read()
    start, rest = ds.split("'base-images.tgz': ", 1)
    rest, end = rest.split(',', 1)
    ds = start + ("'base-images.tgz': '%s'," % sha512) + end
    open(testDataPath, 'w').write(ds)
    if args['verbose'] >= 1:
        print('test-data references updated')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Generate and upload a new set of baseline images for '
        'headless Firefox testing.  This should be run in the root directory '
        'of the geojs repository.')
    parser.add_argument(
        '--xvfb', '-x', dest='xvfb', action='store_true',
        help='Run xvfb-run when generating the baseline images.  Only applies '
        'if the images are generated.')
    parser.add_argument(
        '--no-xvfb', dest='xvfb', action='store_false',
        help='Do not use xvfb-run when generating baseline images.')
    parser.add_argument(
        '--generate', '-g', dest='make', action='store_true',
        help='Generate baseline images by running "npm ci".')
    parser.add_argument(
        '--no-generate', dest='make', action='store_false',
        help='Do not generate baseline images.')
    parser.add_argument(
        '--existing-images', '-e', dest='make', action='store_const',
        const='existing', help='Create a baseline file from existing images.')
    parser.add_argument(
        '--build', '-b', default='.',
        help='The build directory.  This is created if baseline images are '
        'generated and the directory does not exist.')
    parser.add_argument(
        '--copy', '-c', dest='copy', action='store_true',
        help='Copy base-images.tgz to a file that includes the date in its '
        'name (Baseline Images <date>.tgz).')
    parser.add_argument(
        '--upload', '-u', dest='upload', action='store_true',
        help='Upload base-images.tgz.')
    parser.add_argument(
        '--no-upload', dest='upload', action='store_false',
        help='Do not upload the baseline image tarball.')
    parser.add_argument(
        '--dest', '-d', default='https://data.kitware.com',
        help='Destination for upload.  Must be a Girder server.  /api/v1 is '
        'added to this destination to reach the Girder api.')
    parser.add_argument(
        '--folder', '-f', default='5841a0488d777f5cdd826f1b',
        help='Destination folder ID.')
    parser.add_argument(
        '--apikey', '-a',
        help='Girder API key.  If neither an API key nor a username and '
        'password are given, an interactive prompt requests a username and '
        'password.')
    parser.add_argument(
        '--username', '--user', help='Girder username.  Optional.')
    parser.add_argument(
        '--password', '--pass', help='Girder password.  Optional.')
    parser.add_argument('--verbose', '-v', action='count', default=0)

    args = vars(parser.parse_args())
    if args['verbose'] >= 2:
        print('Parsed arguments: %r' % args)
    if args.get('make'):
        generate_baselines(args)
    if args.get('upload'):
        upload_baselines(args)
