'use strict';
const beebotte = require('beebotte');
const config = require('config');
const fs = require('fs');
const googlehome = require('google-home-notifier');
const request = require('request');

const searchUrl = 'https://pokeapi.co/api/v2/pokemon-species/';
const nameIdMap = JSON.parse(fs.readFileSync('./pokemon.json', 'utf-8'));

/**
 * main function
 */
const main = () => {
    googlehome.ip(config.googlehome.ip, config.googlehome.language);
    subscribe();
    // search('フシギダネ', notify);
};

/**
 * subscribe beebotte channel
 */
const subscribe = () => {
    let transport = {
        type: 'mqtt',
        token: config.beebotte.token,
    };
    let channel = config.beebotte.channel;
    let resource = config.beebotte.resource;
    let client = new beebotte.Stream({transport: transport});

    client.on('connected', () => {
        client.subscribe(channel, resource, (message) => {
            let name = message.data;
            search(name, notify);
        }).on('subscribed', (sub) => {
            console.info('subscribed.');
        });
    });
};

/**
 * search flavor text from pokeapi
 * @param {string} name The name of target
 * @param {function} callback The callback function
 */
const search = (name, callback) => {
    if (nameIdMap[name]) {
        let options = {
            url: searchUrl + nameIdMap[name],
            json: true,
        };
        request.get(options, (error, response, body) => {
            if (response.statusCode == 200) {
                let message = createNotifyMessage(body);
                callback(message);
            } else {
                console.error(response);
                callback('エラーが発生しました。');
            }
        });
    } else {
        callback(name + 'は見つかりませんでした。');
    }
};

/**
 * create message for notify google home
 * @param {object} body Search response body (json)
 * @return {string}
 */
const createNotifyMessage = (body) => {
    let language = config.pokeapi.language;
    let ftLanguage = config.pokeapi.flavorText.language;
    let version = config.pokeapi.flavorText.version;
    let names = body.names.filter((name) => language == name.language.name);
    let genera = body.genera.filter((genus) => language == genus.language.name);
    let flavorTexts = body.flavor_text_entries.filter((text) => {
        return ftLanguage == text.language.name && version == text.version.name;
    });
    let message = names[0].name + '。' + genera[0].genus + '。'
        + flavorTexts[0].flavor_text;
    return message;
};

/**
 * notify to google home
 * @param {string} message The message for notification
 */
const notify = (message) => {
    console.info(message);
    googlehome.notify(message, (response) => {
        console.info(response);
    });
};

if (require.main === module) {
    main();
}
