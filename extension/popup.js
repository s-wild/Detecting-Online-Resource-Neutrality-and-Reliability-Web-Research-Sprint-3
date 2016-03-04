// Get Current tab URL
chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    currentUrl = tabs[0].url;
});

// Post URL to server to get results.

document.addEventListener('DOMContentLoaded', function() {
  var checkPageButton = document.getElementById('checkPage');

  checkPageButton.addEventListener('click', function() {
    console.log("URL is: " + currentUrl);

  }, false);
}, false);
