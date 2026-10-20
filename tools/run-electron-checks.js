'use strict'

const { spawn } = require('child_process')
const path = require('path')
const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE
const memory = process.argv.includes('--memory')
const child = spawn(require('electron'), [path.join(__dirname, memory ? 'measure-memory.js' : 'verify-electron.js'), ...process.argv.slice(2).filter(arg=>arg!=='--memory')], { stdio: 'inherit', env, windowsHide: true })
child.on('error', (error) => { console.error(error); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code === null ? 1 : code })
