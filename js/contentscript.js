/*******************************************************************************

    net://maku
    Copyright (C) 2017-2018 Qianxun Chen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    https://github.com/cqx931/netmaku

*******************************************************************************/

'use strict';

var dbug = false;
var port = chrome.runtime.connect({ name: "mycontentscript" });

var SEARCH_ENGINES = ['^(www\.)*google\.((com\.|co\.|it\.)?([a-z]{2})|com)$', '^(www\.)*bing\.(com)$', 'search\.yahoo\.com$'];
var headerList = ["X-DevTools-Emulate-Network-Conditions-Client-Id", "X-Client-Data", "X-Archived-At", "X-Archived-At", "X-Device-Accept", "X-Device-Accept-Charset", "X-Device-Accept-Encoding ", "X-Device-Accept-Language ", "X-Device-User-Agent", "X-PGP-Sig", "X-Ricevuta", "X-Riferimento-Message-ID", "X-TipoRicevuta", "X-Trasporto  ", "X-VerificaSicurezza"];
var colorPalette = {
    "image": "",
    "xmlhttprequest": "",
    "css": "",
    "font": "",
    "frame": "",
    "ping": "",
    "script": ""
};

var netMakuLogo = "            _         ____              _          \n           | |  _    / / /             | |         \n _ __   ___| |_(_)  / / / __ ___   __ _| | ___   _ \n| '_ \\ / _ \\ __|   / / / '_ ` _ \\ / _` | |/ / | | |\n| | | |  __/ |_ _ / / /| | | | | | (_| |   <| |_| |\n|_| |_|\\___|\\__(_)_/_/ |_| |_| |_|\\__,_|_|\\_\\\\__,_|";

$('head').ready(function() {
    //if the current url is not chrome page
    loadDanmaku();
});


$(function() {
    // Step 3: console (TODO)

    // Step 4: Ask background for twitter content
    // port.postMessage({
    //     what: "getTweets",
    //     keywords: getKeywordsFromPage(location)
    // });

});

/*******************************************************************************/

function loadDanmaku() {
     chrome.runtime.sendMessage({ what: "userSettings" }, function(settings) {
        if (dbug) console.log("userSettingsReceived", settings);
        // if netmaku already exist, remove
        $("#netmaku").remove();
        if (settings.disabled) return;

        initDanmaku(settings.maxEntries, settings.opacity, settings.backgroundOverlay);
        generateColorPalette();

        // Step 1: show meta
        showMetaDanmaku(document);
        // Step 2: traffic
        askTrafficData();
    });
}

function sendOutKeywordsFeedback(keywords, mode) {
    if (dbug) console.log("[Keywords from:" + mode + "]", keywords);
    // TODO
    var feedback = "feedback";
    switch (mode) {
        case "search":
            feedback = "You are searching for:" + keywords;
            break;
        default:
            feedback = "The page is about" + keywords;

    }
    inject_topComments(feedback);
}

function showMetaDanmaku(document) {
    var meta = {},
        entries = [];

    $("head meta").each(function() {
        if ($(this).attr("name") != undefined && $(this).attr("content").length > 0 && $(this).attr("content").indexOf("://") === -1) {
            meta[$(this).attr("name")] = $(this).attr("content");
            entries.push($(this).attr("name") + ": " + $(this).attr("content"));
        }
    });

    if (entries.length > 0) {
        if (dbug) console.log("[Show meta]", meta);

        for (var i in entries) {
            var entry = entries[i];
            // console.log(entry.length, entry);
            // // TMP
            // if (entry.length > 60) {
            //     entries[i] = entry.substr(0,60);
            // }
            // //  if (entry.indexOf(".?!,") > -1) {
            // //         console.log(entry);
            // //         var split = entry.split(/[,.?;!]/),
            // //             index = entries.indexOf(entry);
            // //         array.splice(index,1);
            // //         entries.concat(split);
            // // }
        }
        inject_topComments(entries, { extra: "d_meta" });
    }

}

function generateTrafficDanmaku(traffic) {
    var entries = [],
        headers;
    
    // NOT IN USE
    var processHeaders = function() {
        if (headers != undefined) {
            for (var i in headers) {
                if (headers[i].name === "Cookie") entries.push("Cookie")
                else if (headers[i].name.indexOf("X-") === 0 && headerList.indexOf(headers[i].name) < 0) {
                    //log unconventional header
                    entries.push(headers[i].value);
                }
                // console.log(headers[i].name, headers[i].value);
            }
        }
    }
  
    var content = glitch(traffic.method + ":" + traffic.type);
    entries.push(content);
    // entries.push(traffic.url); // ?
    headers = traffic.requestHeaders != undefined ? traffic.requestHeaders : traffic.responseHeaders;
    // processHeaders();

    var settings = { extra: "d_traffic" },
        type = traffic.type.toLowerCase();
    if (type.indexOf("frame") > -1) type = "frame";
    if (colorPalette[type] != undefined) settings.color = colorPalette[type];
    inject_flyingComments(entries, settings);
}

function askTrafficData() {
    port.postMessage({
        what: "getTraffic",
    });
}

function generateColorPalette() {
    for (var color in colorPalette) {
        colorPalette[color] = getRandomColor();
    }
    console.log("[Color]", colorPalette);
}

/*******************************************************************************/
/***************** Not In USE *******************/
function processTweets(tweets) {
    if (dbug) console.log("[Recevied Tweets]");
    inject_flyingComments(tweets);
}

function getKeywordsFromPage(location) {
    // Case 1
    // Search engine getKeywords

    var keywords, mode = "Content";
    // isSearchEngine(location) && 
    keywords = getSearchKeywordFromURL(location.href);

    if (keywords != undefined) {
        mode = "search";
    } else {
        keywords = $('meta[name=keywords]').attr("content");
        if (keywords != undefined) {
            // Case 2 : Get meta keywords
            keywords = keywords.substr(0, keywords.indexOf(','));
            mode = "meta";
        } else {
            // Case 3 : From text content
            keywords = getKeywordsFromText(getTextFromHTML());
        }
    }

}


function getTextFromHTML() {
    var text = "";

    function isExcluded(elm) {
        if (elm.tagName == "STYLE") {
            return true;
        }
        if (elm.tagName == "SCRIPT") {
            return true;
        }
        if (elm.tagName == "NOSCRIPT") {
            return true;
        }
        if (elm.tagName == "IFRAME") {
            return true;
        }
        if (elm.tagName == "OBJECT") {
            return true;
        }
        return false;
    }

    function traverse(elm) {
        if (elm.nodeType == Node.ELEMENT_NODE || elm.nodeType == Node.DOCUMENT_NODE) {

            // Exclude elements with invisible text nodes
            if (isExcluded(elm)) {
                return;
            }

            for (var i = 0; i < elm.childNodes.length; i++) {
                // Recursively call to traverse
                traverse(elm.childNodes[i]);
            }

        }

        if (elm.nodeType == Node.TEXT_NODE) {

            // Exclude text node consisting of only spaces
            if (elm.nodeValue.trim() === "") {
                return;
            }

            // elm.nodeValue here is visible text we need.
            text += elm.nodeValue + " ";
        }
    }

    traverse(document);

    // Remove line breaks
    text = text.replace(/(\r\n|\n|\r|\d|[^a-zA-Z ])/gm, "").trim();

    return text;
}

function getKeywordsFromText(str) {

    var dict = {};
    var words = str.split(/\b/);

    for (var i = 0; i < words.length; i++) {
        var word = words[i].toLowerCase();
        dict["_" + word] = (dict["_" + word] || 0) + 1;
    }

    // Create items array
    var items = Object.keys(dict).map(function(key) {
        return [key, dict[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
    });

    return items.slice(0, 10);
}


function keysValues(href) {

    var vars = [],
        hashes;

    if (href) hashes = href.slice(href.indexOf('?') + 1).split(/&|\#/);
    if (hashes === undefined) return null;

    for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i].split('=');

        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }

    return vars;
}

function getSearchKeywordFromURL(url) {

    var keyvals = keysValues(url),
        keyword, result;
    if (keyvals) keyword = keyvals.q || keyvals.p;
    if (keyword) result = decodeURI(keyword.toLowerCase());

    if (result && result.indexOf(" ") > -1)
        result = result.replace(" ", "+");

    //trim extra +
    if (result && result.slice(-1) === "+")
        result = result.slice(0, result.length - 1);

    return result;
}

function hello() {

    // inject_staticComments(netMakuLogo, {
    //     position: "main",
    //     font: "mono",
    //     time: 2000,
    // });
}

/*******************************************************************************/
/*** SETTINGS ***/
function backgroundOverlay(state) {
    console.log("background - function", state);
    if (state)
      $("#netmaku").css("background","rgba(0,0,0,.3)");
    else 
      $("#netmaku").css("background","rgba(0,0,0,0)");
}

function hideAllDanmaku(state) {
    console.log("hide - function");
    if (state)
        $("#netmaku").css("display","none");
    else 
        $("#netmaku").css("display","block");
}

function changeOpacity(value) {
    console.log("changeOpacity", value * 0.01);
     $("#netmaku").css("opacity",value * 0.01);
}
/*******************************************************************************/
/** GLITCH **************************
    1.Switcher
    GET:IMAGE
    IMAGE:GET

    2.Punctuater
    GET:script
    G.E.T:s.c.r.i.p.t.

    3.Silencer: 2~3 random silence "_"
*************************************/

function glitch(danmaku) {
    var p = Math.floor(Math.random() * 10);
    switch (p) {
        case 1:
            return switcher(danmaku);
            break;
        case 2:
            return punctuater(danmaku);
            break;
        case 3:
            return silencer(danmaku);
            break;
        default:
            return danmaku;
    }
}

function switcher(danmaku) {
  var parts = danmaku.split(":");
  if (parts.length > 1) danmaku = parts[1] + ":" + parts[0];
  return danmaku;
}

function punctuater(danmaku) {
  var newDanmaku = "";
  for (var i = 0; i < danmaku.length; i++) {
     var c = danmaku.charAt(i);
     if ( c!= ":") {
        if ( i === danmaku.length -1 || (i < danmaku.length -1 && danmaku.charAt(i+1) != ":")) {
            c = c + ".";
        } 
     }
     newDanmaku += c
        
  }
  return newDanmaku;
}

function silencer(danmaku) {
    var st = Math.random() > 0.5 ? 2 : 3;
    for (var i = 0; i < st; i++) {
        var pos = Math.floor(Math.random() * danmaku.length);
        danmaku = danmaku.replace(danmaku.charAt(pos), "_");
    }
    return danmaku;
}
/*******************************************************************************/

port.onMessage.addListener(
    function(message, sender, callback) {
        if (message.what === "tweets") {
            // processTweets(message.tweets);
        } else if (message.what === "hello") {
            if (dbug) console.log("-- net://maku installed --");
            hello();
        } else if (message.what === "traffic") {
            generateTrafficDanmaku(message.details);
        } else if (message.what === "hideAllDanmaku") {
            hideAllDanmaku(message.value);
        } else if (message.what === "opacity") {
            changeOpacity(message.value);
        } else if (message.what === "backgroundOverlay") {
            console.log("background - message");
            backgroundOverlay(message.value);
        } else if(message.what === "maxEntries") {
            maxDanmaku = message.value;
        } else if (message.what === "reload") {
            loadDanmaku();
        }
    });