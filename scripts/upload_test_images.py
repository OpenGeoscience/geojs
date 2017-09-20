import girder_client
import os
import sys


def main():
    # Use the API key to authenticate.
    key = os.environ.get('GIRDER_API_KEY')
    if key is None:
        print >>sys.stderr, 'Environment variable GIRDER_API_KEY is blank. Cannot upload images.'
        return 1

    gc = girder_client.GirderClient(host='data.kitware.com', scheme='https')
    # The api key needs scopes of at least
    # ["core.data.write","core.data.read","core.user_info.read"]
    gc.authenticate(apiKey=key)

    # Retrieve the target folder, which should be at ~/Public/Travis\ GeoJS
    user = gc.get('user/me')
    if user is None:
        print >>sys.stderr, 'No user logged in; API key may be bad.'
        return 1
    folder = gc.loadOrCreateFolder('Public', user['_id'], 'user')

    folder = gc.loadOrCreateFolder('Travis GeoJS', folder['_id'], 'folder')

    travis_build_number = os.environ.get('TRAVIS_BUILD_NUMBER')
    folder = gc.loadOrCreateFolder(travis_build_number, folder['_id'], 'folder')

    # If we have a build matrix, this could be of use
    # travis_job_number = os.environ.get('TRAVIS_JOB_NUMBER')
    # folder = gc.loadOrCreateFolder(travis_job_number, folder['_id'], 'folder')

    # Upload the files specified on the command line, creating an item for each
    for imageFile in sys.argv[1:]:
        (dirname, filename) = os.path.split(imageFile)
        size = os.stat(imageFile).st_size
        print dirname, filename
        with open(imageFile, 'rb') as fd:
            gc.uploadFile(
                parentId=folder['_id'], stream=fd, name=filename, size=size,
                parentType='folder')
        print 'uploaded'


if __name__ == '__main__':
    sys.exit(main())
