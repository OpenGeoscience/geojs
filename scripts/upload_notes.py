from __future__ import print_function

import json
import socket
from datetime import datetime
import os
import argparse
from StringIO import StringIO

import boto3
import git


def gather_info(repo_path='.'):
    repo = git.Repo(repo_path)
    try:
        branch = repo.active_branch.name
    except Exception:
        branch = os.environ.get('TRAVIS_BRANCH')

    info = {
        'build_outputs': [],
        'build_timestamp': datetime.now().isoformat(),
        'datasets': [],
        'git_branch': branch,
        'git_repo': 'git@github.com:OpenGeoscience/geojs.git',
        'git_sha': repo.head.commit.hexsha,
        'host': socket.gethostname(),
        'regeneration_command': 'npm run test',
        'vcs': 'git'
    }
    if os.environ.get('TRAVIS') is 'true':
        info['travis_id'] = os.environ.get('TRAVIS_BUILD_ID')
        info['host'] = 'travis'
    return info


def upload(data, bucket='geojs-build-outputs'):
    # assumes credentials coming from environment variables
    # such as AWS_ACCESS_KEY_ID, AWS_PROFILE, etc.
    s3 = boto3.client('s3')

    f = StringIO()
    f.write(data)
    f.seek(0)

    name = datetime.now().isoformat() + '.json'
    s3.upload_fileobj(f, bucket, name)


def main(args):
    notes = json.load(open(args.notes, 'r'))
    info = gather_info(args.repo)
    info['data'] = notes

    data = json.dumps(info)
    print(data)

    if args.upload:
        upload(data)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Collect performance information and related metadata'
    )

    parser.add_argument(
        '--repo',
        default='.',
        help='Path of the repository'
    )

    parser.add_argument(
        '--upload',
        action='store_true',
        default=False,
        help='Upload results to s3'
    )

    parser.add_argument(
        'notes',
        help='Path to the build notes file'
    )

    main(parser.parse_args())
