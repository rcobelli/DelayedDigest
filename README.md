# Delayed Digest
##### Get your periodic email newsletters delivered all at once.

## What it is
I, like many others, subscribe to a number of weekly newsletters that are delivered by email. They arrive at random hours throughout the week which can make it difficult to find time to read all of them, or they continue to clutter up my inbox. The solution was to build DelayedDigest!

DelayedDigest is a system where all the emails are delivered to an AWS SES email address and stored in a S3 bucket. Once a week at a predetermined time, a Lambda function pulls all the emails from the S3 bucket and sends them to my personal inbox.

## Installation
1. `cp params_example.json params.json`
2. Fill in the params in the JSON file
3. `./deploy.sh`
  - You can optionally provide a single argument to `deploy.sh` with the AWS profile you'd like to use

## TODO: 
  1. Create the S3 bucket via CFN
  2. Automatically pull updates from https://github.com/arithmetric/aws-lambda-ses-forwarder
  3. Add a parameter for the schedule cron

## Credit:
The sending logic is adapted from @arithmetric's work at https://github.com/arithmetric/aws-lambda-ses-forwarder