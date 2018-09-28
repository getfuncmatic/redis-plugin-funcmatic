require('dotenv').config()
var funcmatic = require('@funcmatic/funcmatic')
var RedisPlugin = require('../lib/redis')

// var handler = Funcmatic.wrap(async (event, context, { mysql }) => {
//   await mysql.query('DELETE FROM users')
//   var user = { 
//     id: "TEST-USER-ID", 
//     created_at: new Date(), 
//     updated_at: new Date() 
//   }
//   var insertRes = await mysql.query('INSERT INTO users SET ?', user)
//   var q = { id: "TEST-USER-ID" }
//   var selectRes = await mysql.query('SELECT * FROM users WHERE ?', q)
//   var deleteRes = await mysql.query('DELETE FROM users WHERE ?', { id: "TEST-USER-ID" } )
//   return {
//     statusCode: 200,
//     insertRes, selectRes
//   }    
// })

describe('Connection and Connection Caching', () => {
  var plugin = null
  beforeEach(async () => {
    funcmatic.clear()
    funcmatic = funcmatic.clone()
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })
  it ('should create and cache connection to redis service', async () => {
    funcmatic.use(RedisPlugin, {
      uri: process.env.REDIS_ENDPOINT,
      password: process.env.REDIS_PASSWORD,
      cache: true
    })
    plugin = funcmatic.getPlugin('redis')
    var event = { }
    var context = { }
    var conn1_id = null
    var conn2_id = null
    await funcmatic.invoke(event, context, async (event, context, { redis }) => {
      expect(redis).toBeTruthy()
      expect(redis.isConnected()).toBeFalsy()
      var conn = await redis.connect()
      conn1_id = conn.client.connection_id
    })
    await funcmatic.invoke(event, context, async (event, context, { redis }) => {
      expect(redis).toBeTruthy()
      expect(redis.isConnected()).toBeTruthy()
      var conn = await redis.connect()
      conn2_id = conn.client.connection_id
    })
    expect(conn1_id == conn2_id).toBeTruthy()
  })

  it ('should create and uncached connection to redis service', async () => {
    funcmatic.use(RedisPlugin, {
      uri: process.env.REDIS_ENDPOINT,
      password: process.env.REDIS_PASSWORD,
      cache: false
    })
    plugin = funcmatic.getPlugin('redis')
    var event = { }
    var context = { }
    var conn1_id = null
    var conn2_id = null
    await funcmatic.invoke(event, context, async (event, context, { redis }) => {
      expect(redis).toBeTruthy()
      expect(redis.isConnected()).toBeFalsy()
      var conn = await redis.connect()
      conn1_id = conn.client.connection_id
    })
    await funcmatic.invoke(event, context, async (event, context, { redis }) => {
      expect(redis).toBeTruthy()
      expect(redis.isConnected()).toBeFalsy()
      var conn = await redis.connect()
      conn2_id = conn.client.connection_id
    })
    expect(conn1_id != conn2_id).toBeTruthy()
  })
}) 

describe('Basic redis operations', () => {
  var plugin = null
  beforeEach(async () => {
    funcmatic.clear()
    funcmatic = funcmatic.clone()
    funcmatic.use(RedisPlugin, {
      uri: process.env.REDIS_ENDPOINT,
      password: process.env.REDIS_PASSWORD,
      cache: true
    })
  })
  afterEach(async () => {
    await funcmatic.teardown()
  })
  it ('should perform basic redis operations get, set, del', async () => {
    var event = { }
    var context = { }
    await funcmatic.invoke(event, context, async (event, context, { redis }) => {
      var conn = await redis.connect()
      var key = '/my/key'
      var value = JSON.stringify({hello: "world"})
      var setRes = await conn.set(key, value)
      expect(setRes).toBe("OK")
      var data = await conn.get(key)
      expect(JSON.parse(data)).toMatchObject({
        hello: "world"
      })
      var delRes = await conn.del(key)
      expect(delRes).toBe(1)
      data = await conn.get(key)
      expect(data).toBe(null)
    })
  })
}) 