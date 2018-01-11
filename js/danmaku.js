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

var TOP_AREA = $(window).height() / 3,
    MARGIN_TOP = 10,
    ROLLING_TOP = 60;
var dmk_dbug = false;

var maxDanmaku = 100, 
    maxDanmakuLength = 98,
    danmakuBuffer = [];

var getRandomColor = function() {
    return '#' + (function(h) {
        return new Array(7 - h.length).join("0") + h;
    })((Math.random() * 0x1000000 << 0).toString(16));
};

/********************************** API *************************************/

function initDanmaku (maxLimit, opacity,  bg) {
    var wrapper = document.createElement('div'),
        danmakuScreen = document.createElement('div'),
        mask = document.createElement('div'),
        top = document.createElement('div');

    wrapper.id = 'netmaku';
    danmakuScreen.className = 'screen';
    mask.className = 'mask';
    top.className = 'top';

    // append
    danmakuScreen.appendChild(top);
    danmakuScreen.appendChild(mask);
    wrapper.appendChild(danmakuScreen);
    document.getElementsByTagName("BODY")[0].appendChild(wrapper);

    // settings
    changeDanmakuLimit(maxLimit);
    changeOpacity(opacity);
    backgroundOverlay(bg);

}

function changeDanmakuLimit (value) {
    if (value != undefined)
      maxDanmaku = value;
}

function inject_topComments(entries, settings) {
    inject_staticComments(entries, settings);
}

function inject_staticComments(entries, settings) {
    if (entries === undefined) {
        if (dmk_dbug) console.log("[inject_staticComments]: Empty content");
        return;
    } else {
        if (dmk_dbug) console.log("[inject_staticComments]:", entries);
    }

    // Read settings
    var m, p, t, c, e;
    if (settings != undefined) {
        m = settings.mono;
        p = settings.position;
        t = settings.time;
        c = settings.color;
        e = settings.extra;
    }

    var parent = p === "top" ? $("#netmaku .top") : $("#netmaku .mask");

    // Single or multiple entries
    if (typeof entries === 'string') entries = [entries];

    for (var i = 0; i < entries.length; i++) {

        var text = "", 
            lastLineNum, lineNum = 1,
            top = MARGIN_TOP + 25 * i;
        console.log(entries[i].length, entries[i]);
        if (entries[i].length <= maxDanmakuLength)
            text = entries[i];
        else {
             // Split long sentence to multiple lines
            var entry = entries[i], lineCursor = 0;
                lineNum = Math.ceil(entry.length / maxDanmakuLength);
            var eachLineGuide = Math.floor(entry.length / lineNum),
                lines = [];

            // Avoid displaying messages that are too long
            lineNum = lineNum > 3 ? 3 : lineNum;
            
            if (dmk_dbug) console.log("Entry is too long, break to " + lineNum + " entries", entry);
            
            for (var j = 0; j < lineNum; j++) {
                var nextLineAt = lineCursor + eachLineGuide;
                // TODO:
                // if there is space/punctuation marks before nextLineAt {
                //   while (entry.charAt(nextLineAt) is not punctuation/space) {
                //     nextLineAt --;
                //   }
                //}
                lines[j] = entry.slice(lineCursor, nextLineAt);
                if (j=== 0) text = lines[j];
                else {
                    text += "<br>" + lines[j];
                }
                lineCursor += lines[j].length;
            }
                
        }
        
        // Multiple lines
        if (lastLineNum > 1) top += (lastLineNum - 1) * 25;

        var lable = $("<div class='static " + (m ? "mono" : "") + (e ? e : "") +
            "' style='text-align:center;margin-left: auto;margin-right: auto;left: 0;right: 0;top:" +
            top + "px;opacity:1;'>" + text + "</div>");

        parent.append(lable.show());
        lastLineNum = lineNum;
    }

    $(".mask div.static" + (e ? "." + e : "")).show().each(function() {

        $(this).css({
            color: c ? c : getRandomColor()
        });

        var time = t ? t : $(this)[0].innerText.length * 80;
        if (dmk_dbug) console.log("[Danmaku API]Static:" + text + ";Remove after " + time);

        setTimeout(function(ele) {
            ele.remove();
        }, time, this);
    });

}

/****** Modified from http://www.jq22.com/webqd477 *****/
function inject_flyingComments(entries, settings) {
    // TMP: ignore message if there is too much traffic
    // TODO: danmaku buffer
    var currentSize = $(".mask div.rolling.d_traffic").length;
    dmk_dbug && console.log("[SIZE] " + currentSize);
    if (currentSize > maxDanmaku) return;

    if (entries === undefined) {
        if (dmk_dbug) console.log("[inject_flyingComments]: Empty content");
        return;
    } else {
        if (dmk_dbug) console.log("[inject_flyingComments]");
    }

    // Read settings
    var m, c, e;
    if (settings != undefined) {
        m = settings.mono;
        c = settings.color;
        e = settings.extra;
    }

    var _top = 0;

    if (typeof entries === 'string') entries = [entries];

    for (var i = 0; i < entries.length; i++) {
        var text = entries[i],
            color = c ? c : (Math.random() > 0.3 ? "#FFF" : getRandomColor()),
            lable = $("<div class='rolling " + (m ? "mono " : "")  + (e ? e : "") + "' style='right:20px;top:" +
                ROLLING_TOP + "px;opacity:1;color:" + color + ";'>" + text + "</div>");
        $(".mask").append(lable.show());
    }

    $(".mask div.rolling").show().each(function() {
        // Total travel distance
        var _width = $(this).width(),
            _left = _width > 600 ? $(window).width() - 200 : $(window).width() - _width,
            _travel = _width < $(window).width() ? -_left : -_width,
            _height = $(window).height();
       
        _top += 30;
        
        if (_top >= (_height - 130)) {
            /* max rolling top*/
            _top = ROLLING_TOP;
        }
        $(this).css({
            left: _left,
            top: _top
        });
        // $(this).width() is changed from here
        var v = 0.1; // px per milisecond
        // Adjust time according to string length
        var time = Math.floor(1 / v * (_width < $(window).width() ? $(window).width() : _width));
       
        if (dmk_dbug) console.log("Anime:Width:" + _width + ";Length:" + $(this)[0].innerText.length + ";Travel distance" + _travel + ";Total Time:" + time);

        $(this).animate({
                left: _travel + "px"
            },
            time,
            'linear',
            function() {
                $(this).remove();
            });
    });
}