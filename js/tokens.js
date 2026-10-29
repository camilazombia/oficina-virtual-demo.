(async () => {
    'use strict';
    const tokens = [];
    const errors = [];
    let projectSource;
    try {
        projectSource = (await Promise.all(['index.html', 'js/script.js', 'css/styles.css'].map(async path => {
            const response = await fetch(path);
            if (!response.ok) throw new Error(path);
            return response.text();
        }))).join('\n');
    } catch {
        document.querySelector('#token-count').textContent = 'No se pudieron analizar los colores del proyecto. Abre la página desde el servidor local y vuelve a cargarla.';
        return;
    }
    const usedNames = new Set([...projectSource.matchAll(/var\((--[\w-]+)/g)].map(match => match[1]));
    const relevantSelectors = new Set();
    function isUsed(selector) {
        return selector.split(',').some(part => {
            if (/data-bs-theme.*dark/.test(part)) return false;
            const classes = [...part.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(match => match[1]);
            return classes.length ? classes.every(name => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(projectSource)) : /^(body|a|:root|\[data-bs-theme)/.test(part.trim());
        });
    }
    const levels = {
        base: '01 Primitives',
        semantic: '02 Semantic',
        component: '03 Components'
    };
    function classify(token) {
        const globalScope = token.selector.split(',').every(selector => /^(?::root|\[data-bs-theme\s*=\s*["']?(?:light|dark)["']?\])$/.test(selector.trim()));
        if (!globalScope) return 'component';
        return /^--bs-(?:(?:primary|secondary|success|info|warning|danger|light|dark)(?:-|$)|body-|emphasis-|secondary-|tertiary-|link-|code-color|highlight-|border-color|focus-ring-)/.test(token.name) ? 'semantic' : 'base';
    }
    function family(token) {
        if (token.level === 'component') {
            const prefix = token.name.replace(/^--bs-/, '').split('-')[0];
            return ({ btn: 'button', nav: 'navigation', navbar: 'navbar', dropdown: 'dropdown', modal: 'modal', accordion: 'accordion', card: 'card', gutter: 'layout', offcanvas: 'offcanvas' })[prefix] || prefix;
        }
        if (/font|line-height/.test(token.name)) return 'typography';
        if (/shadow/.test(token.name)) return 'effect/shadow';
        if (/focus-ring/.test(token.name)) return 'focus';
        if (/border-radius/.test(token.name)) return 'radius';
        if (/border-color/.test(token.name)) return 'color/border';
        if (/border/.test(token.name)) return 'border';
        if (/breakpoint/.test(token.name)) return 'breakpoint';
        if (/spacing|gutter/.test(token.name)) return 'spacing';
        if (token.level === 'semantic') {
            if (/link/.test(token.name)) return 'color/link';
            if (/bg|highlight-bg/.test(token.name)) return 'color/surface';
            if (/body-color|emphasis-color|secondary-color|tertiary-color|text-emphasis|code-color|highlight-color/.test(token.name)) return 'color/text';
            return 'color/status';
        }
        if (/color|bg|rgb|blue|indigo|purple|pink|red|orange|yellow|green|teal|cyan|black|white|gray|primary|secondary|success|info|warning|danger|light|dark|highlight/.test(token.name)) return 'color';
        return 'other';
    }
    function figmaName(token) {
        let name = token.name.replace(/^--(?:bs-)?/, '');
        if (token.level === 'component') {
            name = name.replace(/^[^-]+-/, '');
            const scope = token.selector.replace(/\[data-bs-theme\s*=\s*["']?(?:light|dark)["']?\]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '');
            return `${token.family}/${scope || 'default'}/${name.replaceAll('-', '/')}`;
        }
        name = name.replace(/^(?:font-|border-radius-?|box-shadow-?|breakpoint-)/, '') || 'default';
        return `${token.family}/${name.replaceAll('-', '/')}`;
    }
    function collect(rules, source, context = []) {
        for (const rule of rules) {
            if (rule.style && rule.selectorText) {
                if (isUsed(rule.selectorText)) {
                    relevantSelectors.add(rule.selectorText);
                    for (const property of rule.style) {
                        if (!property.startsWith('--')) {
                            for (const match of rule.style.getPropertyValue(property).matchAll(/var\((--[\w-]+)/g)) usedNames.add(match[1]);
                        }
                    }
                }
                for (const name of rule.style) {
                    if (!name.startsWith('--')) continue;
                    tokens.push({ name, value: rule.style.getPropertyValue(name).trim() + (rule.style.getPropertyPriority(name) ? ' !important' : ''), selector: rule.selectorText, context: context.join(' · '), source });
                }
            }
            if (rule.cssRules) {
                collect(rule.cssRules, source, [...context, rule.conditionText || rule.name || rule.cssText.split('{')[0].trim()]);
            }
        }
    }
    for (const sheet of document.styleSheets) {
        if (sheet.href && sheet.href.endsWith('/tokens.css')) continue;
        const source = sheet.href && sheet.href.includes('/bootstrap/') ? 'Bootstrap' : 'Proyecto';
        try { collect(sheet.cssRules, source); } catch { errors.push(sheet.href); }
    }
    // Follow aliases so the palette includes the dependencies of used semantic colors.
    let changed = true;
    while (changed) {
        changed = false;
        for (const token of tokens) {
            if (!usedNames.has(token.name) || !relevantSelectors.has(token.selector)) continue;
            for (const match of token.value.matchAll(/var\((--[\w-]+)/g)) {
                if (!usedNames.has(match[1])) { usedNames.add(match[1]); changed = true; }
            }
        }
    }
    function resolveColor(token, seen = new Set()) {
        if (seen.has(token.name)) return '';
        seen.add(token.name);
        return token.value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
            const reference = tokens.find(item => item.name === name && item.selector === token.selector) || tokens.find(item => item.name === name && /:root/.test(item.selector));
            return reference ? resolveColor(reference, new Set(seen)) : '';
        }).replace(/\s*!important$/, '');
    }
    const colors = tokens.filter(token => {
        if (!usedNames.has(token.name) || !relevantSelectors.has(token.selector) || /data-bs-theme.*dark/.test(token.selector) || /-rgb$/.test(token.name)) return false;
        token.resolved = resolveColor(token);
        return Boolean(token.resolved) && CSS.supports('color', token.resolved);
    });
    tokens.splice(0, tokens.length, ...colors);
    for (const token of tokens) {
        token.level = classify(token);
        token.family = family(token);
        token.figmaName = figmaName(token);
        token.mode = /data-bs-theme\s*=\s*["']?dark/.test(token.selector) ? 'Dark' : 'Light / Default';
    }
    const order = Object.keys(levels);
    tokens.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level) || a.family.localeCompare(b.family) || a.name.localeCompare(b.name) || a.selector.localeCompare(b.selector));
    const search = document.querySelector('#token-search');
    const source = document.querySelector('#token-source');
    let selectedLevel = '';
    let selectedFamily = '';
    const groups = document.querySelector('#token-groups');
    const families = document.querySelector('#token-families');
    function filterButton(label, active, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}`;
        button.textContent = label;
        button.setAttribute('aria-pressed', String(active));
        button.addEventListener('click', onClick);
        return button;
    }
    function renderFilters() {
        groups.replaceChildren();
        for (const [key, label] of [['', 'Todos los niveles'], ...Object.entries(levels)]) {
            const count = tokens.filter(token => !key || token.level === key).length;
            groups.append(filterButton(`${label} (${count})`, selectedLevel === key, () => {
                selectedLevel = key;
                selectedFamily = '';
                renderFilters();
                render();
            }));
        }
        const available = tokens.filter(token => !selectedLevel || token.level === selectedLevel);
        const names = [...new Set(available.map(token => token.family))].sort((a, b) => a.localeCompare(b));
        families.replaceChildren();
        for (const name of ['', ...names]) {
            const count = available.filter(token => !name || token.family === name).length;
            families.append(filterButton(`${name || 'Todos los subgrupos'} (${count})`, selectedFamily === name, () => {
                selectedFamily = name;
                renderFilters();
                render();
            }));
        }
    }
    const list = document.querySelector('#token-list');
    function render() {
        const query = search.value.trim().toLowerCase();
        const filtered = tokens.filter(token => (!selectedLevel || selectedLevel === token.level) && (!selectedFamily || selectedFamily === token.family) && (!source.value || source.value === token.source) && `${token.name} ${token.figmaName} ${token.value} ${token.selector} ${token.context} ${token.family}`.toLowerCase().includes(query));
        const fragment = document.createDocumentFragment();
        let previousGroup = '';
        for (const token of filtered) {
            const group = `${levels[token.level]} · ${token.family}`;
            if (group !== previousGroup) {
                const heading = document.createElement('tr');
                const cell = document.createElement('th');
                cell.colSpan = 5;
                cell.scope = 'colgroup';
                cell.className = 'table-light py-3';
                cell.textContent = group;
                heading.append(cell);
                fragment.append(heading);
                previousGroup = group;
            }
            const row = document.createElement('tr');
            const figma = row.insertCell();
            const figmaCode = document.createElement('code');
            figmaCode.textContent = token.figmaName;
            const metadata = document.createElement('div');
            metadata.className = 'small text-secondary mt-1';
            metadata.textContent = `${levels[token.level]} · ${token.mode}`;
            figma.append(figmaCode, metadata);
            const name = row.insertCell();
            const code = document.createElement('code');
            code.textContent = token.name;
            name.append(code);
            const value = row.insertCell();
            const wrapper = document.createElement('div');
            wrapper.className = 'd-flex align-items-start gap-2';
            if (CSS.supports('color', token.resolved)) {
                const swatch = document.createElement('span');
                swatch.className = 'token-swatch';
                swatch.style.backgroundColor = token.resolved;
                swatch.setAttribute('aria-hidden', 'true');
                wrapper.append(swatch);
            }
            const valueCode = document.createElement('code');
            valueCode.textContent = token.value === token.resolved ? token.value : `${token.value} → ${token.resolved}`;
            wrapper.append(valueCode);
            value.append(wrapper);
            const scope = row.insertCell();
            scope.className = 'small';
            scope.textContent = token.selector;
            if (token.context) {
                const context = document.createElement('div');
                context.className = 'text-secondary mt-1';
                context.textContent = token.context;
                scope.append(context);
            }
            row.insertCell().textContent = token.source;
            fragment.append(row);
        }
        list.replaceChildren(fragment);
        document.querySelector('#token-empty').hidden = filtered.length > 0;
        document.querySelector('#token-count').textContent = `${filtered.length} de ${tokens.length} declaraciones · ${new Set(tokens.map(token => token.name)).size} variables únicas${errors.length ? ' · No se pudieron leer algunos estilos. Abre esta página desde el servidor local.' : ''}`;
    }
    search.addEventListener('input', render);
    source.addEventListener('change', render);
    renderFilters();
    render();
})();
