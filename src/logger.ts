import chalk from 'chalk'
import hasColor from 'has-ansi'
import isPromise from 'is-promise'
// @ts-ignore
import jsome from 'jsome'
import _ from 'lodash'

import * as matchers from './matchers'

export enum LogLevel {
  Debug = 'Debug',
  Info = 'Info',
  Warn = 'Warn',
  Error = 'Error',
  Time = 'Time'
}

export class Logger {
  private readonly TRANSFORMERS = [
    this.colorizeDates,
    this.colorizePaths,
    this.colorizeBooleans,
    this.colorizeNumbers,
    this.colorizeObject
  ]

  constructor(private readonly name: string) {}

  public time(key: string, fn: any) {
    const start = +new Date()
    const logTimeEnd = () => this.logTime(key, +new Date() - start)

    const ret = fn()

    if (!isPromise(ret)) {
      logTimeEnd()
      return ret
    }

    return Promise.resolve(ret).then(val => {
      logTimeEnd()
      return val
    })
  }

  private logTime(key: string, totalTime: number) {
    const formattedTime = totalTime > 1000 ? _.round(totalTime / 1000, 1) + 's' : totalTime + 'ms'
    process.env.DEBUG && this.log(LogLevel.Time, key, `(${chalk.bold.green(formattedTime)})`)
  }

  public debug(...args: any[]) {
    process.env.DEBUG && this.log(LogLevel.Debug, ...args)
  }

  public error(...args: any[]) {
    this.log(LogLevel.Error, ...args)
  }

  public info(...args: any[]) {
    this.log(LogLevel.Info, ...args)
  }

  public warn(...args: any[]) {
    this.log(LogLevel.Warn, ...args)
  }

  private colorizeBooleans(str: any) {
    if (hasColor(str)) return str
    return _.isString(str)
      ? str
          .replace(/(\btrue\b)/g, chalk.bold.green(`$1`))
          .replace(/(\bfalse\b)/g, chalk.bold.red(`$1`))
      : str
  }

  private colorizeDates(str: any) {
    if (hasColor(str)) return str

    if (str instanceof Date) str = str.toISOString()

    if (!_.isString(str)) return str

    return str.replace(matchers.TIMESTAMP, chalk.yellow(`$1`))
  }

  private colorizeNumbers(str: any) {
    if (hasColor(str)) return str
    if (!_.isString(str) && !_.isNumber(str)) return str
    return _.toString(str).replace(matchers.NUMBER, chalk.bold.magenta(`$1`))
  }

  private colorizeObject(obj: any) {
    if (!_.isObject(obj)) return obj
    return jsome.getColoredString(obj)
  }

  private colorizePaths(str: any) {
    if (hasColor(str)) return str
    return _.isString(str) ? str.replace(matchers.PATH, chalk.cyan(`$1`)) : str
  }

  private log(logLevel: LogLevel, ...args: any[]) {
    args = _.map(args, arg =>
      _.reduce(
        this.TRANSFORMERS,
        (val, transformer) =>
          _.isString(val)
            ? val
                .split(/\s+/)
                .map(transformer)
                .join(' ')
            : transformer(val),
        arg
      )
    )
    console.log(chalk.dim.yellow(`[${this.name}]`), chalk.dim(`${logLevel}:`), ...args)
  }
}

jsome.level = { show: true, char: '·', color: 'dim', spaces: 2, start: 0 }
jsome.colors = {
  num: 'yellow',
  str: 'green',
  bool: 'green',
  regex: 'red',
  undef: 'grey',
  null: 'grey',
  attr: 'white',
  quot: 'grey',
  punc: 'grey',
  brack: 'grey'
}

export function createLogger(name: string) {
  return new Logger(name)
}
