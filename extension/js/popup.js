/*
* Popup.js
* This file is called when the chrome extension has been called loaded.
* A URL is retrived from current chrome tab and the results from the
* server will be displayed.
*/

// DOM Content Ready function.
document.addEventListener('DOMContentLoaded', function() {

  // Get URL contents.
  postTabURL();

  // var checkPageButton = document.getElementById('checkPage');
  // checkPageButton.addEventListener('click', function() {
  //   console.log("URL is: " + currentUrl);
  //
  // }, false);
}, false);

function postTabURL() {

    // Chrome API to get url.
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){

        // Get URL in current tab.
        var currentProtocolURL = tabs[0].url;
        // remove protocol from String using regex from http://stackoverflow.com/questions/8206269/how-to-remove-http-from-a-url-in-javascript
        var currentURL = currentProtocolURL.replace(/.*?:\/\//g, "");

        // Combine server URL (settings.js) with chrome tab URL.
        var url = server_url + 'api';
        responseValues = "na";

        var data = {"url": currentProtocolURL};

        // POST request.
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                // Parse JSON from URL... May need updating when we return JSON instead of text.
                var responseValues = JSON.parse(xmlhttp.responseText);
                sentimentValue = responseValues.sentiment;
                console.log("responseValues", sentimentValue);
                gaugeGenerator(sentimentValue, "sentiment");
            }
            else {
              console.log("error");
            }
        };
        xmlhttp.open("POST", url, true);
        xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        xmlhttp.send(JSON.stringify(data));
        return responseValues;
    });
}

/*
* Gauge
*/
function gaugeGenerator(value, type){
  var opts = {
    lines: 12, // The number of lines to draw
    angle: 0.15, // The length of each line
    lineWidth: 0.44, // The line thickness
    pointer: {
      length: 0.9, // The radius of the inner circle
      strokeWidth: 0.035, // The rotation offset
      color: '#000000' // Fill color
    },
    limitMax: 'false',   // If true, the pointer will not go past the end of the gauge
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#E0E0E0',   // to see which ones work best for you
    generateGradient: true
  };
  switch(true) {
      case type == "sentiment":
          var target = document.getElementById('sentiment');
          console.log("sentiment");
          break;
      case type == "writing":
          var target = document.getElementById('writing');
          console.log("writing");
          break;
      default:
          target = "na";
  }

  // Set values to canvas.
  if (target != "na") {
    var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
    gauge.maxValue = 100; // set max gauge value
    gauge.animationSpeed = 5; // set animation speed (32 is default value)
    gauge.set(value); // set actual value
  }

}
