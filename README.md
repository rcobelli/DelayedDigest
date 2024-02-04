# Delayed Digest
##### Get your periodic email newsletters delivered all at once.

## What it is
I, like many others, subscribe to a number of weekly newsletters that are delivered by email. They arrive at random hours throughout the week which can make it difficult to find time to read all of them, or they continue to clutter up my inbox. The solution was to build DelayedDigest!

DelayedDigest is a system where all the emails are delivered to an AWS SES email address and stored in a S3 bucket. Once a week at a predetermined time, a Lambda function pulls all the emails from the S3 bucket and sends them to my personal inbox.

## Installation
1. Verify an email address with AWS SES that you own
   - In my case, I send all emails going to the `dev.me.com` to SES while all the emails to `me.com` go to my standard email server
2. Setup a receiving rule where you save all emails to an S3 bucket
3. Update `params.json` to include your specific setup
4. Decide on an S3 bucket name to hold your templates & run `aws s3 create-bucket --bucket <BUCKET NAME>`
5. Run `aws cloudformation package --template-file cfn-template.yml --s3-bucket <STEP 4's BUCKET> --output-template-file template.packaged.yml`
6. Run `aws cloudformation deploy --template-file template.packaged.yml --stack-name DelayedDigest --parameter-overrides file://params.json --capabilities CAPABILITY_NAMED_IAM`

## TODO: 
  1. Create the S3 bucket via CFN
  2. Automatically pull updates from https://github.com/arithmetric/aws-lambda-ses-forwarder
  3. Add a parameter for the schedule cron

## Credit:
The sending logic is adapted from @arithmetric's work at https://github.com/arithmetric/aws-lambda-ses-forwarder