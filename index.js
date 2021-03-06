// Generated by CoffeeScript 1.9.0
var Collection, Resource, createDomain,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __hasProp = {}.hasOwnProperty;

Resource = require("deployd/lib/resource");

Collection = require("deployd/lib/resources/collection/");

createDomain = function(data, errors) {
  var domain, hasErrors;
  hasErrors = false;
  domain = {
    error: function(key, val) {
      errors[key] = val || true;
      hasErrors = true;
    },
    errorIf: function(condition, key, value) {
      if (condition) {
        domain.error(key, value);
      }
    },
    errorUnless: function(condition, key, value) {
      domain.errorIf(!condition, key, value);
    },
    hasErrors: function() {
      return hasErrors;
    },
    hide: function(property) {
      delete domain.data[property];
    },
    "this": data,
    data: data
  };
  return domain;
};

Collection = (function(_super) {
  __extends(Collection, _super);

  function Collection() {
    return Collection.__super__.constructor.apply(this, arguments);
  }

  return Collection;

})(Collection);

Collection.prototype.find = function(ctx, fn) {
  var client, collection, data, domain, done, errors, goOn, query, sanitizedQuery, session, store;
  done = function(err, result) {
    if (typeof query.id === "string" && (result && result.length === 0) || !result) {
      err = err || {
        message: "not found",
        statusCode: 404
      };
    }
    if (err) {
      return fn(err);
    }
    if (typeof query.id === "string" && Array.isArray(result)) {
      return fn(null, result[0]);
    }
    fn(null, result);
  };
  collection = this;
  store = this.store;
  query = ctx.query || {};
  session = ctx.session;
  client = ctx.dpd;
  errors = {};
  data = void 0;
  sanitizedQuery = this.sanitizeQuery(query);
  goOn = function(err, res) {
    if (err) {
      done(err);
    } else {
      store.find(sanitizedQuery, function(err, result) {
        var domain, remaining;
        if (err) {
          return done(err);
        }
        if (!collection.shouldRunEvent(collection.events.Get, ctx)) {
          return done(err, result);
        }
        errors = {};
        if (Array.isArray(result)) {
          remaining = result && result.length;
          if (!remaining) {
            return done(err, result);
          }
          result.forEach(function(data) {
            var domain;
            domain = createDomain(data, errors);
            collection.events.Get.run(ctx, domain, function(err) {
              if (err) {
                if (err instanceof Error) {
                  return done(err);
                } else {
                  errors[data.id] = err;
                }
              }
              remaining--;
              if (!remaining) {
                done(null, result.filter(function(r) {
                  return !errors[r.id];
                }));
              }
            });
          });
        } else {
          data = result;
          domain = createDomain(data, errors);
          collection.events.Get.run(ctx, domain, function(err) {
            if (err) {
              return done(err);
            }
            done(null, data);
          });
        }
      });
    }
  };
  domain = createDomain(query, errors);
  if (collection.shouldRunEvent(collection.events.BeforeGet, ctx)) {
    collection.events.BeforeGet.run(ctx, domain, goOn);
  } else {
    goOn();
  }
};

Collection.events.push("BeforeGet");

module.exports = Collection;
