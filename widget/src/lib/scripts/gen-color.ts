import colors from '../../colors.json';

for(const p of Object.entries(colors.colors)) {
    console.log(`--color-${p[0].replace(/_/g, '-')}: ${p[1].dark.color};`);
}

export {};