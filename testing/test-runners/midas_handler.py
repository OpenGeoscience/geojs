#!/usr/bin/env python

import sys
import hashlib
import getpass
from cStringIO import StringIO
from PIL import Image

import requests as http


class MidasHandler(object):
    '''
    Contains several utility function for interacting with
    MIDAS by wrapping api methods and caching the results.
    '''

    def __init__(self,
                 MIDAS_BASE_URL='http://midas3.kitware.com/midas',
                 MIDAS_COMMUNITY='geojs'):
        '''
        Initialize private variables.

        :param string MIDAS_BASE_URL: URL of the midas server.
        :param string MIDAS_COMMUNITY: The community name on the server.
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

        >>> midas.community()
        {
            u'admingroup_id': u'121',
            u'can_join': u'1',
            u'community_id': u'40',
            u'creation': u'2014-06-02 11:38:38',
            u'description': u'',
            u'folder_id': u'11361',
            u'membergroup_id': u'123',
            u'moderatorgroup_id': u'122',
            u'name': u'GeoJS',
            u'privacy': u'0',
            u'uuid': u'538c9a7ead4a21c3b3e4e52724b3e6949487279edfad3',
            u'view': u'68'
        }

        :return: MIDAS response object.
        :rtype: dict
        '''
        if self._community is None:
            self._community = self._request(
                'midas.community.get',
                {'name': self._communityName}
            )
        return self._community

    def getFolder(self, name, root=None):
        '''
        Get a folder named ``name`` under ``root``.  If no root
        is given, use the community root.

        >>> midas.getFolder('Testing')
        u'11364'
        >>> midas.getFolder('data', '11364')
        u'11373'

        :param string name: The folder name to find.
        :param string root: The id of the root folder.
        :returns: The id of the folder.
        :rtype: string
        :raises Exception: If the folder is not found.
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
        Get an item at the given path.  If no root is specified, use the
        community root.

        >>> midas.getItem(('Testing', 'data', 'cities.csv'))
        {
            u'date_creation': u'2014-06-02 15:26:12',
            ...
            u'view': u'2'
        }

        :param tuple path: The relative path from ``root``.
        :param string root: The id of the root folder.
        :return: MIDAS response object
        :rtype: dict
        :raises Exception: If the item is not found.
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

        >>> .getImages(('Testing', 'test', 'selenium', 'osmLayer', 'firefox', 'osmDraw.png'), 2)
        [<PIL.PngImagePlugin.PngImageFile image mode=RGBA size=640x390 at 0x1019E9200>]

        :param tuple path: The relative path from the community root.
        :param int revision: The item revision to download.
        :return: List of `Image`_.
        :raises Exception: If the path or revision is not found.

        .. _Image: http://pillow.readthedocs.org/en/latest/reference/Image.html#PIL.Image.Image
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
        are not provided, they must be entered in stdin.  The token
        is cached internally, so the user will only be prompted
        once after a successful login.  Alternatively, an apiKey
        can be provided as login credentials.

        :param string email: The user's email address.
        :param string password: The user's password.
        :param string apiKey: The user's api key.
        :rtype: string
        :return: The login token.
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
                    password = None
                    print "Could not log in with the provided information."

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
        Create an empty item at the given path if none exists
        otherwise return the item.  This
        method will create folders as necessary while traversing
        the path.

        :param tuple path: The relative path from the community root.
        :return: MIDAS response object
        :rtype: dict
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

        :param string fileData: The raw file contents to upload.
        :param tuple path: The relative path to the item.
        :param int revision: The revision number to append the file to.
        :raises Exception: If the upload fails for any reason.
        :returns: MIDAS response object
        :rtype: dict
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
