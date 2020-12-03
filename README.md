### koa-booster
- Usage
  - install koa
  - install koa-booster
  - instance and start
  ```
  const Koa = require('koa')
  const app = new Koa()
  module.exports = require('koa-boost')(app)
  ```
- Options
  ```
  module.exports = require('koa-boost)(app, {
    //HOST 可选
    host: '127.0.0.1', 
    //PORT 可选
    port: 3001,
    //环境变量，决定配置变量的取值 可选
    env: 'test',
    //中间件 可选
    middlewares: app=>[
      require('koa-static')('public', {
          maxage: 1000 * 60 * 30
        }
      ),
      require('koa-body')(),
      require('koa-session')({
        store : null,
        key: app.config.key
      },app),
      require('./middlewares/m1')({name:'rename'}),
      require('./middlewares/m2')(),
    ],
  })
  ```
- Structure
  - router 路由
  - controller 控制器
  - service 数据查询
  - middlewares 中间件
  - utils 工具模块
  - config 配置
  - app.js
- App
  > router, controller, service, utils, config
  ```
  app.{模块名称}.{方法名}()

  app.{模块名称}.{变量名}
  ```
- Context
  > controller, service, utils, config
  ```
  ctx.{模块名称}.{方法名}()

  ctx.{模块名称}.{变量名}
  ```
- Config
  - config.js 默认配置文件
  - config.{env}.js 当前环境配置文件(会与默认配置文件合并生成最终config)