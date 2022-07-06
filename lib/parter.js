/*
 * Author: Mr-M1M3
 * Project: busboy-promise
 * Description: Turning an event based multipart parser, busboy to promise based
 * Started Written: 5th July, 2022.
 */
import {
    IncomingMessage
} from "http";

import {
    Buffer
} from "buffer";

import busboy from "busboy";

export default async function parter(req, options) {

    if (options) { // if user passes options 

        if (typeof options != 'object') { // it must be an object

            return Promise.reject(`Expected second parameter to be an object containing options for Busboy. Got ${typeof options}`);

        }

    } else { // if user doesn't passes any option

        options = {}; // replace it with an empty object

    }

    if (!options.headers) { // if options object doesn't contain headers
        options.headers = req.headers; // set option.headers to req.headers
    }

    const bb = busboy(options); // instantiate busboy
    
    if (req instanceof Request) { // if req is an instance of Request

        // pipe request body, a readable stream to busboy instance which is an writable stream.
        //NOTE: body of Request instance is a readable stream and in nodejs readable stream `pipeTo` is not available. 
        //Rather, we use `pipe()`;
        req.body.pipe(bb);

    } else if (req instanceof IncomingMessage) { // if req is an instance of node IncomingMessage

        // nodejs IncomingMessage is a stream. 
        // So, it is possible to pipe the whole request object to another stream
        req.pipe(bb);

    } else { // if req is invalid

        return Promise.reject("Expected first argument to be an instance of Request or IncomingMessage");

    }

    return new Promise((acc, rej) => {

        const data = { // an empty object to hold parsed data
            files: {},
            fields: {}
        }

        bb.on("error", busboyError); // when any error happens
        bb.on("file", appendFile); // when a file is received, calls appendFile
        bb.on("field", appendField); // calls appendField when a field is received
        bb.on("fieldsLimit", fieldsLimit); // if more than configured number field is reached
        bb.on("filesLimit", filesLimit); // if more than configured number of file is reached
        bb.on("partsLimit", parseLimit);// if more than configured number of parts received
        bb.on("finish", finishParse); // after finishing parsing

        function appendFile(name, stream, info) {
            // TODO: Process received file

            const bufferArray = []; // empty array to receive buffers


            stream.on("error", streamError); // if any error happens, calls streamError function
            stream.on("data", appendBuffer); // calls appendBuffer when a new chunk is received
            stream.on("limit", fileLimit); // if file is larger than configured size
            stream.on("end", done); // when parsing is done

            function appendBuffer(chunk) { // just pushes new chunk to `bufferArray`
                bufferArray.push(chunk);
            }

            function fileLimit() {
                if (options.errorOnLargerFileSize) { // rejects if `options.errorOnLargerFileSize` set to true
                    rej({
                        message: "file is larger than configured size"
                    });
                } else {
                    // do nothing, or maybe return undefined
                    return;
                }
            }

            function done() {
                let bufferLength = 0; // initially, total buffer length is assumed 0

                for (let _buffer of bufferArray) { // determine the whole length of total buffers
                    bufferLength += _buffer.length;
                }

                // finally
                data.files[name] = {};
                data.files[name].content = Buffer.concat(bufferArray, bufferLength);
                data.files[name].info = info;

            }

            function streamError(error) {

                streamCleanUp(); // removes all the listeners of the stream

                rej({

                    message: `an error happened while reading the stream of file named \`${name}\``,
                    error

                });

            };

            function streamCleanUp() {
                stream.removeListener("data", appendBuffer);
                stream.removeListener("limit", fileLimit);
                stream.removeListener("end", done);
                stream.removeListener("error", streamError);
                cleanUp();
            }
        }

        function appendField(name, value, info) {
            data.fields[name] = {};
            data.fields[name].value = value;
            data.fields[name].info = info;
        }

        function fieldsLimit() {
            if (options.errorOnMoreFields) {
                rej({
                    message: "more than configured `options.limits.fields` received"
                });
            }else{
                //do nothing
                return;
            }
        }

        function filesLimit() {
            if (options.errorOnMoreFiles) {
                rej({
                    message: "more than configured `options.limits.files` received"
                });
            }else{
                //do nothing
                return;
            }
        }

        function parseLimit(){
            if (options.errorOnMoreParts) {
                rej({
                    message: "more than configured `options.limits.parts` received"
                });
            }else{
                //do nothing
                return;
            }
        }

        function finishParse() {
            cleanUp();
            acc(data);
        }

        function busboyError(error) { // if any error happens

            cleanUp(); // 1. remove all listeners

            rej({ // rejects promise
                message: "an error happened in busboy",
                error
            })
        }

        function cleanUp() {
            bb.removeListener("file", appendFile);
            bb.removeListener("finish", finishParse);
            bb.removeListener("error", busboyError);
        }
    });

}