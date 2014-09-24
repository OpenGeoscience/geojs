Github dashboard services
=========================

This is some basic (and terse) instructions for setting up a dashboard
server that responds to Github webhooks for running dashboard tests
on demand.

You will need to choose several parameters that will be used in the
configuration.

Variable   | Description
-----------|------------
`PORT`     | Local web server port
`SUBDOMAIN`| ngrok subdomain
`WEBROOT`  | Path to this directory


Setup
-----

1.  Install [MongoDB](http://www.mongodb.org/).
2.  Install [ngrok](https://ngrok.com/)
3.  Create a free ngrok account.
4.  Install python requirements, `pip install -r requirements.txt`.


Create a personal access token and webhook token
------------------------------------------------

On github, under account settings -> Applications, generate a new
personal access token with `repo:status` scope.  In your repository
settings page under Webhooks & Services, add a webhook with payload URL,
`http://${SUBDOMAIN}.ngrok.com/main` and a secret token.  Now save these
tokens in a file called `~/.geojs_dashboard_config.json`.
```
{
  "dashboard_key": "<your user token>",
  "hook_key": "<your webhook secret token>"
}
```


Configure your system
---------------------

Start tangelo:
```
tangelo --port ${PORT} --root ${WEBROOT} start
```

Create your ngrok config with authentication information as
described at [https://ngrok.com/dashboard](https://ngrok.com/dashboard),
then modify `~/.ngrok` to contain the following:
```
tunnels:
  github:
    subdomain: "${SUBDOMAIN}"
    proto:
      http: "${PORT}"
```

Start your ngrok tunnel.
```
ngrok -log=stdout start github >& ngrok.log
```

Test that everything is working.
```
>>> curl http://${SUBDOMAIN}.ngrok.com/main
I hear you!
```


What now?!
----------

Your system is now receiving webhooks from Github.  All pushes are being queued in
a mongo database `geojs_dashboard` in the collection `queue`.  The `main.py` script
also acts as test runner that will run all tests currently queued.  Once you have
an item in your queue, you can run the test with `python main.py`.  The test will
run, then it will submit the results to cdash, update the commit status in github
and delete the queue item.
