#!/bin/bash
set -e

AWS_CLI_PROFILE=${1:-default}

echo "Looking for existing CloudFormation S3 bucket..."
BUCKET_NAME=$(aws s3api list-buckets --profile $AWS_CLI_PROFILE --output text --query "Buckets[].[Name]" | grep cf-templates | cat)

if [[ -z "$BUCKET_NAME" ]]; then
   echo "No matches found."
   BUCKET_SUFFIX=$(xxd -l 8 -c 8 -p < /dev/random)
   BUCKET_NAME="cf-templates-${BUCKET_SUFFIX}"
   echo "Creating new bucket..."
   aws s3api create-bucket --bucket $BUCKET_NAME --profile $AWS_CLI_PROFILE
   echo "Done."
fi

echo "Using bucket: ${BUCKET_NAME}.";

echo "Installing production dependencies..."
npm ci --production

echo "Creating deployment.zip (includes index.js, node_modules, package.json, package-lock.json)..."
rm -f deployment.zip
zip -r deployment.zip index.js node_modules package.json package-lock.json -q

# Upload the deployment artifact so the CloudFormation template can reference it
DEPLOYMENT_KEY="deployments/${PWD##*/}-lambda-$(date +%s).zip"
echo "Uploading deployment.zip to s3://${BUCKET_NAME}/${DEPLOYMENT_KEY} ..."
aws s3 cp deployment.zip "s3://${BUCKET_NAME}/${DEPLOYMENT_KEY}" --profile $AWS_CLI_PROFILE

PARAMS=$(jq -r '.Parameters | to_entries[] | "\(.key)=\(.value)"' params.json | xargs)

# Deploy and pass the S3 location to the template parameters (overrides params.json if needed)
aws cloudformation deploy --template-file cfn-template.yml --stack-name DelayedDigest \
  --parameter-overrides $PARAMS DeploymentS3Bucket=${BUCKET_NAME} DeploymentS3Key=${DEPLOYMENT_KEY} \
  --capabilities CAPABILITY_NAMED_IAM --profile $AWS_CLI_PROFILE
