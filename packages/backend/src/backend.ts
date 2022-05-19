import { Express } from "express"
import * as express from "express"
import * as path from "path"
import { ParsedArgs } from "minimist"
import * as minimist from "minimist"
import { Ball } from ":/common/src/common"

export { }

enum Profile {
  DEV = "dev", PROD = "prod"
}

interface Params {
  readonly profile: Profile
  readonly staticDir: string
  readonly mainPagePath: string
  readonly host?: string
  readonly port: number
  readonly instanceId: string
}

function buildParams(args: ParsedArgs): Params {
  let staticDir = args.staticDir ?? "./static/"
  return {
    profile: args.profile ?? Profile.PROD,
    staticDir: staticDir,
    mainPagePath: args.mainPagePath ?? path.resolve(staticDir, "frontend.html"),
    host: args.host ?? null,
    port: args.port ?? 3000,
    instanceId: args.instanceId ?? "gen_" + ~~(Math.random() * 999999999),
  }
}

const params = buildParams(minimist(process.argv.slice(2)))

console.debug("Backend started with params: ", params);

const app: Express = express()

app.use(express.static(params.staticDir))

app.get("/", (req, res) => {
  res.sendFile(params.mainPagePath)
})

app.get("/api/test", (req, res) => {
  res.send({
    field1: "Test JSON object",
    params: params
  })
})

if (params.profile === Profile.DEV) {
  app.get("/dev/instanceId", (req, res) => {
    res.status(200).send(params.instanceId + "")
  })
}

let server = app.listen(params.port, params.host ?? "")
console.log(`🚀 Server listening at http://${params.host ?? "localhost"}:${params.port}`)

console.log(new Ball())
