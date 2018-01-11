/*******************************************************************************

    net://maku
    Copyright (C) 2017-2018 cqx931

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

$(document).ready(function() {

    var slider = $("#opacity")[0];
    var output = $("span#currentValue");

    /******************************************************************************/

    var onInputChanged = function(ev) {
        var input = ev.target;
        var name = this.name;
        var value = input.checked;

        if (name === "onoffswitch") {
            name = "disabled";
            value = !value;
        };
        // console.log(name + ":" + value)
        changeUserSettings(name, value);
    };

    var onMaxEntriesChanged = function(ev) {
        var value = parseInt(ev.target.value);
        changeUserSettings("maxEntries", value);
    }

    /******************************************************************************/

    var changeUserSettings = function(name, value) {

        chrome.runtime.sendMessage({
            what: "changeUserSettings",
            name: name,
            value: value
        });

    };

    /******************************************************************************/


    var onUserSettingsReceived = function(settings) {
      // console.log("onUserSettingsReceived", settings);
       
      $('#backgroundOverlay input')[0].checked = settings.backgroundOverlay;
      
      //disable
      $('.onoffswitch input')[0].checked = !settings.disabled;

      // Opacity
      slider.value = settings.opacity;
      output.text(slider.value); // Display the default slider value
      
      // Limit
      $('#max'+ settings.maxEntries)[0].checked = true;

      $('body').removeClass("onload");
    }

    /******************************************************************************/

    chrome.runtime.sendMessage({ what: "userSettings" }, onUserSettingsReceived);

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        output.html(slider.value);
        chrome.runtime.sendMessage({
            what: "changeOpacity",
            name: "opacity",
            value: slider.value
        });
    }

    $('[type="checkbox"]').on('change', onInputChanged);
    $('[type="radio"]').on('click', onMaxEntriesChanged);
    // $(".button").click(function() {
    //     $(".button").removeClass("hide");

    //     if ($(this).attr("title") === "hide") {
    //         chrome.runtime.sendMessage({ what: "hideDanmaku" });
    //         $(".button[title='hide']").addClass("hide");
    //     } else if ($(this).attr("title") === "show") {
    //         $(".button[title='show']").addClass("hide");
    //         chrome.runtime.sendMessage({ what: "showDanmaku" });
    //     }

    // })

});