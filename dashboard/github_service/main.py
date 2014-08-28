#!/usr/bin/env python

import os
import sys
from datetime import datetime
import json
import hmac
import hashlib

import pymongo
import tangelo
import requests
import cherrypy

import dashboard

global _geojs_test_mongo

_cdash_url = 'http://my.cdash.org/index.php?project=geojs'
_geojs_test_mongo = None
_github_api = 'https://api.github.com'
_geojs_owner = 'OpenGeoscience'
_geojs_repo = 'geojs'
_auth_token = os.environ.get('GEOJS_DASHBOARD_KEY')
_secret_key = os.environ.get('GEOJS_HOOK_KEY')
try:
    _config = json.loads(
        open(
            os.path.expanduser('~/.geojs_dashboard_config.json'),
            'r'
        ).read()
    )
    _auth_token = _config['dashboard_key']
    _secret_key = _config['hook_key']
except Exception:
    pass

if not _auth_token or not _secret_key:
    raise Exception('GEOJS_DASHBOARD_KEY and GEOJS_HOOK_KEY required.')


def mongo_client():
    '''
    Get a global reference to the mongo client.
    '''
    global _geojs_test_mongo
    if _geojs_test_mongo is None or not _geojs_test_mongo.alive():
        _geojs_test_mongo = pymongo.MongoClient()
    return _geojs_test_mongo


def mongo_database():
    '''
    Return the database containing the queue collection.
    '''
    return mongo_client()['geojs_dashboard']


def add_push(obj):
    '''
    Add a push to the test queue.
    '''
    db = mongo_database()

    # get the branch name w/o refs/heads
    branch = '/'.join(obj['ref'].split('/')[2:])

    # get the new commit hash
    commit = obj['after']
    if commit == '0' * 40:
        # ignore branch deletions
        return

    # get the username of the person who pushed the branch
    user = obj['pusher']['name']

    # set a time stamp
    timestamp = datetime.now()

    # check if the hash has already been tested
    tested = db['results']
    if tested.find_one({'hash': commit}):
        return

    # queue the commit for testing
    queue = db['queue']
    context = branch + '/geojs_dashboard'
    item = {
        'branch': branch,
        'commit': commit,
        'user': user,
        'time': timestamp,
        'context': context
    }
    queue.update({'context': context}, item, upsert=True)

    # set the status of the tip of the push to pending
    url = '/'.join((
        _github_api,
        'repos',
        _geojs_owner,
        _geojs_repo,
        'statuses',
        commit
    ))
    data = json.dumps({
        'state': 'pending',
        'target_url': _cdash_url,
        'context': context,
        'description': 'running dashboard tests'
    })
    resp = requests.post(
        url,
        auth=(_auth_token, 'x-oauth-basic'),
        data=data
    )
    if not resp.ok:
        print >> sys.stderr("Could not set pending status")


def run_test(obj):
    '''
    Runs a test from a queue object.  After the test is run,
    sets the status on github to the result.
    '''
    branch = obj['branch']
    context = obj['context']
    commit = obj['commit']
    user = obj['user']
    url = '/'.join((
        _github_api,
        'repos',
        _geojs_owner,
        _geojs_repo,
        'statuses',
        commit
    ))

    # run the dashboard test locally
    try:
        status = dashboard.main(
            commit,
            branch,
            user
        )
    except Exception as e:
        # something went wrong in the dashboard, so set the
        # status to error and exit
        data = json.dumps({
            'state': 'error',
            'target_url': _cdash_url,
            'context': context,
            'description': 'Dashboard failure detected: ' + str(e)
        })
        requests.post(
            url,
            auth=(_auth_token, 'x-oauth-basic'),
            data=data
        )
        return

    # set status
    if status['pass']:
        data = json.dumps({
            'state': 'success',
            'target_url': _cdash_url,  # can we get the actual url of the test from cdash?
            'context': context,
            'description': 'All geojs dashboard tests passed!'
        })
        requests.post(
            url,
            auth=(_auth_token, 'x-oauth-basic'),
            data=data
        )
    else:
        data = json.dumps({
            'state': 'failure',
            'target_url': _cdash_url,  # can we get the actual url of the test from cdash?
            'context': context,
            'description': status['reason']
        })
        requests.post(
            url,
            auth=(_auth_token, 'x-oauth-basic'),
            data=data
        )


@tangelo.restful
def get(*arg, **kwarg):
    '''
    Just to make sure the server is listening.
    '''
    return 'I hear you!'


@tangelo.restful
def post(*arg, **kwarg):
    '''
    This is the main listener for github webhooks.
    '''

    # retrieve the headers from the request
    # headers = tangelo.request_headers() # <- not merged
    headers = cherrypy.request.headers

    # get the request body as a dict
    body = tangelo.request_body()
    s = body.read()

    # make sure this is a valid request coming from github
    computed_hash = hmac.new(str(_secret_key), s, hashlib.sha1).hexdigest()
    received_hash = headers.get('X-Hub-Signature', 'sha1=')[5:]
    if not hmac.compare_digest(computed_hash, received_hash):
        return tangelo.HTTPStatusCode(403, "Invalid signature")

    try:
        obj = json.loads(s)
    except:
        return tangelo.HTTPStatusCode(400, "Could not load json object.")

    if headers['X-Github-Event'] == 'push':
        # add a new item to the test queue
        add_push(obj)
    else:
        return tangelo.HTTPStatusCode(400, "Unhandled event")

    return 'OK'


def main():
    '''
    On commandline call, get all queued tests, run them, and set the status.
    '''

    db = mongo_database()
    queue = db['queue']

    for item in queue.find():
        run_test(item)
        queue.remove(item)


if __name__ == '__main__':
    main()
