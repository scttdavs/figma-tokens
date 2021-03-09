import {Parser} from 'expr-eval';
import XRegExp from 'xregexp';
import {hexToRgb, RGBAToHexA} from '../../plugin/helpers';

const parser = new Parser();

export function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

export function checkAndEvaluateMath(expr) {
    try {
        parser.evaluate(expr);
        return parser.evaluate(expr);
    } catch (ex) {
        return expr;
    }
}

export function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, {[key]: {}});
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {[key]: source[key]});
            }
        });
    }

    return mergeDeep(target, ...sources);
}

export function isValueToken(token): token is {value: string | number} {
    return typeof token === 'object' && (typeof token?.value === 'string' || typeof token?.value === 'number');
}

export function isTypographyToken(token) {
    if (typeof token !== 'object') return false;
    return (
        'fontFamily' in token ||
        'fontWeight' in token ||
        'fontSize' in token ||
        'lineHeight' in token ||
        'paragraphSpacing' in token
    );
}

export function isSingleToken(token): token is {value: string} {
    return typeof token === 'object' && 'value' in token;
}

export function convertToRgb(color: string) {
    if (typeof color !== 'string') {
        return color;
    }
    const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
    const matchedDelimiter = XRegExp.matchRecursive(color, '\\(', '\\)', 'g');
    let returnedColor = color;

    if (matchedDelimiter) {
        // If rgb contains hex value, extract rgb values from there
        matchedDelimiter.map((matched) => {
            try {
                const matchesRgba = XRegExp.matchRecursive(matched, 'rgba?\\(', '\\)', 'g', {
                    valueNames: [null, 'left', 'match', 'right'],
                });
                if (matchesRgba.length > 0) {
                    const matchedString = matchesRgba.map((n) => n.value).join('');
                    const matchedColor = matchesRgba[1].value;
                    const matchesHex = matchedColor.match(hexRegex);
                    let r;
                    let g;
                    let b;
                    let a = 1;
                    let alpha;
                    console.log('Matches regex', matchesHex);
                    if (matchesHex) {
                        ({r, g, b} = hexToRgb(matchesHex[0]));
                    } else {
                        [r, g, b, alpha = '1'] = matchedColor.split(',').map((n) => n.trim());
                        a = Number(alpha);
                    }
                    console.log('Matched, Returned', matchedColor, r, g, b, a);
                    const rgbaString = `rgba(${matchedColor.replace(hexRegex, [r, g, b].join(', '))}`;

                    returnedColor = color.split(matchedString).join(RGBAToHexA(rgbaString));
                }
            } catch (e) {
                console.log('error', e);
            }
        });
    }
    return returnedColor;
}

// Light or dark check for Token Buttons: If color is very bright e.g. white we show a different style
export function lightOrDark(color: string) {
    if (typeof color !== 'string') {
        return 'light';
    }
    try {
        let r: number | string;
        let g: number | string;
        let b: number | string;

        // Check the format of the color, HEX or RGB?
        if (color.match(/^rgb/)) {
            // If RGB --> store the red, green, blue values in separate variables
            [, r, g, b] = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        } else {
            // If hex --> Convert it to RGB: http://gist.github.com/983661
            const baseColor = color.slice(0, 7);
            const extractedColor = +`0x${baseColor.slice(1).replace(baseColor.length < 5 && /./g, '$&$&')}`;

            r = extractedColor >> 16;
            g = (extractedColor >> 8) & 255;
            b = extractedColor & 255;
        }
        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        const hsp = Math.sqrt(
            0.299 * (Number(r) * Number(r)) + 0.587 * (Number(g) * Number(g)) + 0.114 * (Number(b) * Number(b))
        );

        // Using the HSP value, determine whether the color is light or dark
        if (hsp < 245.5) {
            return 'dark';
        }
    } catch (e) {
        console.error(e);
    }
    return 'light';
}

// Sets random color depending on Hash for use in colorful UI
export function colorByHashCode(value) {
    let hash = 0;
    if (value.length === 0) return hash;
    for (let i = 0; i < value.length; i += 1) {
        hash = value.charCodeAt(i) * 30 + hash;
    }
    const shortened = Math.abs(hash % 360);
    return `${shortened},100%,85%`;
}

// Not in use for now, converts string to hashCode
export function hashCode(s) {
    return s.split('').reduce(function (a, b) {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);
}

// Converts string to slug
export function slugify(text: string) {
    return text
        .toString() // Cast to string
        .toLowerCase() // Convert the string to lowercase letters
        .normalize('NFD') // The normalize() method returns the Unicode Normalization Form of a given string.
        .trim() // Remove whitespace from both sides of a string
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-'); // Replace multiple - with single -
}
