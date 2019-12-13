# Delayed Digest GUI
##### Get all of your weekly newsletters delivered all at once.

<!-- ![Screenshot](screenshot.png) -->

## What it is
I, like many others, subscribe to a number of weekly newsletters that are delivered by email. They arrive at random hours throughout the week which can make it difficult to find time to read all of them or they continue to clutter up my inbox. The solution was to build DelayedDigest!

DelayedDigest is a system where all of the emails are delivered to a AWS SES email address and stored in a S3 bucket. Once a week at a predetermined time, a Lambda function pulls all the emails from the S3 bucket and sends them to my personal inbox.

## Installation
1. Verify a email address with AWS SES that you own
   - In my case, I send all emails going to the `dev.rybel-llc.com` to SES while all the emails to `rybel-llc.com` go to my standard email server
2. Setup a receiving rule where you save all emails to an S3 bucket
   - In the code, this bucket is called `mail-dump`
3. Create a Lambda function using the `.zip` in this repo
4. Setup a CloudWatch event to trigger the lambda function every week
   - I personally get all of mine on Friday afternoon
5. Setup the GUI and obtain the necessary AWS API Key/Token

## GUI
One of the challenges with this model is that many newsletters require you to verify your email address via an email they send. If you don't get that email immediately, that can be an issue. The solution to this issue is the GUI in this repo. It is a simple PHP app that lists all the objects in the bucket and then allows you to view the contents. From there, you can complete the subscription.
