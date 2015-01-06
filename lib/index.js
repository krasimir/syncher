/*
ops = {
  packageFile: '...',
  modules: [],
  suppressErrors: true | false
}
*/

var _ = require('lodash');
var semver = require('semver');
var npm = require('npm');

var fs = require('fs');
var path = require('path');
var defaults = {
  root: process.cwd() + '/node_modules',
  packagejson: process.cwd() + '/package.json',
  suppressErrors: true,
  checkingInterval: 1000 * 4
};

var initializeNPM = function(cb) {
  npm.load({
    'silent': true
  }, cb);
};

var updatePackageJSON = function(file, module, version) {
  var json = require(file);
  if(json.dependencies && json.dependencies[module]) {
    json.dependencies[module] = version;
  }
  if(json.devDependencies && json.devDependencies[module]) {
    json.devDependencies[module] = version;
  }
  fs.writeFile(file, JSON.stringify(json, null, 2), function(err) {
    if(err) console.log('[Syncher] Error saving package.json', err);
  });
};

var installPackage = function(module, version, packagejson, cb) {
  var m = semver.valid(version) ? module + '@' + version : version;
  npm.commands.install([m], function(err, data) {
    if(err) {
      console.log('[Syncher] installing ' + module + ' failed', err);
    } else {
      console.log('[Syncher] installing ' + module + ' succeeded');
      updatePackageJSON(packagejson, module, version);
      cb();
    }
  });
};

module.exports = function (ops) {

    var options = _.merge(defaults, ops || {});

    var error = function(msg) {
      if(!options.suppressErrors) {
        throw new Error(msg);  
      } else {
        console.log('[Syncher] Error: ' + msg);
      }
      return false;
    }

    if(typeof options.modules === 'undefined') { return error('Missing `options.modules` property.'); }

    var dependencies = [];
    var root = path.normalize(options.root);
    var packagejson = path.normalize(options.packagejson);

    if(!fs.existsSync(root)) { 
      return error('There is no directory: ' + options.root + '. Please set the `root` option.'); 
    }
    if(!fs.existsSync(packagejson)) { 
      return error(packagejson + ' is missing. Please set the `packagejson` option.'); 
    }

    initializeNPM(function() {

      // getting the modules placed in node_modules directory
      var installedModules = _.map(fs.readdirSync(root), function(d) { return { name: d }; });

      // looping through the installed modules and finding the ones that we have to check
      dependencies = _.map(_.filter(installedModules, function(d) {
        return _.filter(options.modules, function(m) {
          return m.name === d.name;
        }).length > 0;
      }), function(d) {

        var loop = function() {
          d.interval = setTimeout(update, options.checkingInterval);
        }

        // checking the current and the latest version
        // installation if needed
        var update = function() {
          npm.commands.outdated(d.name, '--silent', function(err, data) {
            if(err) { error('npm can\'t get info for ' + d.name); return; };

            // the module is not in the registry or no need of updating
            if(data.length === 0) {
              var m = _.filter(options.modules, function(m) { return m.name === d.name; });
              if(m[0] && m[0].url) {
                installPackage(d.name, m[0].url, packagejson, loop);
              } else {
                loop();
              }

            // the module is in the registry, comparing the versions
            } else {
              var current = data[0][2];
              var latest = data[0][4];
              if(semver.gt(latest, current)) {
                console.log('[Syncher] installing ' + d.name + ' v' + latest);
                installPackage(d.name, latest, packagejson, loop);
              } else {
                loop();
              }

            }
          });
        };
        update();

        return d;
      });

    });
    
    return {
      dependencies: dependencies
    };
    
};