import * as log from 'electron-log';

/**
 * Set up log levels for dev and production, and allow ENV variables
 * configuration.
 */
export function setupLogging(electronProcess: 'main' | 'render') {
  const { file, console: processConsole, remote } = log.transports;

  // In dev, set log level to debug for all transports (except remote)
  if (process.env.NODE_ENV === 'development') {
    // rendererConsole.level = "debug";
    // mainConsole.level = "debug";
    processConsole.level = "debug";
    file.level = "debug";
    remote.level = false;

    // In prod, set log level to verbose for all transports (except remote)
  } else {
    // rendererConsole.level = "verbose";
    // mainConsole.level = "verbose";
    processConsole.level = "verbose";
    file.level = "info";
    remote.level = false; // TODO: Would be cool to have a Sentry endpoint here
  }

  // Set log level for all transports
  if (process.env.BB_LOG_LEVEL) {
    // setLogLevelFromEnv(rendererConsole, process.env.BB_LOG_LEVEL);
    // setLogLevelFromEnv(mainConsole, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(processConsole, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(file, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(remote, process.env.BB_LOG_LEVEL);
  }

  // Allow specific transport log levels to be controlled with env vars;
  // setLogLevelFromEnv(rendererConsole, process.env.BB_LOG_LEVEL_CONSOLE);
  // setLogLevelFromEnv(mainConsole!, process.env.BB_LOG_LEVEL_WEB);
  setLogLevelFromEnv(processConsole, process.env.BB_LOG_LEVEL_CONSOLE);
  setLogLevelFromEnv(file, process.env.BB_LOG_LEVEL_FILE);
  setLogLevelFromEnv(remote, process.env.BB_LOG_LEVEL_REMOTE);

  log.debug(`[STARTUP] Logging configured for ${electronProcess}-process`);
  log.debug(`[STARTUP] Debug logging activated for ${electronProcess}-process`);
  log.verbose(`[STARTUP] Verbose logging activated for ${electronProcess}-process`);
}

function setLogLevelFromEnv(transport: log.ITransport, envVar: string | undefined): void {
  const logLevels = ['silly', 'debug', 'verbose', 'info', 'warn', 'error'];
  if (envVar !== undefined && envVar !== "") {
    if (envVar === 'false') {
      transport.level = false;
      return;
    }
    if (logLevels.includes(envVar)) {
      transport.level = envVar as log.ILevelOption;
      return;
    }
  }
}
