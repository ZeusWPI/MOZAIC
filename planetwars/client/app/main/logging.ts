import * as log from 'electron-log';

/**
 * Set up log levels for dev and production, and allow ENV variables
 * configuration.
 */
export function setupLogging() {
  const { file, rendererConsole, logS } = log.transports;
  const mainConsole = log.transports.console;

  // In dev, set log level to debug for all transports (except remote)
  if (process.env.NODE_ENV === 'development') {
    rendererConsole.level = "debug";
    mainConsole.level = "debug";
    file.level = "debug";
    logS.level = false;

    // In prod, set log level to verbose for all transports (except remote)
  } else {
    rendererConsole.level = "verbose";
    mainConsole.level = "verbose";
    file.level = "info";
    logS.level = false; // TODO: Would be cool to have a Sentry endpoint here
  }

  // Set log level for all transports
  if (process.env.BB_LOG_LEVEL) {
    setLogLevelFromEnv(rendererConsole, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(mainConsole, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(file, process.env.BB_LOG_LEVEL);
    setLogLevelFromEnv(logS, process.env.BB_LOG_LEVEL);
  }

  // Allow specific transport log levels to be controlled with env vars;
  setLogLevelFromEnv(rendererConsole, process.env.BB_LOG_LEVEL_CONSOLE);
  setLogLevelFromEnv(mainConsole, process.env.BB_LOG_LEVEL_WEB);
  setLogLevelFromEnv(file, process.env.BB_LOG_LEVEL_FILE);
  setLogLevelFromEnv(logS, process.env.BB_LOG_LEVEL_REMOTE);

  log.debug("[STARTUP] Logging configured");
  log.debug("[STARTUP] Debug logging main process activated");
  log.verbose("[STARTUP] Verbose logging main process activated");
}

function setLogLevelFromEnv(transport: log.ITransport, envVar: string | undefined): void {
  const logLevels = ['silly', 'debug', 'verbose', 'info', 'warn', 'error'];
  if (envVar !== undefined && envVar !== "") {
    if (envVar === 'false') {
      transport.level = false;
      return;
    }
    if (logLevels.includes(envVar)) {
      transport.level = envVar as log.LevelOption;
      return;
    }
  }
}
