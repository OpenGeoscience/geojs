#!/usr/bin/env python

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
        self._driver = pydas.drivers.CoreDriver(MIDAS_BASE_URL)
        self._communityName = MIDAS_COMMUNITY
        self._community = None

    def _request(self, method, parameters=None, asjson=True):
        '''
        Like pydas.drivers.BaseDriver.request, but without the retry.
        '''
        method_url = self._driver.full_url + method
        request = http.post(
            method_url,
            params=parameters,
            allow_redirects=True,
            verify=False,
            auth=self._driver.auth
        )
        try:
            response = request.json()
        except ValueError:
            response = {
                'data': request.content,
                'stat': 'ok'
            }

        if request.status_code not in (200, 302) or response['stat'] != 'ok':
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
        for item in items:
            if item['name'] == path[-1]:
                return item['item_id']
        raise Exception("Item '%s' not found." % '/'.join(path))

    def getImages(self, path, revision):
        '''
        Download images in an item at the given path and revision.
        '''
        item_id = self.getItem(path)
        item = self._request(
            'midas.item.get',
            {'id': item_id}
        )
        images = []
        revisions = item['revisions']
        if revision >= len(revisions) or revision < 0:
            raise Exception("Invalid revision number.")

        for bitstream in revisions[revision]['bitstreams']:
            data = self._request(
                'midas.bitstream.download',
                {'id': bitstream['bitstream_id']}
            )
            images.append(Image.open(StringIO(data)))
        return images


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
