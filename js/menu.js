$(document).ready(function() {

    var slider = $("#opacity")[0];
    var output = $("span#currentValue");

    output.text(slider.value); // Display the default slider value
    
    // TODO: Check boxes

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        output.html(slider.value);
        chrome.runtime.sendMessage({
            what: "changeOpacity",
            value: slider.value
        });
    }

    $(".button").click(function() {
        $(".button").removeClass("hide");

        if ($(this).attr("title") === "hide") {
            chrome.runtime.sendMessage({ what: "hideDanmaku" });
            $(".button[title='hide']").addClass("hide");
        } else if ($(this).attr("title") === "show") {
            $(".button[title='show']").addClass("hide");
            chrome.runtime.sendMessage({ what: "showDanmaku" });
        }

    })


});