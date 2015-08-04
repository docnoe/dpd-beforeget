# dpd-beforeget

# DEPRECATED

### Update to latest deployd and use the built-in "beforerequest"

# Old docs in case you want to use it anyway

Adds a `beforeget` event to standard Deployd collections.

## Why
By default Deployd runs the `on get` logic on each result of a get request, even if, for example, the user is not logged in and should not receive any results.

### Example for standard collections
**`ON GET` event**

`cancelUnless(me, "You are not logged in", 401)`

**Front end**
```
dpd.mycollection.get({}, function(res) {
    console.log(res) // res === []
})
```
This would fetch all entries from *mycollection* and check if the user is logged in repeatedly, for **every** result.
Then return an empty result to the user. (or crash)

### With *beforeget*

**`ON BEFOREGET` event**

`cancelUnless(me, "You are not logged in", 401)`

**Front end**
```
dpd.mycollection.get({}, function(res) {
    console.log(res) // res === {"message":"You are not logged in","statusCode":401,"status":401}
})
```
This time, Deployd would immediately cancel the request and return an error message to the user.

