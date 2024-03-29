const path = require('path')
const fs = require('fs')
const mount = require('koa-mount')
const compose = require('koa-compose')
const includedDir = ['middlewares','config', 'controller', 'service', 'utils']
const defaultHost = '127.0.0.1'
const defaultPort = 3000
// const processCwd = process.argv[1].split("/").slice(0,-1).join("/")
let processCwd;

const ctxerBuilder = async (ctx, range, options)=>{
  ctx[range] = Object.create(null)
  let items = await fs.readdirSync( path.join(processCwd, range) )
  items.map((item)=>{ 
    if( range==="config" ){
      if(item.replace('.js','')==="config"){
        ctx[range]= require(path.join(processCwd, `${range}/${item.replace('.js','')}`))
      }
      if(options.env && item.replace('.js','')===`config.${options.env}`){
        ctx[range]=Object.assign( ctx[range], require(path.join(processCwd, `${range}/${item.replace('.js','')}`)) )
      }
    }else if(range==="middlewares"){
      ctx[range][item.replace('.js','')]= require(path.join(processCwd, `${range}/${item.replace('.js','')}`))
    }else{
      let i = require(path.join(processCwd, `${range}/${item.replace('.js','')}`))
      ctx[range][item.replace('.js','')]= typeof(i) === "function"
      ? i(ctx)
      : i
    }
  })
}

const registerCtxer = (app, options)=>{
  app.use(async (ctx, next)=>{
    await Promise.all(includedDir.map( async (item)=>{
      await ctxerBuilder(ctx, item, options)
    }))
    await next()
  })
}

const hangOnApp = (app, range, options)=>{
  app[range] = Object.create(null)
  
  let items = fs.readdirSync( path.join(processCwd, range) )
  items.map((item)=>{ 
    if( range==="config" ){
      if(item.replace('.js','')==="config"){
        app[range]= require(path.join(processCwd, `${range}/${item.replace('.js','')}`))
      }
      if(options.env && item.replace('.js','')===`config.${options.env}`){
        app[range]=Object.assign( {}, app[range], require(path.join(processCwd, `${range}/${item.replace('.js','')}`)) )
      }
    }else if(range==="middlewares"){
      app[range][item.replace('.js','')]= require(path.join(processCwd, `${range}/${item.replace('.js','')}`))
    }else{
      let i = require(path.join(processCwd, `${range}/${item.replace('.js','')}`))
      app[range][item.replace('.js','')]= typeof(i) === "function"
      ? i(app)
      : i
    }
  })
}

const hanging = (app,options)=>{
  includedDir.map( (item)=>{
    hangOnApp(app, item, options)
  })
}

const registerErrorCatcher = (app) => {
  process.on('uncaughtException', function (err) {
    console.error('uncaughtException!')
    console.error(err)
  });
  process.on('exit', function () {
    console.error("exit!")
    console.error(arguments)
  });
  app.on('error', function (err) {
    console.error("应用层面Error!");
    console.error(err);
  });
}

const registerRoutes = function (app, routesDir = path.join(processCwd, 'router'), routesPassed = '/') {

  if (!fs.existsSync(routesDir)) {
    console.error(routesDir + ' not exists')
    return
  }

  if (!fs.statSync(routesDir).isDirectory()) {
    console.error(routesDir + ' is not a Directory')
    return
  }

  let items = fs.readdirSync(routesDir)
  items.forEach(function (data) {
    let itemPath = path.join(routesDir, data)
    if (fs.statSync(itemPath).isDirectory()) {
      if (/^.*\/$/.test(routesPassed)) {
        registerRoutes(app, itemPath, routesPassed + data)
      } else {
        registerRoutes(app, itemPath, routesPassed + '/' + data)
      }
    } else {
      let fileRouteName = data.substr(0, data.length - 3)
      if (/^.*\/$/.test(routesPassed)) {
        useRoutes(app, itemPath, routesPassed + fileRouteName)
      } else {
        useRoutes(app, itemPath, routesPassed + '/' + fileRouteName)
      }
    }
  })
}

const useRoutes = (app, file, url) => {
  app.router = require('koa-router')()
  require(file)(app)
  if (/^.*index$/.test(url)) {
    let urlDefault = url.substr(0, url.length - 6)
    if (urlDefault.length <= 0) {
      urlDefault = '/'
    }
    app.use(mount(urlDefault, app.router.routes() ))
    app.use(mount(url, app.router.routes() ))
  } else {
    app.use(mount(url, app.router.routes() ))
  }
}

const pipeMiddleWares = (app,options)=>{
  if(options.middlewares) app.use(compose(options.middlewares(app)))
}

const pipeMiddleWaresAfterRouter = (app,options)=>{
  if(options.middlewaresAfterRouter) app.use(compose(options.middlewaresAfterRouter(app)))
}

const registerApp = (app, options)=>{
  hanging(app,options)
  registerCtxer(app,options)
  pipeMiddleWares(app,options)
  registerRoutes(app)
  pipeMiddleWaresAfterRouter(app,options)
  registerErrorCatcher(app,options)
}

module.exports = (app, options = false) => {
  let _options = Object.assign({
    host: defaultHost,
    port: defaultPort
  }, options)
  processCwd = _options.baseDir || process.cwd();
  registerApp(app, _options)
  
  app.host = process.env.IP || _options.host;
  app.port = process.env.PORT || _options.port;
  return app.listen(app.port, app.host, () => {
    console.log(`服务启动: ${app.host}:${app.port}`);
  })
}