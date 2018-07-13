#!/usr/bin/env python

import argparse
import girder_client
import md5
import os
import subprocess
import time


def generate_baselines(args):
    """
    Generate baseline image tarball by running ctest in the build directory.

    :param args: a dictionary of arguments, including:
        xvfb: if True, run ctest within xvfb-run.
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
    os.chdir(buildPath)
    if not os.path.exists(os.path.join(buildPath, 'CMakeFiles')):
        cmd = ['cmake', '-D', 'FFHEADLESS_TESTS=ON', cwd]
        if args['verbose'] >= 1:
            print('Running cmake: %s' % subprocess.list2cmdline(cmd))
        subprocess.check_call(cmd)
    tarPath = os.path.join(buildPath, 'base-images.tgz')
    if os.path.exists(tarPath):
        os.unlink(tarPath)
    cmd = ['ctest', '-C', 'baseline_images', '-R', 'baseline_images',
           '--output-on-failure']
    if args.get('xvfb'):
        cmd = ['xvfb-run', '-s', '-ac -screen 0 1280x1024x24', 'bash', '-c',
               subprocess.list2cmdline(cmd)]
    if args['verbose'] >= 1:
        print('Running ctest: %s' % subprocess.list2cmdline(cmd))
    subprocess.check_call(cmd)
    os.chdir(cwd)
    tarSize = os.path.getsize(tarPath)
    if args['verbose'] >= 1:
        print('Created baseline image tgz file, %d bytes' % tarSize)


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
        stream=open(tarPath), size=tarSize, mimeType='application/tar+gzip')
    if args['verbose'] >= 1:
        print('Upload to file %s' % uploadedFile['_id'])
    testDataPath = os.path.abspath('testing/test-data')
    if not os.path.isdir(testDataPath):
        raise Exception('Can\'t update test-data information.')
    open(os.path.join(testDataPath, 'base-images.tgz.url'), 'w').write(
        apiRoot + 'file/%s/download' % uploadedFile['_id'])
    open(os.path.join(testDataPath, 'base-images.tgz.md5'), 'w').write(
        md5.new(open(tarPath).read()).hexdigest())
    if args['verbose'] >= 1:
        print('test-data references updated')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Generate and upload a new set of baseline images for '
        'headless Firefox testing.  This should be run in the root directory '
        'of the geojs repository.')
    parser.add_argument(
        '--xvfb', '-x', dest='xvfb', action='store_true',
        help='Run xvfb-run when running ctest to generate the baseline '
        'images.  Only applies if the images are generated.')
    parser.add_argument(
        '--no-xvfb', dest='xvfb', action='store_false',
        help='Don\'t use xvfb-run when generating baseline images.')
    parser.add_argument(
        '--generate', '-g', dest='make', action='store_true',
        help='Generate baseline images by running "ctest -C baseline_images '
        '-R baseline_images".')
    parser.add_argument(
        '--no-generate', dest='make', action='store_false',
        help='Don\'t generate baseline images.')
    parser.add_argument(
        '--build', '-b', default='.',
        help='The build directory.  This is created if baseline images are '
        'generated and the directory does not exist.')
    parser.add_argument(
        '--upload', '-u', dest='upload', action='store_true',
        help='Upload base-images.tgz.')
    parser.add_argument(
        '--no-upload', dest='upload', action='store_false',
        help='Don\'t upload the baseline image tarball.')
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
