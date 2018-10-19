var redis = require('@funcmatic/simple-redis')

class RedisService {

  constructor(client, conf) {
    this.client = client
    this.conf = conf
    this.conn = null
  }

  isConnected() {
    return (this.conn && this.conn.client.connected)
  }
  
  async connect() {
    if (this.isConnected()) {
      return this.conn
    }
    this.conn = await this.client.connect({
      uri: this.conf.uri,
      password: this.conf.password
    })
    return this.conn
  }

  async quit() {
    if (this.isConnected()) {
      await this.conn.quit()
      this.conn =  null
    }
    return true
  }
}

class RedisPlugin {

 constructor() {
    this.name = 'redis'
    this.cachedClient = null
  }
  
  async start(conf, env) {
    this.name == conf.name || this.name
    this.uri = conf.uri || env.REDIS_ENDPOINT
    this.password = conf.password || env.REDIS_PASSWORD
    if ('cache' in conf) {  // conf.cache could equal false
      this.cache = conf.cache
    } else {
      this.cache =  (env.REDIS_CACHE_CONNECTION && env.REDIS_CACHE_CONNECTION == 'true') || false
    }
    this.service = new RedisService(redis, {
      uri: this.uri,
      password: this.password
    })
  }
  
  async request(event, context) {
    return { service: this.service }
  }

  async end(options) {
    if (options.teardown || !this.cache) {
      return await this.service.quit()
    }
  }
}

module.exports = RedisPlugin