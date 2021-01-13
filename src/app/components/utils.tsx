import {Parser} from 'expr-eval';
import {hexToRgb} from '../../plugin/helpers';
import * as pjs from '../../../package.json';

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

export function isTypographyToken(token) {
    return 'fontFamily' in token || 'fontWeight' in token || 'fontSize' in token || 'lineHeight' in token;
}

export function convertToRgb(color: string) {
    if (typeof color !== 'string') {
        return color;
    }
    const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
    if (color.match(/^rgb/)) {
        // If rgb contains hex value, extract rgb values from there
        if (color.match(hexRegex)) {
            const {r, g, b} = hexToRgb(color.match(hexRegex)[0]);

            return color.replace(hexRegex, [r, g, b].join(', '));
        }
        return color;
    }
    return color;
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
            const extractedColor = +`0x${color.slice(1).replace(color.length < 5 && /./g, '$&$&')}`;

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

// Populate themes
export function populateThemes(data) {
    parent.postMessage(
        {
            pluginMessage: {
                type: 'notify',
                msg: 'There was an error connecting',
            },
        },
        '*'
    );
}

export async function updateRemoteTokens(tokens, id, secret) {
    if (!id && !secret) return;

    parent.postMessage(
        {
            pluginMessage: {
                type: 'notify',
                msg: 'Updating Token values...',
            },
        },
        '*'
    );

    const tokenObj = {
        version: pjs.version,
        values: {
            options: JSON.parse(tokens.options),
        },
    };

    const response = await fetch(`https://api.jsonbin.io/b/${id}`, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        body: JSON.stringify(tokenObj, null, 2),
        headers: {
            'Content-Type': 'application/json',
            'secret-key': secret,
            versioning: false,
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
}

// Initialize plugin with data
export async function initializeWithThemerData(apiID, apiSecret) {
    const id = apiID;
    const secret = apiSecret;
    let tokenValues;

    if (!id && secret) {
        console.log('got secret but no values');
        // Create a new bin
        // send msg to plugin
        // parent.postMessage(
        //     {
        //         pluginMessage: {
        //             type: 'notify',
        //             msg: 'Creating your bin...',
        //         },
        //     },
        //     '*'
        // );

        // // create a new bin
        // const xhr = new XMLHttpRequest();
        // xhr.open('POST', 'https://api.jsonbin.io/b', true);
        // xhr.setRequestHeader('Access-Control-Allow-Credentials', true);
        // xhr.setRequestHeader('Content-type', 'application/json');
        // xhr.setRequestHeader('secret-key', secret);
        // xhr.responseType = 'text';
        // xhr.onload = () => {
        //     if (xhr.status >= 200 && xhr.status < 300) {
        //         const response = JSON.parse(xhr.response);
        //         id = response.id;
        //         initializeWithThemerData(id, secret);
        //     } else {
        //         // send msg to plugin
        //         parent.postMessage(
        //             {
        //                 pluginMessage: {
        //                     type: 'notify',
        //                     msg: 'There was an error connecting',
        //                 },
        //             },
        //             '*'
        //         );

        //         // loadingScreen('off');

        //         // connectedToBin = false;
        //     }
        // };
        // xhr.send('[{}]');
    } else if (id && secret) {
        console.log('got both', {id, secret});

        // send msg to plugin
        parent.postMessage(
            {
                pluginMessage: {
                    type: 'notify',
                    msg: 'Connecting to JSONbin.io',
                },
            },
            '*'
        );

        // make xml http request
        const response = await fetch(`https://api.jsonbin.io/b/${id}/latest`, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
                'secret-key': secret,
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response) {
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'initialThemerData',
                        id,
                        secret,
                        msg: 'Connection successful',
                    },
                },
                '*'
            );
            const jsonBinData = await response.json();
            const obj = {
                version: jsonBinData.version,
                values: {
                    options: JSON.stringify(jsonBinData.values.options, null, 2),
                },
            };

            tokenValues = obj;
        }

        // populate latest data from API

        // update admin state
        // adminValidation();

        // populate list of themes

        // connected
        // console.log('connected to bin');
        // connectedToBin = true;
        // send msg to plugin
        parent.postMessage(
            {
                pluginMessage: {
                    type: 'notify',
                    msg: 'There was an error connecting',
                },
            },
            '*'
        );

        // loadingScreen('off');

        // connectedToBin = false;
    } else {
        // send msg to plugin
        parent.postMessage(
            {
                pluginMessage: {
                    type: 'notify',
                    msg: 'There was an error. Please check your API credentials.',
                },
            },
            '*'
        );

        // loading
        // loadingScreen('off');
    }

    return tokenValues;
}
