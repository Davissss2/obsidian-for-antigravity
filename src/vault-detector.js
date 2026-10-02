const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Vault Detector for Obsidian
 * Automatically detects Obsidian vaults across Windows, macOS, and Linux
 * without requiring any user tokens or manual input.
 */

function getObsidianConfigPath() {
  const platform = process.platform;
  const home = os.homedir();

  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'obsidian', 'obsidian.json');
  } else if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json');
  } else {
    // Linux / BSD
    const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
    return path.join(configHome, 'obsidian', 'obsidian.json');
  }
}

function detectVaults() {
  const configPath = getObsidianConfigPath();
  const results = {
    configFound: false,
    configPath,
    vaults: [],
    activeVault: null,
  };

  if (!fs.existsSync(configPath)) {
    return results;
  }

  results.configFound = true;

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const data = JSON.parse(raw);

    if (data && data.vaults && typeof data.vaults === 'object') {
      const vaultsList = [];

      for (const [id, info] of Object.entries(data.vaults)) {
        if (!info || !info.path) continue;

        const vaultPath = path.normalize(info.path);
        const exists = fs.existsSync(vaultPath);
        const vaultName = path.basename(vaultPath);

        const vaultItem = {
          id,
          name: vaultName,
          path: vaultPath,
          open: !!info.open,
          ts: info.ts || 0,
          exists,
        };

        if (exists) {
          vaultsList.push(vaultItem);
        }
      }

      // Sort: active/open first, then by timestamp descending
      vaultsList.sort((a, b) => {
        if (a.open && !b.open) return -1;
        if (!a.open && b.open) return 1;
        return (b.ts || 0) - (a.ts || 0);
      });

      results.vaults = vaultsList;
      if (vaultsList.length > 0) {
        // Active vault is the open one, or the most recently used
        results.activeVault = vaultsList.find(v => v.open) || vaultsList[0];
      }
    }
  } catch (err) {
    results.error = err.message;
  }

  return results;
}

function getActiveOrConfiguredVault(configuredPath) {
  if (configuredPath && typeof configuredPath === 'string' && configuredPath.trim() !== '') {
    const cleanPath = path.normalize(configuredPath.trim());
    if (fs.existsSync(cleanPath)) {
      return {
        id: 'custom',
        name: path.basename(cleanPath),
        path: cleanPath,
        open: true,
        exists: true,
        source: 'configured',
      };
    }
  }

  const detection = detectVaults();
  if (detection.activeVault) {
    return {
      ...detection.activeVault,
      source: 'auto-detected',
    };
  }

  return null;
}

/**
 * Ensures a valid vault exists for any user.
 * If no vault is configured or detected, it automatically creates one in the user's
 * Documents folder and registers it with Obsidian so everything works out of the box.
 */
function ensureOrCreateDefaultVault(configuredPath) {
  const existing = getActiveOrConfiguredVault(configuredPath);
  if (existing && existing.exists) {
    return existing;
  }

  // Fallback: Create default Obsidian Vault in Documents
  const documentsDir = path.join(os.homedir(), 'Documents');
  const defaultVaultPath = path.join(documentsDir, 'Obsidian Vault');

  try {
    if (!fs.existsSync(defaultVaultPath)) {
      fs.mkdirSync(defaultVaultPath, { recursive: true });
    }
    const obsConfDir = path.join(defaultVaultPath, '.obsidian');
    if (!fs.existsSync(obsConfDir)) {
      fs.mkdirSync(obsConfDir, { recursive: true });
    }

    // Attempt to register in Obsidian's config if it exists or create it
    const configPath = getObsidianConfigPath();
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    let configData = { vaults: {} };
    if (fs.existsSync(configPath)) {
      try {
        configData = JSON.parse(fs.readFileSync(configPath, 'utf8')) || { vaults: {} };
      } catch (e) {}
    }

    const vaultId = 'ag_' + Date.now().toString(36);
    configData.vaults = configData.vaults || {};
    configData.vaults[vaultId] = {
      path: defaultVaultPath,
      ts: Date.now(),
      open: true,
    };

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');

    return {
      id: vaultId,
      name: 'Obsidian Vault',
      path: defaultVaultPath,
      open: true,
      exists: true,
      source: 'auto-created',
    };
  } catch (err) {
    // Return path anyway even if registration fails
    return {
      id: 'default',
      name: 'Obsidian Vault',
      path: defaultVaultPath,
      open: true,
      exists: fs.existsSync(defaultVaultPath),
      source: 'auto-created',
    };
  }
}

module.exports = {
  getObsidianConfigPath,
  detectVaults,
  getActiveOrConfiguredVault,
  ensureOrCreateDefaultVault,
};
