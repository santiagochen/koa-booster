### koa-booster
- Usage
  - install koa
  - install koa-booster
  - init in App.js
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
- Router示例
  - > /router/index.js index.js会对应为服务根路由: /
  - > /router/demo.js demo.js会对应服务路由: /demo
  ```
  module.exports = (app) =>{
    const { router, controller, middlewares } = app
    router.get('/',  controller.demo.t1 )
    router.get('/class/:id', middlewares.m1({name: 200}), controller.demo.t2 )
    router.post('/classmate/:name', controller.demo.t3 )
  }
  ```
- Controller示例
  ```
  module.exports = {
    async t1(ctx){
      let resp = await ctx.service.demo.t1()
      ctx.body = {
        data: resp,
        h1: ctx.h1,
        h2: ctx.h2,
        h3: ctx.h3
      }
    },
    t2(ctx){
      ctx.body = {
        data: 'classId: '+ctx.params.id
      }
    },
  };
  或传入APP
  module.exports = (app)=>({
    async t1(ctx){
      let data = await ctx.service.demo.t1()
      ctx.body = {
        data: data,
        h1: ctx.h1 + ": add 5+6 : " + ctx.utils.tool.add(5,6),
        h2: ctx.h2 + ": add 2+3 : " + ctx.utils.plus(2,3),
        h3: ctx.h3
      }
    }
  })
  ```
- Service示例
  ```
  module.exports = {
    t1: ()=>{
      let d = 888
      return d
    }
  }
  或传入APP
  module.exports = (app)=>({
    t1(){
      let d = app.config.number * 100
      return d
    },
    t2(params){
      return app.config.knex.from('note').select(["id","name"]).limit(params.size)
    },
    t3(){return 98}
  })
  ```
- Utils示例
  ```
  module.exports = {
    index: (a,b)=>{return a+b}
  }
  或传入APP
  module.exports = (app)=>(a,b)=>{
    return a+b+app.config.number
  }
  module.exports = (app)=>({
    add(a,b){
      return a+b+app.config.number
    },
    minus(a,b){
      return a-b-app.config.number
    }
  })
  ```
- Config示例
  - config.js 默认配置文件
  - config.{env}.js 当前环境配置文件(会与默认配置文件合并生成最终config)
  ```
  module.exports = {
    keys: "key1",
    rules: require('./rules'), //内容太多，独立一个文件
    number: 100
  }
  ```
- Middlewares示例
  ```
  module.exports = (options)=>{
    return async (ctx, next)=>{
      ctx.h1='h1:'+ options.name
      await next()
    }
  }
  ```