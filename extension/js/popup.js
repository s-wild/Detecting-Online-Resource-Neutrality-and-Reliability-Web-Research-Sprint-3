/*
* Popup.js
* This file is called when the chrome extension has been called loaded.
* A URL is retrived from current chrome tab and the results from the
* server will be displayed.
*/

// DOM Content Ready function.
document.addEventListener('DOMContentLoaded', function() {
  // Performance timer
  start_time = new Date().getTime();
  hideResults();
  activityIndicator();

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
        console.log(currentProtocolURL, "currentProtocolURL");
        if (currentProtocolURL == "chrome://newtab/") {
          console.log("visit page...");
          errorMessageNoUrl();
        }
        else {
          var data = {"url": currentProtocolURL};

          // POST request.
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.onreadystatechange = function() {
              if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                  // Parse JSON from URL... May need updating when we return JSON instead of text.
                  const responseValues = JSON.parse(xmlhttp.responseText);
                  var sentimentValue = responseValues.sentiment;
                  var spellingValue = responseValues.spelling;
                  var emotionType = responseValues.alchemy.emotion.highest;
                  var emotionValue = responseValues.alchemy.emotion.value;
                  var entitiesObejct = responseValues.alchemy.entities;
                  var weaselValues = responseValues.warnings[0];
                  var reliabilityValue = responseValues.reliability;

                  gaugeGenerator(sentimentValue, "sentiment");
                  spellingRatingGenerator(spellingValue);
                  generateEmoji(emotionType, emotionValue);
                  generateEntities(entitiesObejct);
                  generateWeaselWords(weaselValues);
                  generateArticleReliability(reliabilityValue);
                  showResults();
                  // Response time.
                  var request_time = new Date().getTime() - start_time;
                  console.log("req time",request_time);
                  document.getElementById("responseTime").innerHTML = request_time;
              }
              else {
                console.log("error");
              }
          };
          xmlhttp.open("POST", url, true);
          xmlhttp.onerror= function(e) {
              errorMessage();
          };
          xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          xmlhttp.send(JSON.stringify(data));
          return responseValues;
        }
    });
}

/*
* Gauge
*/
function gaugeGenerator(value, type){
  // Check values and set text for sentiment.
  if (type == "sentiment") {
    switch(true) {
        case value > 70:
            console.log("Positive");
            document.getElementById("sentimentText").innerHTML = "Positive";
            break;
        case value <= 70 && value > 50 :
            console.log("Neutral/Positive");
            document.getElementById("sentimentText").innerHTML = "Neutral/Positive";
            break;
        case value == 50:
            console.log("Neutral");
            document.getElementById("sentimentText").innerHTML = "Neutral";
            break;
        case value < 50 && value >= 30 :
            console.log("Neutral/Negative");
            document.getElementById("sentimentText").innerHTML = "Neutral/Negative";
            break;
        case value < 30:
            console.log("Negative");
            document.getElementById("sentimentText").innerHTML = "Negative";
            break;
        default:
            console.log("Can't calculate value.");
    }
  }
  // Set options for gauge.
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
    //colorStart: 'red',   // Colors
    colorStop: 'green',    // just experiment with them
    strokeColor: 'red',   // to see which ones work best for you
    generateGradient: false,
  };
  // Check type for gauge
  switch(true) {
      case type == "sentiment":
          var target = document.getElementById('sentiment');
          console.log("sentiment");
          break;
      case type == "reliability":
          var target = document.getElementById('reliabilityGauge');
          console.log("reliability");
          reliabilityValue = value;
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
/*
* Spelling Generator.
*/
function spellingRatingGenerator(spellingValue) {
  console.log("spellingValue", spellingValue);
  var starValue = (parseInt(spellingValue))/20;
  var starValueRounded = starValue.toFixed(0);
  console.log("starValue", starValueRounded);
  $('#example').barrating({
    theme: 'fontawesome-stars'
  });
  $('#example').barrating('set', starValueRounded);
  if(starValueRounded == 5) {
      document.getElementById("langRating").innerHTML = 'Exceptional';
  }
  if(starValueRounded == 4) {
      document.getElementById("langRating").innerHTML = 'Good';
  }
  if(starValueRounded == 3) {
      document.getElementById("langRating").innerHTML = 'Average';
  }
  if(starValueRounded == 2) {
      document.getElementById("langRating").innerHTML = 'Poor';
  }
  if(starValueRounded == 1) {
      document.getElementById("langRating").innerHTML = 'Terrible';
  }
}
/*
* Generate Emoji.
*/
function generateEmoji(emotionType, emotionValue) {
  switch(true) {
    case emotionType == "joy":
      document.getElementById("emotion").innerHTML = '<img src="images/joy.png" alt="Emoji Icon">';
      document.getElementById("emotionText").innerHTML = 'Joy';
    break;
    case emotionType == "disgust":
      document.getElementById("emotionText").innerHTML = 'Disgust';
      document.getElementById("emotion").innerHTML = '<img src="images/disgust.png" alt="Emoji Icon">';
    break;
    case emotionType == "anger":
      document.getElementById("emotionText").innerHTML = 'Anger';
      document.getElementById("emotion").innerHTML = '<img src="images/angry.png" alt="Emoji Icon">';
    break;
    case emotionType == "fear":
      document.getElementById("emotionText").innerHTML = 'Fear';
      document.getElementById("emotion").innerHTML = '<img src="images/fear.png" alt="Emoji Icon">';
    break;
    case emotionType == "sadness":
      document.getElementById("emotionText").innerHTML = 'Sadness';
      document.getElementById("emotion").innerHTML = '<img src="images/sadness.png" alt="Emoji Icon">';
    break;
    default:
        console.log("no match...");
  }
}
/*
* Weasel Words.
*/
function generateWeaselWords(weaselValues) {
  console.log("weaselValues", weaselValues);
  // Check if undefined.
  if (weaselValues === undefined) {
    weaselValues = "Nothing bad to say... the article looks fine.";
  }
  document.getElementById("weaselValue").innerHTML = weaselValues;
  // Add gauge.
}
/*
* Accuracy.
*/
function generateArticleReliability(reliabilityValue) {
  console.log("reliabilityValue", reliabilityValue);
  document.getElementById("reliabilityValue").innerHTML = reliabilityValue + "%";
  gaugeGenerator(reliabilityValue, "reliability");
}
/*
* Actiivity loader.
*/
function activityIndicator() {
  var opts = {
    lines: 13, // The number of lines to draw
    length: 14, // The length of each line
    width: 3, // The line thickness
    radius: 11, // The radius of the inner circle
    scale: 1, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#000', // #rgb or #rrggbb or array of colors
    opacity: 0.25, // Opacity of the lines
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '70%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    position: 'absolute', // Element positioning
  };
  var target = document.getElementById('spinner');
  var spinner = new Spinner(opts).spin(target);
}
/*
* Generate actors.
*/
function generateEntities(entitiesObejct) {
  // Loop through objects, detect type.
  for (var key in entitiesObejct) {
    // skip loop if the property is from prototype
    if (!entitiesObejct.hasOwnProperty(key)) continue;

    var obj = entitiesObejct[key];
    var entityType = obj.type;
    var entityValue = obj.text;
    // @TODO This creates a bug if URL does not exist.
    //var dbPediaURL = obj.disambiguated.dbpedia;

    var dbPediaURL = "#";

     // Check if organisation.
     if (entityType === "Organization") {
       $( "#actors" ).append( '<a href="' + dbPediaURL + '" target="_blank">' +
       '<div class="btn"><i class="fa fa-university"></i> ' +
       entityValue + '</div></a>');
     }
     // Check if person.
     else if (entityType === "Person") {
       $( "#actors" ).append( '<a href="' + dbPediaURL + '" target="_blank">' +
         '<div class="btn"><i class="fa fa-user"></i> ' +
       entityValue + '</div></a>');
     }
     // Check if Country.
     else if (entityType === "Country") {
       $( "#actors" ).append( '<a href="' + dbPediaURL + '" target="_blank">' +
         '<div class="btn"><i class="fa fa-globe"></i> ' +
       entityValue + '</div></a>');
     }
     // Check if job title
     else if (entityType === "JobTitle") {
       $( "#actors" ).append( '<a href="' + dbPediaURL + '" target="_blank">' +
         '<div class="btn"><i class="fa fa-briefcase"></i> ' +
       entityValue + '</div></a>');
     }
     // Check if job title
     else if (entityType === "Company") {
       $( "#actors" ).append( '<a href="' + dbPediaURL + '" target="_blank">' +
         '<div class="btn"><i class="fa fa-building"></i> ' +
       entityValue + '</div></a>');
     }
     else {
       $( "#actors" ).append( '<a href="' + dbPediaURL + '" target="_blank">' +
       '<div class="btn"><i class="fa fa-question"></i> ' +
       entityValue + '</div></a>');
     }

    console.log("object", entityValue);
    // for (var prop in obj) {
    //     // skip loop if the property is from prototype
    //     if(!obj.hasOwnProperty(prop)) continue;
    //     if () {
    //
    //     }
    //
    //     // your code
    //     console.log(prop + " = " + obj[prop]);
    // }
}
}
/*
* Actors
*/
function hideResults() {
  document.getElementById("results").style.display = 'none';
}
function showResults() {
  document.getElementById("results").style.display = 'block';
  document.getElementById("spinner").style.display = 'none';
}
function errorMessage(){
  showResults();
  document.getElementById("results").innerHTML = "<p>Problems connecting with server...</p>";
}
function errorMessageNoUrl(){
  showResults();
  document.getElementById("results").innerHTML = "<p>Please visit a web page...</p>";
}
