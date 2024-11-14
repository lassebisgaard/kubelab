# Kubelab Frontend Guide

## Projektstruktur
- `/css` - Alle stylesheets
- `/js` - JavaScript filer
- `/pages` - Alle sider
- `/Icons` - SVG ikoner og billeder

## Kom i gang
1. Brug `page-template.html` som udgangspunkt for nye sider
2. Tilpas title, overskrift og indhold efter behov
3. Vælg mellem grid layouts (2x2, 3x3 eller list)

## CSS Struktur
- `variables.css` - Farver og grundlæggende variabler
- `main.css` - Basis styling og reset
- `layout.css` - Side layout og grid system
- `navigation.css` - Sidebar og navigation
- `components.css` - Genbrugelige komponenter

## Design System

### Farver
Alle farver er defineret som CSS variabler i `variables.css`. Brug altid disse variabler frem for hardcodede farver: 