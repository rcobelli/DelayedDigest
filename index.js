"use strict";

var AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Configure the S3 bucket and key prefix for stored raw emails, and the
// mapping of email addresses to forward from and to.
//
// Expected keys/values:
//
// - fromEmail: Forwarded emails will come from this verified address
//
// - subjectPrefix: Forwarded emails subject will contain this prefix
//
// - emailBucket: S3 bucket name where SES stores emails.
//
// - emailKeyPrefix: S3 key name prefix where SES stores email. Include the
//   trailing slash.
//
// - forwardMapping: Object where the key is the lowercase email address from
//   which to forward and the value is an array of email addresses to which to
//   send the message.
//
//   To match all email addresses on a domain, use a key without the name part
//   of an email address before the "at" symbol (i.e. `@example.com`).
//
//   To match a mailbox name on all domains, use a key without the "at" symbol
//   and domain part of an email address (i.e. `info`).
var defaultConfig = {
    fromEmail: process.env.SenderEmail,
    subjectPrefix: "[DD]",
    emailBucket: process.env.BucketName,
    emailKeyPrefix: "",
    toEmail: process.env.DestinationEmail
};

/**
 * Processes the message data, making updates to recipients and other headers
 * before forwarding message.
 *
 * @param {object} data - Data bundle with context, email, etc.
 *
 * @return {object} - Promise resolved with data.
 */
exports.processMessage = function(data) {
    var match = data.emailData.match(/^((?:.+\r?\n)*)(\r?\n(?:.*\s+)*)/m);
    var header = match && match[1] ? match[1] : data.emailData;
    var body = match && match[2] ? match[2] : '';

    // SES does not allow sending messages from an unverified address,
    // so replace the message's "From:" header with the original
    // recipient (which is a verified domain)
    header = header.replace(
        /^From: (.*(?:\r?\n\s+.*)*)/mg,
        "From: <noreply@rybel-llc.com>");

    // Add a prefix to the Subject
    if (data.config.subjectPrefix) {
        header = header.replace(
            /^Subject: (.*)/mg,
            function(match, subject) {
                return 'Subject: ' + data.config.subjectPrefix + subject;
            });
    }

    // Replace original 'To' header with a manually defined one
    if (data.config.toEmail) {
        header = header.replace(/^To: (.*)/mg, () => 'To: ' + data.config.toEmail);
    }

    // Remove the Return-Path header.
    header = header.replace(/^Return-Path: (.*)\r?\n/mg, '');

    // Remove Sender header.
    header = header.replace(/^[Ss]ender: (.*)\r?\n/mg, '');

    // Remove Message-ID header.
    header = header.replace(/^Message-ID: (.*)\r?\n/mig, '');

    // Remove all DKIM-Signature headers to prevent triggering an
    // "InvalidParameterValue: Duplicate header 'DKIM-Signature'" error.
    // These signatures will likely be invalid anyways, since the From
    // header was modified.
    header = header.replace(/^DKIM-Signature: .*\r?\n(\s+.*\r?\n)*/mg, '');
    
    
    data.log({ level: "error", message: header });

    data.emailData = header + body;
    return Promise.resolve(data);
};

/**
 * Send email using the SES sendRawEmail command.
 *
 * @param {object} data - Data bundle with context, email, etc.
 *
 * @return {object} - Promise resolved with data.
 */
exports.sendMessage = function(data) {
    var params = {
        Destinations: [data.config.toEmail],
        Source: data.config.fromEmail,
        RawMessage: {
            Data: data.emailData
        }
    };
    data.log({ level: "info", message: "sendMessage: Sending email via SES. " + "Message to: " + data.config.toEmail + "." });
    return new Promise(function(resolve, reject) {
        data.ses.sendRawEmail(params, function(err, result) {
            if (err) {
                data.log({
                    level: "error",
                    message: "sendRawEmail() returned error.",
                    error: err,
                    stack: err.stack
                });
                return reject(new Error('Error: Email sending failed.'));
            }
            data.log({
                level: "info",
                message: "sendRawEmail() successful.",
                result: result
            });
            resolve(data);
        });
    });
};

/**
 * Handler function to be invoked by AWS Lambda with an inbound SES email as
 * the event.
 *
 * @param {object} event - Lambda event from inbound email received by AWS SES.
 * @param {object} context - Lambda context object.
 * @param {object} callback - Lambda callback object.
 * @param {object} overrides - Overrides for the default data, including the
 * configuration, SES object, and S3 object.
 */
exports.handler = function(event, context, callback, overrides) {
    var steps = [
        // exports.fetchMessage,
        exports.processMessage,
        exports.sendMessage
    ];

    var data = {
        event: event,
        callback: callback,
        context: context,
        config: overrides && overrides.config ? overrides.config : defaultConfig,
        log: overrides && overrides.log ? overrides.log : console.log,
        ses: overrides && overrides.ses ? overrides.ses : new AWS.SES(),
        s3: overrides && overrides.s3 ? overrides.s3 : new AWS.S3({ signatureVersion: 'v4' }),
        emailMessageId: ""
    };

    console.log(`Batch process triggered at ${event.time}`);

    // Get a list of current files in the bucket
    s3.listObjects({
            'Bucket': data.config.emailBucket,
            'MaxKeys': 100,
            'Prefix': ''
        }).promise()
        .then(s3Data => {
            let numFiles = s3Data.Contents.length;
            let successCount = 0;
            let failedCount = 0;

            data.log(`${numFiles} files found to process`);

            if (numFiles === 0) {
                // There are no files to process. So notify that.
                console.log("No files to process");
                return data.callback(new Error("Error: No files to process"));
            }

            // For each file, execute the processing
            s3Data.Contents.forEach(file => {
                console.log(`Processing File : ${file.Key}`);

                // Load the raw email from S3
                s3.getObject({
                    Bucket: data.config.emailBucket,
                    Key: file.Key
                }, function(err, result) {
                    if (err) {
                        data.log({
                            level: "error",
                            message: "getObject() returned error:",
                            error: err,
                            stack: err.stack
                        });
                        return data.callback(new Error("Error: Failed to load object."));
                    }
                    data.emailData = result.Body.toString();
                    
                    Promise.series(steps, data)
                    .then(function(data) {
                        // After the processing, delete the file
                        s3.deleteObject({
                            'Bucket': data.config.emailBucket,
                            'Key': file.Key
                        }, (err, data) => {
                            if (err) {
                                console.log(`Failed to delete file : ${file.Key}`, err, err.stack);
                                failedCount++;
                            }
                            else {
                                console.log(`Successfully deleted file ${file.Key}`);
                                successCount++;
                            }

                            if ((successCount + failedCount) === numFiles) {
                                // This is the last file. So send the notification.
                                let message = `Processing finished. ${successCount} successful and ${failedCount} failed`;
                                console.log(message);
                                if (failedCount > 0) {
                                    return data.callback(new Error("Error: Failed to process at least one file"));
                                }
                            }
                        });
                    })
                    .catch(function(err) {
                        console.log({ level: "error", message: "Step returned error: " + err.message, error: err, stack: err.stack });
                        return data.callback(new Error("Error: Step returned error."));
                    });
                });
            });
        })
        .catch(err => {
            console.log("Failed to get file list", err, err.stack); // an error occurred
            let message = `Message processing failed due to : ${err}`;
            console.log(message);
        });
};

Promise.series = function(promises, initValue) {
    return promises.reduce(function(chain, promise) {
        if (typeof promise !== 'function') {
            return Promise.reject(new Error("Error: Invalid promise item: " +
                promise));
        }
        return chain.then(promise);
    }, Promise.resolve(initValue));
};