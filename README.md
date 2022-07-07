
# Parter

A Promise based version of busboy


## Documentation

Parter uses busboy under the hood. In fact, parter is written to make busboy promise based.
To install parter, run

```bash
yarn add parter
```
or,

```bash
npm install parter
```

Now, you can import it and instantiate it,

```javascript
import parter from 'parter';

async function requestHandler(req, res){
    // other things
    const body = await parter(req);
    // other things
}
```
When we try to log body, we will get an object similar to this

```javascript
{
        fields:{
                name: <String>,
                value: <String>,
                info: <Object>
        },
        files:{
                name: <String>,
                content: <Buffer>,
                info: <Object>
        }
}
```

Notice, we pass in `req` as the first argument. The `req` we pass in must be an instance of
`IncomingMessage` from node `http` module or it can be an instance of `Request` constructor.

You can also pass in an abject as a second parameter. This object is to configure parter. 
As, parter uses `busboy`, this is the same configuration object you would pass
in busboy. But, you can, of course pass additional properties. 

```javascript
options.errorOnMoreFields = <Boolean>
options.errorOnMoreFiles = <Boolean>
options.errorOnMoreParts = <Boolean>
options.errorOnLargerFileSize = <Boolean>
```
- `errorOnMoreFields` 

        Whether to reject if `fieldsLimit` is emitted from busboy

- `errorOnMoreFiles` 

        Whether to reject if `filesLimit` is emitted from busboy

- `errorOnMoreParts`

        Whether to reject if `partsLimit` is emitted from busboy

- `errorOnLargerFileSize` 

        Whether to reject if `limit` is emitted from busboy.
        
## Authors

- [@mr-m1m3](https://www.github.com/mr-m1m3)