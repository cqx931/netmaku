/*******************************************************************************

    net://maku
    Copyright (C) 2017 Qianxun Chen

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

*******************************************************************************/
$(function() {
    // Placeholder
    var danmaku = [
        "xxxxxxxxxxxxxxxxxxxxxxxxx",
        "yyyyyyyyyyyyyyyyyyyy",
        "zzzzzzz"
    ];

    var fakeTweets = [
        "Butterfly effect ?? @Marco_P_Shite",
        "Estaba haciendo la fila en el super y una nena le dice al cajero &#34;Ling en inglés como es ? &#34; Y el pibe le dice los nombres en chino son todos iguales. Los nenes chiquitos tienen que dejar de consumir menos cosas yanquis, creo....",
        "Have you heard of the #butterflyeffect pic.twitter.com/AM3uKhoARU",
        "BUTTERFLY EFFECT (初回限定盤 2CD＋DVD) [楽天] https://a.r10.to/hrrfXc ",
        "[おすすめ] BUTTERFLY EFFECT (初回限定盤 2CD＋DVD) [楽天] https://a.r10.to/hrrfXc ",
        "its just an interesting phenomenon not that i speak of much novelty concepts LOL this is why i’m a huge fan of the butterfly effect & i continue talking gibberish",
        "for this life I cannot change↵Travis Scott ~ Butterfly Effect",
        "Now Live!: Travis Scott - Butterfly Effect (Listen Now On http://www.powerjammerz.com )",
        "Butterfly effect",
        "I try not to begrudge anyone anything they want to spend their hard earned money on.  But when you are buying $1700 dollar socks, you have too much money. Buy the $700 dollar model and donate the rest to charity.  Just sayin’.",
        "New favourite: Travis Scott / Butterfly Effect http://www.deezer.com/track/363750201  #deezer",
        "I’ve rewatched the butterfly effect a few times and like the first time my mind was somewhere else but that movie is great ",
        "Se o ano que vem for igual a esse eu me mato na moral",
        "Esse comercial da Riachuello tá tão lindo",
        "Eu enfatizo a ideia de ter alguém na minha vida, amar e respeitar a pessoa, igual nos votos, ainda sonho em passar o resto da minha vida com uma única pessoa, sonho que o sonho de alguém seja o mesmo que o meu, e que seja a pessoa certa",
        "But hands down HANDS DOWN the best song to have released this whole year is Butterfly Effect by @trvisXX no brainer.",
        " and the packers losing to the browns today, i done caused the butterfly effect ",
        "EU NASCI NO SÉCULO ERRADO !!!!",
        "@QuavoStuntin release butterfly effect remix already ",
        "Se vcs tem irmãos, nunca se separem dele, meu irmão era meu melhor amigo, agr ele nem olha mais na minha cara :("
    ];


    var dbug = true,
        testInterface = true;

    var settings = {
        disable: false,
        firstrun: true,
        backgroundOverlay: false,
        hideDanmaku: false,
        hideTop: false,
        hideScrolling: false,
        hideBottom: false
    }

    var channel = null,
        url_filter_obj = { 'urls': ['*://*/*'] },
        trafficBuffer = [];

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {

            if (request.what === "hideDanmaku") {
                if (dbug) console.log("[MENU:hide danmaku]", sender);
                if (channel) channel.postMessage({
                    what: "hideDanmaku"
                });
            } else if (request.what === "changeOpacity") {
                if (channel) channel.postMessage({
                    what: "changeOpacity",
                    value: request.value
                });
            } else if (request.what === "backgroundOverlay") {
                //change setting
                if (channel) channel.postMessage({
                    what: "backgroundOverlay",
                    visible: request.visible
                });
            }
        });


    chrome.runtime.onConnect.addListener(function(port) {

        console.assert("[PORT]" + port.name);
        channel = port;

        port.onDisconnect.addListener(function() {
            channel = port = null;
        });

        port.onMessage.addListener(function(msg, port, sendResponse) {
            if (settings.disable) return;

            if (settings.firstrun) {
                port.postMessage({
                    what: "hello"
                });
                settings.firstrun = false;
            }
            if (msg.what === "getTweets") {
                // TODO: keywords
                getTweetsFromKeyword(msg.keywords, function(result) {
                    if (dbug) console.log("[Get Tweets]", result);
                    port.postMessage({
                        what: "tweets",
                        tweets: result
                    });
                })

            } else if (msg.what === "getTraffic") {
                if (dbug) console.log("[Get Traffic for]", port.sender.tab.id, port.sender.tab.url);
                webRequestListener(true);

            } else if (msg.what === "onOff") {
                settings.disable = msg.status ? msg.status : !settings.disable;
            }

        });


    });

    /*******************************************************************************/

    function webRequestListener(listen) {

        chrome.webRequest.onBeforeSendHeaders.removeListener(beforeSendHeaders);
        chrome.webRequest.onHeadersReceived.removeListener(headersReceived);
        // chrome.webRequest.onCompleted.removeListener(completed);

        if (listen) {
            chrome.webRequest.onBeforeSendHeaders.addListener(beforeSendHeaders, url_filter_obj, ["requestHeaders"]);
            chrome.webRequest.onHeadersReceived.addListener(headersReceived, url_filter_obj, ["responseHeaders"]);
            // chrome.webRequest.onCompleted.addListener(completed, url_filter_obj);
        }
    }

    function beforeSendHeaders(req_details) {
        try { /*console.log(req_details); /** console.trace(); /**/ } catch (e) {}
        // processTraffic(req_details);
    }

    function headersReceived(req_details) {
        try { /*console.log(req_details); * console.trace(); /**/ } catch (e) {}
        processTraffic(req_details);
    }

    // function completed(req_details) {
    //     try { console.log(req_details); /** console.trace(); /**/ } catch (e) {}
    //     if (channel) channel.postMessage({ what: 'completed', details: req_details });
    // }

    function errorOccurred(req_details) {
        try { /** console.log(req_details); /** console.trace(); /**/ } catch (e) {}
    }

    /*******************************************************************************/

    function setIcon(active) {
        // TODO
        var icon = disabled ? 'img/disable' : 'img/icon';
        chrome.browserAction.setIcon({ 'path': chrome.extension.getURL(icon) }, function() {});
    }

    function processTraffic(d) {
        var n = {};
        n.method = d.method;
        n.type = d.type;
        n.url = d.url;
        if (d.responseHeaders) n.responseHeaders = d.responseHeaders;
        if (d.requestHeaders) n.requestHeaders = d.requestHeaders;
        // if (dbug) console.log(n);
        // trafficBuffer.push(n);
        sendTrafficData(n);
        return n;
    }

    function sendTrafficData(data) {
        if (channel)
            channel.postMessage({
                what: "traffic",
                details: data
            });
    }

    function getTweetsFromKeywords(keywords, callback) {

    }

    function getTweetsFromKeyword(keyword, callback) {
        // Cache
        // var handleResult = function(result) {
        //     // Cache.set(host, result, cacheTimeout);
        //     return result;
        // }

        var onSuccess = function(data) {
            return parseResult(data);
        }

        if (testInterface) {
            console.log("[Test Interface] Fake Tweets");
            callback(groupResult(fakeTweets));
            return;
        }

        dbug && console.log("[Get Tweets:] " + keyword);
        keyword.replace("+", "%20");


        /***
         * Normal request:
         * https://twitter.com/search?f=tweets&vertical=news&q=google&src=typd&lang=en
         * Filter tweets language: (&l=en)
         * https://twitter.com/search?f=tweets&vertical=news&q=google&l=en&src=typd&lang=en
         ***/

        $.ajax('https://twitter.com/search?f=tweets&vertical=news&src=typd&lang=en&q=' + keyword, {
            success: function(data) {
                if (data.indexOf("An error occured - please try again later.") > -1) {
                    // console.log(data);
                    if (count === 0) {
                        logs && console.log("An error occured, Retry");
                        checkServer(tab, url, host, 1, callback);
                    }

                } else {
                    callback && callback(onSuccess(data));
                }

            },
            error: function(e) {
                callback({
                    status: 'error',
                    fails: -1
                });
                console.warn(e);
            }
        });
    }

    function parseResult(html) {
        var tweets = $(html).find('.tweet-text'),
            result = [];
        for (let tweet of tweets) {
            // Remove url from string
            result.push(tweet.innerText.replace(/(?:https?|ftp):\/\/[\n\S]+/g, ''));
        }
        return result;
    }

    function groupResult(result) {
        // TODO
        // var uniqueResult = [];
        // $.each(result, function(i, el) {
        //     // if ($.inArray(el, uniqueResult) === -1) uniqueNames.push(el);
        //     // else {
        //     //  //
        //     // }
        // });
        return result;
    }

    //End of background script  
});