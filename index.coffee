Resource = require("deployd/lib/resource")
Collection = require "deployd/lib/resources/collection/"

createDomain = (data, errors) ->
  hasErrors = false
  domain =
    error: (key, val) ->
      errors[key] = val or true
      hasErrors = true
      return
    errorIf: (condition, key, value) ->
      domain.error key, value if condition
      return
    errorUnless: (condition, key, value) ->
      domain.errorIf not condition, key, value
      return
    hasErrors: ->
      hasErrors
    hide: (property) ->
      delete domain.data[property]
      return

    this: data
    data: data

  domain

class Collection extends Collection

Collection::find = (ctx, fn) ->
  done = (err, result) ->
    if typeof query.id is "string" and (result and result.length is 0) or not result
      err = err or
        message: "not found"
        statusCode: 404

    return fn(err)  if err
    return fn(null, result[0])  if typeof query.id is "string" and Array.isArray(result)
    fn null, result
    return
  collection = this
  store = @store
  query = ctx.query or {}
  session = ctx.session
  client = ctx.dpd
  errors = {}
  data = undefined
  sanitizedQuery = @sanitizeQuery(query)
  goOn = (err, res) ->
    if err
      done err
    else
      store.find sanitizedQuery, (err, result) ->
        return done(err)  if err
        return done(err, result)  unless collection.shouldRunEvent(collection.events.Get, ctx)
        errors = {}
        if Array.isArray(result)
          remaining = result and result.length
          return done(err, result)  unless remaining
          result.forEach (data) ->

            # domain for onGet event scripts
            domain = createDomain(data, errors)
            collection.events.Get.run ctx, domain, (err) ->
              if err
                if err instanceof Error
                  return done(err)
                else
                  errors[data.id] = err
              remaining--
              unless remaining
                done null, result.filter((r) ->
                  not errors[r.id]
                )
              return
            return
        else
          # domain for onGet event scripts
          data = result
          domain = createDomain(data, errors)
          collection.events.Get.run ctx, domain, (err) ->
            return done(err)  if err
            done null, data
            return
        return
    return

  domain = createDomain(query, errors)
  if collection.shouldRunEvent(collection.events.BeforeGet, ctx)
    collection.events.BeforeGet.run ctx, domain, goOn
  else
    goOn()
  return

Collection.events.push "BeforeGet"

module.exports = Collection