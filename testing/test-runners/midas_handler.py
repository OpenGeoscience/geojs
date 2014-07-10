#!/usr/bin/env python

import sys
import hashlib
import getpass
from cStringIO import StringIO
from PIL import Image

import pydas
import requests as http


class MidasHandler(object):
    '''
    Contains several utility function for interacting with
    MIDAS by wrapping pydas api methods and caching the results.
    '''

    def __init__(self, MIDAS_BASE_URL, MIDAS_COMMUNITY):
        '''
        Initialize private variables.
        '''
        self._apiURL = MIDAS_BASE_URL + '/api/json?method='
        self._communityName = MIDAS_COMMUNITY
        self._community = None
        self._token = None
        self._apiKey = None

    def _request(self, method, parameters=None, asjson=True):
        '''
        Like pydas.drivers.BaseDriver.request, but without the retry.
        '''
        method_url = self._apiURL + method
        request = http.post(
            method_url,
            params=parameters,
            allow_redirects=True,
            verify=False
        )
        try:
            response = request.json()
        except ValueError:
            response = {
                'data': request.content,
                'stat': 'ok'
            }

        if request.status_code not in (200, 302) or response['stat'] != 'ok':
            print >> sys.stderr, str(response)
            raise Exception("Could not complete request to %s." % method)

        return response['data']

    def community(self):
        '''
        Get the id of the GeoJS community.
        '''
        if self._community is None:
            self._community = self._request(
                'midas.community.get',
                {'name': self._communityName}
            )
        return self._community

    def getFolder(self, name, root=None):
        '''
        Get a folder named `name` under `root`.
        '''
        if root is None:
            root = self.community()['community_id']
            children = self._request(
                'midas.community.children',
                {'id': root}
            )['folders']
        else:
            children = self._request(
                'midas.folder.children',
                {'id': root}
            )['folders']
        for folder in children:
            if folder['name'] == name:
                return folder['folder_id']
        raise Exception("Folder '%s' not found in '%s'." % (name, str(root)))

    def getItem(self, path, root=None):
        '''
        Get an item at the given path.
        '''
        for p in path[:-1]:
            root = self.getFolder(p, root)
        items = self._request(
            'midas.folder.children',
            {'id': root}
        )['items']
        item_id = None
        for item in items:
            if item['name'] == path[-1]:
                item_id = item['item_id']
        if item_id is None:
            raise Exception("Item '%s' not found." % '/'.join(path))
        return self._request(
            'midas.item.get',
            {'id': item_id}
        )

    def getImages(self, path, revision):
        '''
        Download images in an item at the given path and revision.
        '''
        item_id = self.getItem(path)['item_id']
        item = self._request(
            'midas.item.get',
            {'id': item_id}
        )
        images = []
        revisions = item['revisions']
        if revision > len(revisions) or revision < 1:
            raise Exception("Invalid revision number.")

        for bitstream in revisions[revision-1]['bitstreams']:
            data = self._request(
                'midas.bitstream.download',
                {'id': bitstream['bitstream_id']}
            )
            images.append(Image.open(StringIO(data)))
        return images

    def login(self, email=None, password=None, apiKey=None):
        '''
        Log into midas and return a token.  If `email` or `password`
        are not provided, they must be entered in stdin.
        '''
        if self._token is None:
            if email is None:
                email = raw_input('email: ')
            nTries = 0

            if apiKey is not None:
                self._apiKey = apiKey

            while self._apiKey is None and nTries < 3:
                if password is None:
                    password = getpass.getpass()
                resp = http.post(
                    self._apiURL + 'midas.user.apikey.default',
                    params={
                        'email': email,
                        'password': password
                    }
                )
                try:
                    self._apiKey = resp.json()['data']['apikey']
                except Exception:
                    print "Could not log in with the provided information."
                    nTries += 1

            resp = http.get(
                self._apiURL + 'midas.login',
                params={
                    'email': email,
                    'apikey': self._apiKey,
                    'appname': 'Default'
                }
            )

            try:
                self._token = resp.json()['data']['token']
            except Exception:
                raise Exception("Could not get a login token.")
        return self._token

    def getOrCreateItem(self, path):
        '''
        Create an empty item at the given path if none exists.
        Return the item's id.
        '''
        token = self.login()
        root = None
        for p in path[:-1]:
            try:
                root = self.getFolder(p, root)
            except Exception:
                root = self._request(
                    'midas.folder.create',
                    {
                        'token': token,
                        'name': p,
                        'reuseExisting': True,
                        'parentid': root
                    }
                )['folder_id']
        try:
            item = self.getItem([path[-1]], root=root)
        except Exception:
            item = self._request(
                'midas.item.create',
                {
                    'token': token,
                    'parentid': root,
                    'name': path[-1],
                }
            )
            item = self.getItem([path[-1]], root=root)

        return item

    def uploadFile(self, fileData, path, revision=None):
        '''
        Uploads a file to the midas server to the given path.
        If revision is not specified, it will create a new revision.
        Otherwise, append the file to the given revision number.
        '''
        item = self.getOrCreateItem(path)
        if revision is not None and len(item['revisions']) < revision:
            revision = None
        token = self.login()
        fileIO = StringIO(fileData)

        # md5 = hashlib.md5()

        ul_token = self._request(
            'midas.upload.generatetoken',
            {
                'token': token,
                'itemid': item['item_id'],
                'filename': path[-1]
            }
        )['token']

        params = {
            'uploadtoken': ul_token,
            'filename': path[-1],
            'length': len(fileData),
        }
        if revision is not None:
            params['revision'] = revision

        resp = http.post(
            self._apiURL + 'midas.upload.perform',
            params=params,
            data=fileIO
        )

        try:
            resp = resp.json()['data']
        except Exception:
            print >> sys.stderr, resp.content
            raise Exception("Could not upload data.")
        return resp

if __name__ == '__main__':

    import sys
    import os

    if len(sys.argv[1:]) != 2:
        'usage: %s <path> <revision>'
        sys.exit(1)

    path = [p for p in sys.argv[1].split('/') if p]
    handler = MidasHandler('http://midas3.kitware.com/midas', 'geojs')
    images = handler.getImages(path, int(sys.argv[2]))

    img_base, img_ext = os.path.splitext(path[-1])
    img_name = img_base + '_%02i' + img_ext
    for i, image in enumerate(images):
        name = img_name % (i + 1)
        print 'Saving image to: "%s"' % name
        image.save(name)
