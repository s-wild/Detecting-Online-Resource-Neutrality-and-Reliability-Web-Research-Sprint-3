/*
* Popup.js
* This file is called when the chrome extension has been called loaded.
* A URL is retrived from current chrome tab and the results from the
* server will be displayed.
*/

// DOM Content Ready function.
document.addEventListener('DOMContentLoaded', function() {

  // Get URL contents.
  getURLContents();

  // var checkPageButton = document.getElementById('checkPage');
  // checkPageButton.addEventListener('click', function() {
  //   console.log("URL is: " + currentUrl);
  //
  // }, false);
}, false);

function getURLContents() {

    // Chrome API to get url.
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        // Get URL in current tab.
        var currentProtocolURL = tabs[0].url;
        // remove protocol from String using regex from http://stackoverflow.com/questions/8206269/how-to-remove-http-from-a-url-in-javascript
        var currentURL = currentProtocolURL.replace(/.*?:\/\//g, "");

        // Combine server URL (settings.js) with chrome tab URL.
        var url = server_url + 'api/' + currentURL;
        responseValues = "na";
        console.log(url);

        // GET request.
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                // Parse JSON from URL... May need updating when we return JSON instead of text.
                var responseValues = xmlhttp.responseText;
                console.log("responseValues", responseValues);

                var currentResults = document.getElementById("results");
                currentResults.innerHTML = responseValues;
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
        return responseValues;
    });
}
