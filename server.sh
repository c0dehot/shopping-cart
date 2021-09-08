#!/bin/bash

nohup node app/mail-manager.js >/dev/null &

while [ 1 ]
do
	echo Starting node server.js
	node server.js >logs/server.log
done

