const dir = '/data';

let playerMap = null;

function normalizeName(name) {
    return name.replace(/\s*\[.*?\]\s*$/g, '').trim();
}

function buildMap(json) {
    const map = {};
    for (const [key, code] of Object.entries(json)) {
        map[key.toLowerCase()] = code.toUpperCase();
        const normalized = normalizeName(key).toLowerCase();
        if (!map[normalized]) {
            map[normalized] = code.toUpperCase();
        }
    }
    return map;
}

export async function loadPlayerFlags() {
    if (playerMap) {
        return playerMap;
    }

    try {
        const res = await fetch(`${dir}/_players.json`);
        playerMap = buildMap(await res.json());
    } catch {
        playerMap = {};
    }

    return playerMap;
}

export function getCountryCode(name) {
    if (!playerMap || !name) {
        return null;
    }

    const lower = name.toLowerCase();
    if (playerMap[lower]) {
        return playerMap[lower];
    }

    const normalized = normalizeName(name).toLowerCase();
    return playerMap[normalized] ?? null;
}

export function getFlagUrl(name) {
    const code = getCountryCode(name);
    if (!code) {
        return null;
    }

    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
}
