import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ServerConfig {
  listenAddress: string;
  listenPort: number;
  maxConcurrentThreads: number;
  maxPendingConnections: number;
  enableCron: boolean;
  customRulesets: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  accessToken?: string;
  apiMode?: boolean;
}

const defaultConfig: ServerConfig = {
  listenAddress: '0.0.0.0',
  listenPort: 25500,
  maxConcurrentThreads: 4,
  maxPendingConnections: 32,
  enableCron: false,
  customRulesets: [],
  logLevel: 'info',
};

/**
 * Load configuration from INI file
 */
export function loadINIConfig(path: string): Partial<ServerConfig> {
  if (!existsSync(path)) {
    return {};
  }

  const content = readFileSync(path, 'utf-8');
  const config: Partial<ServerConfig> = {};

  const lines = content.split(/[\r\n]+/);
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      continue;
    }

    // Section header
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase();
      continue;
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase();
      const value = kvMatch[2].trim();

      if (currentSection === 'server' || currentSection === 'common') {
        if (key === 'listenaddress' || key === 'listen_address') {
          config.listenAddress = value;
        } else if (key === 'listenport' || key === 'listen_port') {
          config.listenPort = parseInt(value, 10);
        } else if (key === 'maxconcurrentthreads' || key === 'max_concurrent_threads') {
          config.maxConcurrentThreads = parseInt(value, 10);
        } else if (key === 'loglevel' || key === 'log_level') {
          config.logLevel = value as ServerConfig['logLevel'];
        } else if (key === 'accesstoken' || key === 'access_token') {
          config.accessToken = value;
        } else if (key === 'apimode' || key === 'api_mode') {
          config.apiMode = value.toLowerCase() === 'true';
        }
      }
    }
  }

  return config;
}

/**
 * Load configuration from YAML file
 */
export function loadYAMLConfig(path: string): Partial<ServerConfig> {
  if (!existsSync(path)) {
    return {};
  }

  const content = readFileSync(path, 'utf-8');

  // Simple YAML parsing for basic config
  const config: Partial<ServerConfig> = {};
  const lines = content.split(/[\r\n]+/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const kvMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase();
      const value = kvMatch[2].trim();

      if (key === 'listenaddress' || key === 'listen_address') {
        config.listenAddress = value;
      } else if (key === 'listenport' || key === 'listen_port') {
        config.listenPort = parseInt(value, 10);
      } else if (key === 'maxconcurrentthreads' || key === 'max_concurrent_threads') {
        config.maxConcurrentThreads = parseInt(value, 10);
      } else if (key === 'loglevel' || key === 'log_level') {
        config.logLevel = value as ServerConfig['logLevel'];
      } else if (key === 'accesstoken' || key === 'access_token') {
        config.accessToken = value;
      } else if (key === 'apimode' || key === 'api_mode') {
        config.apiMode = value.toLowerCase() === 'true';
      }
    }
  }

  return config;
}

/**
 * Load configuration from TOML file
 */
export function loadTOMLConfig(path: string): Partial<ServerConfig> {
  if (!existsSync(path)) {
    return {};
  }

  const content = readFileSync(path, 'utf-8');
  const config: Partial<ServerConfig> = {};

  const lines = content.split(/[\r\n]+/);
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Section header
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toLowerCase();
      continue;
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([^=]+)\s*=\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase();
      let value = kvMatch[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (currentSection === 'server' || currentSection === 'common') {
        if (key === 'listenaddress' || key === 'listen_address') {
          config.listenAddress = value;
        } else if (key === 'listenport' || key === 'listen_port') {
          config.listenPort = parseInt(value, 10);
        } else if (key === 'maxconcurrentthreads' || key === 'max_concurrent_threads') {
          config.maxConcurrentThreads = parseInt(value, 10);
        } else if (key === 'loglevel' || key === 'log_level') {
          config.logLevel = value as ServerConfig['logLevel'];
        } else if (key === 'accesstoken' || key === 'access_token') {
          config.accessToken = value;
        } else if (key === 'apimode' || key === 'api_mode') {
          config.apiMode = value.toLowerCase() === 'true';
        }
      }
    }
  }

  return config;
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath?: string): ServerConfig {
  const config = { ...defaultConfig };

  // Try to find config file
  const possiblePaths = [
    configPath,
    'pref.toml',
    'pref.yml',
    'pref.yaml',
    'pref.ini',
    join(__dirname, '../../pref.toml'),
    join(__dirname, '../../pref.yml'),
    join(__dirname, '../../pref.ini'),
  ].filter(Boolean) as string[];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      const ext = path.split('.').pop()?.toLowerCase();
      let loadedConfig: Partial<ServerConfig> = {};

      if (ext === 'toml') {
        loadedConfig = loadTOMLConfig(path);
      } else if (ext === 'yml' || ext === 'yaml') {
        loadedConfig = loadYAMLConfig(path);
      } else if (ext === 'ini') {
        loadedConfig = loadINIConfig(path);
      }

      // Merge loaded config with default
      Object.assign(config, loadedConfig);
      console.log(`Loaded configuration from: ${path}`);
      break;
    }
  }

  // Override with environment variables
  const envPort = process.env.PORT;
  const envHost = process.env.HOST;
  const envToken = process.env.API_TOKEN;
  const envApiMode = process.env.API_MODE;

  if (envPort) {
    config.listenPort = parseInt(envPort, 10);
  }
  if (envHost) {
    config.listenAddress = envHost;
  }
  if (envToken) {
    config.accessToken = envToken;
  }
  if (envApiMode) {
    config.apiMode = envApiMode.toLowerCase() === 'true';
  }

  return config;
}
