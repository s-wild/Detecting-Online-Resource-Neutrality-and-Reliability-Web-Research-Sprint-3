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
  var url = server_url + 'api/';
  // Chrome API to get url.
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      // Get URL in current tab.
      currentURL = tabs[0].url;

      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

      xhr.onload = function () {
        console.log(this.responseText);
      };
      // send the collected data as JSON
      xhr.send(JSON.stringify({url: currentURL}));
  });
}
