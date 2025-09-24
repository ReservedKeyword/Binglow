import { Logger, type ILogObj } from "tslog";

export interface Loggable {
  logger?: AppLogger | undefined;
}

export type AppLogger = typeof logger;

const isProduction = process.env["NODE_ENV"] === "production";

export const logger: Logger<ILogObj> = new Logger({
  name: "Binglow",
  hideLogPositionForProduction: false,
  minLevel: isProduction ? 3 : 0,
  prettyErrorTemplate: "\n{{errorName}} {{errorMessage}}\nError Stack:\n{{errorStack}}",
  prettyErrorStackTemplate: "  • {{fileName}}\t{{method}}\n\t  {{filePathWithLine}}",
  prettyLogTemplate: "{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}\t{{logLevelName}}\t[{{name}}] "
});
