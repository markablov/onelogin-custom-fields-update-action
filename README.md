# GitHub Action to update Custom Fields for users in OneLogin

This action uses specified file to update Custom Fields for users in OneLogin 

## Inputs

### `apiClientId`

**Required** ClientID for OneLogin API

### `apiSecret`

**Required** Secret for OneLogin API

### `valuesFilePath`

**Required** Path to the file that contains values of custom fields for users

### `valuesFileFormat`

**Optional** Format of the file that contains values of custom fields for users.
Only `json5` is supported.

## Example values file
```
[
  {
     // identifier for user
     username: 'john'
     // custom fields, that would by synced
     height: 180,
     size: 'XL'
  },
  {
    // identifier for user
    username: 'jane'
    // custom fields, that would by synced
    height: 150,
    size: 'XXS'
  }
]
```

## Example usage

```
uses: actions/onelogin-custom-fields-update-action@v1.0
with:
  apiClientId: '123abc'
  apiSecret: 'abc123'
  valuesFilePath: '../users.json'
```
