# Syncher

If you are interested in having the latest version of particular Node.js module as dependency Syncher will help you out.

## Installation

`npm install syncher --save`

## Usage

The module normally starts a timer and checks if there is a new version of particular module. Check out the configuration section to modify the default behavior.

```js
var syncher = require('../lib');

syncher({
  modules: [
    { name: 'atomus' }
  ]
});
```

Updating the [atomus](https://www.npmjs.com/package/atomus) dependency to the latest version. Have in mind that Syncher updates your `package.json` file too so you don't have to care about that manually.

## Configuration

The module accepts its configuration as an object in the following format:

```js
{
  modules: [
    { name: '[a name of module registered to the registry]' },
    { name: '[a name of module registered to the registry]', once: true },
    { name: '[a name of module]', url: '[url to a private repository]' }
  ],
  root: '[string]', // Optional. By default `process.cwd() + '/node_modules'`
  packagejson: '[string]', // Optional. By default `process.cwd() + '/package.json'`
  suppressErrors: [Boolean], // Optional. By default `true`
  checkingInterval: [Number], // Optional. By default `1000 * 4`
}
```

If the `once` flag is set to `true` Syncher will perform a check only once and it will everyntually install the module. There is no timer started in this case.

## Testing

```
cd ./test
npm install
node ./test.js
```

